import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readData, withLock } from "@/lib/storage";
import type { Market, Bet, User } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { outcome } = await request.json();
  if (outcome !== "yes" && outcome !== "no") {
    return NextResponse.json(
      { error: "outcome must be 'yes' or 'no'" },
      { status: 400 }
    );
  }

  // Mark market as resolved
  let resolved: Market | null = null;
  let alreadyResolved = false;

  await withLock<Market>("markets", (markets) =>
    markets.map((m) => {
      if (m.id === params.id) {
        if (m.status === "resolved") {
          alreadyResolved = true;
          return m;
        }
        resolved = {
          ...m,
          status: "resolved",
          resolvedOutcome: outcome,
          resolvedAt: new Date().toISOString(),
        };
        return resolved;
      }
      return m;
    })
  );

  if (alreadyResolved) {
    return NextResponse.json({ error: "Market already resolved" }, { status: 400 });
  }

  if (!resolved) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  // Calculate and distribute payouts
  const bets = readData<Bet>("bets");
  const marketBets = bets.filter((b) => b.marketId === params.id);

  const winningOutcome = outcome as "yes" | "no";
  const winningBets = marketBets.filter((b) => b.outcome === winningOutcome);
  const winningPool = winningBets.reduce((s, b) => s + b.amount, 0);
  const totalPool = marketBets.reduce((s, b) => s + b.amount, 0);

  // Build payout map: userId -> amount to credit (skip house bets)
  const payouts: Record<string, number> = {};
  const realWinningBets = winningBets.filter((b) => b.userId !== "house");

  if (winningPool > 0 && totalPool > 0) {
    for (const bet of realWinningBets) {
      // Proportional share: (bet.amount / winningPool) * totalPool
      const payout = Math.floor((bet.amount / winningPool) * totalPool);
      payouts[bet.userId] = (payouts[bet.userId] || 0) + payout;
    }
  }
  // If no winning bets, the pool is lost (no one to pay out)

  // Credit winner balances
  if (Object.keys(payouts).length > 0) {
    await withLock<User>("users", (users) =>
      users.map((u) => {
        if (payouts[u.id]) {
          return { ...u, balance: u.balance + payouts[u.id] };
        }
        return u;
      })
    );
  }

  return NextResponse.json({
    ...(resolved as Market),
    payouts,
    totalPool,
    winningPool,
  });
}

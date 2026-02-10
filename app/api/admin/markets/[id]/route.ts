import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readData, withLock } from "@/lib/storage";
import type { Market, Bet, User } from "@/lib/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const markets = readData<Market>("markets");
  const market = markets.find((m) => m.id === params.id);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  // If market was open, refund bets to users (skip house bets)
  if (market.status === "open") {
    const bets = readData<Bet>("bets");
    const marketBets = bets.filter(
      (b) => b.marketId === params.id && b.userId !== "house"
    );

    if (marketBets.length > 0) {
      // Build refund map
      const refunds: Record<string, number> = {};
      for (const bet of marketBets) {
        refunds[bet.userId] = (refunds[bet.userId] || 0) + bet.amount;
      }

      await withLock<User>("users", (users) =>
        users.map((u) => {
          if (refunds[u.id]) {
            return { ...u, balance: u.balance + refunds[u.id] };
          }
          return u;
        })
      );
    }
  }

  // Remove all bets for this market
  await withLock<Bet>("bets", (bets) =>
    bets.filter((b) => b.marketId !== params.id)
  );

  // Remove the market
  await withLock<Market>("markets", (mkts) =>
    mkts.filter((m) => m.id !== params.id)
  );

  return NextResponse.json({ success: true });
}

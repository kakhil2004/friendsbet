import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readData, withLock, generateId } from "@/lib/storage";
import type { Market, Bet, User } from "@/lib/types";

function calculateUnderdogBonus(
  betOutcome: "yes" | "no",
  yesPool: number,
  noPool: number,
  betAmount: number
): number {
  const totalPool = yesPool + noPool;
  if (totalPool === 0) return 0; // No existing bets, no underdog

  const outcomePool = betOutcome === "yes" ? yesPool : noPool;
  const majorityPool = Math.max(yesPool, noPool);

  // User is on the underdog side if their outcome pool is the smaller one
  if (outcomePool >= majorityPool) return 0;

  const majorityPercent = (majorityPool / totalPool) * 100;
  const bonusPercent = Math.min(25, (majorityPercent - 50) * 0.5);
  if (bonusPercent <= 0) return 0;

  return Math.floor(betAmount * (bonusPercent / 100));
}

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { marketId?: string; outcome?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { marketId, outcome, amount } = body;

  if (!marketId || !outcome || amount == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (outcome !== "yes" && outcome !== "no") {
    return NextResponse.json({ error: "Outcome must be 'yes' or 'no'" }, { status: 400 });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive integer" }, { status: 400 });
  }

  // Check market exists and is open
  const markets = readData<Market>("markets");
  const market = markets.find((m) => m.id === marketId);
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.status !== "open") {
    return NextResponse.json({ error: "Market is not open" }, { status: 400 });
  }

  // Check balance (read fresh data)
  const users = readData<User>("users");
  const freshUser = users.find((u) => u.id === user.id);
  if (!freshUser || freshUser.balance < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Calculate current pools before placing bet (excluding house bets for bonus calc)
  const existingBets = readData<Bet>("bets");
  const marketBets = existingBets.filter((b) => b.marketId === marketId);
  const currentYesPool = marketBets.filter((b) => b.outcome === "yes").reduce((s, b) => s + b.amount, 0);
  const currentNoPool = marketBets.filter((b) => b.outcome === "no").reduce((s, b) => s + b.amount, 0);

  // Calculate underdog bonus based on pools BEFORE this bet
  const bonusAmount = calculateUnderdogBonus(
    outcome as "yes" | "no",
    currentYesPool,
    currentNoPool,
    amount
  );

  // Create user bet
  const bet: Bet = {
    id: generateId(),
    userId: user.id,
    marketId,
    outcome: outcome as "yes" | "no",
    amount,
    createdAt: new Date().toISOString(),
  };

  await withLock<Bet>("bets", (bets) => {
    const newBets = [...bets, bet];
    // Add house bonus bet if applicable
    if (bonusAmount > 0) {
      newBets.push({
        id: generateId(),
        userId: "house",
        marketId,
        outcome: outcome as "yes" | "no",
        amount: bonusAmount,
        createdAt: new Date().toISOString(),
      });
    }
    return newBets;
  });

  // Deduct balance
  let newBalance = 0;
  await withLock<User>("users", (allUsers) =>
    allUsers.map((u) => {
      if (u.id === user.id) {
        newBalance = u.balance - amount;
        return { ...u, balance: newBalance };
      }
      return u;
    })
  );

  // Calculate updated pools
  const allBets = readData<Bet>("bets");
  const updatedMarketBets = allBets.filter((b) => b.marketId === marketId);
  const yesPool = updatedMarketBets.filter((b) => b.outcome === "yes").reduce((s, b) => s + b.amount, 0);
  const noPool = updatedMarketBets.filter((b) => b.outcome === "no").reduce((s, b) => s + b.amount, 0);

  return NextResponse.json({
    bet,
    pool: { yesPool, noPool, totalPool: yesPool + noPool },
    newBalance,
    bonusAmount,
  });
}

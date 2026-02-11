import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readData } from "@/lib/storage";
import type { Market, Bet, User } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const markets = readData<Market>("markets");
  const market = markets.find((m) => m.id === params.id);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  const allBets = readData<Bet>("bets");
  const users = readData<User>("users");
  const marketBets = allBets.filter((b) => b.marketId === market.id);

  const yesPool = marketBets
    .filter((b) => b.outcome === "yes")
    .reduce((sum, b) => sum + b.amount, 0);
  const noPool = marketBets
    .filter((b) => b.outcome === "no")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalPool = yesPool + noPool;
  const winningOutcome = market.resolvedOutcome;

  // Filter out house bets from the displayed feed
  const userBets = marketBets.filter((b) => b.userId !== "house");

  // For payout calculation, use only real user bets on winning side as denominator
  const realWinningPool = userBets
    .filter((b) => b.outcome === winningOutcome)
    .reduce((s, b) => s + b.amount, 0);

  const betsWithNames = userBets
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((bet) => {
      const betUser = users.find((u) => u.id === bet.userId);
      let payout: number | null = null;
      if (market.status === "resolved" && realWinningPool > 0 && totalPool > 0) {
        if (bet.outcome === winningOutcome) {
          payout = Math.floor((bet.amount / realWinningPool) * totalPool);
        } else {
          payout = 0;
        }
      }
      return {
        ...bet,
        displayName: betUser?.displayName ?? "Unknown",
        payout,
      };
    });

  return NextResponse.json({
    ...market,
    yesPool,
    noPool,
    totalPool,
    bets: betsWithNames,
  });
}

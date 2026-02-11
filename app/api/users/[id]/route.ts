import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readData } from "@/lib/storage";
import type { User, Bet, Market } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const currentUser = getUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = readData<User>("users");
  const targetUser = users.find((u) => u.id === params.id);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const allBets = readData<Bet>("bets").filter(
    (b) => b.userId === params.id
  );
  const markets = readData<Market>("markets");

  // Calculate rank (exclude admins)
  const sorted = [...users].filter((u) => !u.isAdmin).sort((a, b) => b.balance - a.balance);
  const rank = targetUser.isAdmin ? 0 : sorted.findIndex((u) => u.id === params.id) + 1;

  const betsWithDetails = allBets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((bet) => {
      const market = markets.find((m) => m.id === bet.marketId);
      let payout: number | null = null;

      if (market && market.status === "resolved") {
        const marketBets = readData<Bet>("bets").filter(
          (b) => b.marketId === market.id
        );
        const winningOutcome = market.resolvedOutcome;
        // Exclude house bets from winning pool denominator
        const realWinningPool = marketBets
          .filter((b) => b.outcome === winningOutcome && b.userId !== "house")
          .reduce((s, b) => s + b.amount, 0);
        const totalPool = marketBets.reduce((s, b) => s + b.amount, 0);

        if (bet.outcome === winningOutcome && realWinningPool > 0) {
          payout = Math.floor((bet.amount / realWinningPool) * totalPool);
        } else {
          payout = 0;
        }
      }

      return {
        ...bet,
        marketQuestion: market?.question ?? "Unknown market",
        marketStatus: market?.status ?? "open",
        resolvedOutcome: market?.resolvedOutcome ?? null,
        payout,
      };
    });

  return NextResponse.json({
    displayName: targetUser.displayName,
    balance: targetUser.balance,
    rank,
    bets: betsWithDetails,
  });
}

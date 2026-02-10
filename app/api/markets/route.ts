import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readData } from "@/lib/storage";
import type { Market, Bet } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const markets = readData<Market>("markets");
  const bets = readData<Bet>("bets");

  const marketsWithPools = markets.map((market) => {
    const marketBets = bets.filter((b) => b.marketId === market.id);
    const yesPool = marketBets
      .filter((b) => b.outcome === "yes")
      .reduce((sum, b) => sum + b.amount, 0);
    const noPool = marketBets
      .filter((b) => b.outcome === "no")
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      ...market,
      yesPool,
      noPool,
      totalPool: yesPool + noPool,
    };
  });

  // Sort: open first, then resolved, each group by createdAt descending
  marketsWithPools.sort((a, b) => {
    if (a.status === "open" && b.status !== "open") return -1;
    if (a.status !== "open" && b.status === "open") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json({ markets: marketsWithPools });
}

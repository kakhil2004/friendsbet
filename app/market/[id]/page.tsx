import type { Metadata } from "next";
import { readData } from "@/lib/storage";
import type { Market, Bet } from "@/lib/types";
import MarketClient from "./MarketClient";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const markets = readData<Market>("markets");
  const market = markets.find((m) => m.id === params.id);

  if (!market) {
    return { title: "Market Not Found — FriendBets" };
  }

  const bets = readData<Bet>("bets").filter((b) => b.marketId === market.id);
  const yesPool = bets.filter((b) => b.outcome === "yes").reduce((s, b) => s + b.amount, 0);
  const noPool = bets.filter((b) => b.outcome === "no").reduce((s, b) => s + b.amount, 0);
  const totalPool = yesPool + noPool;
  const yesPercent = totalPool > 0 ? Math.round((yesPool / totalPool) * 100) : 50;
  const noPercent = 100 - yesPercent;

  let status = market.status === "resolved"
    ? `Resolved: ${market.resolvedOutcome?.toUpperCase()}`
    : "Open";

  if (market.status === "open" && market.closesAt) {
    const ms = new Date(market.closesAt).getTime() - Date.now();
    if (ms <= 0) {
      status = "Betting closed";
    } else {
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      status = hours > 0 ? `Closes in ${hours}h ${minutes}m` : `Closes in ${minutes}m`;
    }
  }

  const description = `YES ${yesPercent}% | NO ${noPercent}% | Pool: ${totalPool} coins | ${status}`;

  return {
    title: `${market.question} — FriendBets`,
    description,
    openGraph: {
      title: market.question,
      description,
      siteName: "FriendBets",
    },
  };
}

export default function MarketPage({ params }: Props) {
  return <MarketClient marketId={params.id} />;
}

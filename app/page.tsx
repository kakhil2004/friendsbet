"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MarketWithPool {
  id: string;
  question: string;
  status: "open" | "resolved";
  resolvedOutcome: "yes" | "no" | null;
  createdAt: string;
  yesPool: number;
  noPool: number;
  totalPool: number;
}

interface UserInfo {
  displayName: string;
  balance: number;
  isAdmin: boolean;
}

export default function Home() {
  const [markets, setMarkets] = useState<MarketWithPool[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [userRes, marketsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/markets"),
      ]);

      if (userRes.ok) {
        setUser(await userRes.json());
      }
      if (marketsRes.ok) {
        const data = await marketsRes.json();
        setMarkets(data.markets);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const openMarkets = markets.filter((m) => m.status === "open");
  const resolvedMarkets = markets.filter((m) => m.status === "resolved");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Balance */}
      {user && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 flex items-center justify-between">
          <span className="text-gray-400">
            Welcome, <span className="text-gray-200 font-medium">{user.displayName}</span>
          </span>
          <span className="text-primary-400 font-mono font-semibold text-lg">
            {user.balance} coins
          </span>
        </div>
      )}

      {/* Open Markets */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">
          Open Markets
        </h2>
        {openMarkets.length === 0 ? (
          <p className="text-gray-500">No open markets yet.</p>
        ) : (
          <div className="space-y-3">
            {openMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>

      {/* Resolved Markets */}
      {resolvedMarkets.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            Recently Resolved
          </h2>
          <div className="space-y-3">
            {resolvedMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MarketCard({ market }: { market: MarketWithPool }) {
  const yesPercent =
    market.totalPool > 0
      ? Math.round((market.yesPool / market.totalPool) * 100)
      : 50;
  const noPercent = 100 - yesPercent;

  return (
    <Link href={`/market/${market.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <p className="font-medium text-gray-200 flex-1">{market.question}</p>
          {market.status === "resolved" && (
            <span
              className={`ml-3 text-xs px-2 py-0.5 rounded font-medium ${
                market.resolvedOutcome === "yes"
                  ? "bg-green-900 text-green-300"
                  : "bg-red-900 text-red-300"
              }`}
            >
              {market.resolvedOutcome?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Pool bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-400 w-16 text-right">
            Yes {yesPercent}%
          </span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 h-full"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="bg-red-500 h-full"
              style={{ width: `${noPercent}%` }}
            />
          </div>
          <span className="text-red-400 w-16">No {noPercent}%</span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Pool: {market.totalPool} coins
        </p>
      </div>
    </Link>
  );
}

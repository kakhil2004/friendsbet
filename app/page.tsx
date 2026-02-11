"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface MarketWithPool {
  id: string;
  question: string;
  status: "open" | "resolved";
  resolvedOutcome: "yes" | "no" | null;
  closesAt: string | null;
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
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 flex items-center justify-between gap-2">
          <span className="text-gray-400 text-sm sm:text-base truncate">
            Welcome, <span className="text-gray-200 font-medium">{user.displayName}</span>
          </span>
          <span className="text-primary-400 font-mono font-semibold text-sm sm:text-lg shrink-0">
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

function useCountdown(closesAt: string | null) {
  const format = useCallback((ms: number) => {
    if (ms <= 0) return "Betting closed";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h left`;
    if (h > 0) return `${h}h ${m % 60}m left`;
    if (m > 0) return `${m}m ${s % 60}s left`;
    return `${s}s left`;
  }, []);

  const [label, setLabel] = useState<string | null>(() => {
    if (!closesAt) return null;
    return format(new Date(closesAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!closesAt) { setLabel(null); return; }
    const tick = () => setLabel(format(new Date(closesAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt, format]);

  return label;
}

function MarketCard({ market }: { market: MarketWithPool }) {
  const yesPercent =
    market.totalPool > 0
      ? Math.round((market.yesPool / market.totalPool) * 100)
      : 50;
  const noPercent = 100 - yesPercent;
  const countdown = useCountdown(market.status === "open" ? market.closesAt : null);
  const expired = countdown === "Betting closed";

  return (
    <Link href={`/market/${market.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-gray-700 transition-colors cursor-pointer">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-3">
          <p className="font-medium text-gray-200 text-sm sm:text-base flex-1">{market.question}</p>
          <div className="flex items-center gap-2 shrink-0">
            {market.status === "resolved" && (
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  market.resolvedOutcome === "yes"
                    ? "bg-green-900 text-green-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {market.resolvedOutcome?.toUpperCase()}
              </span>
            )}
            {countdown && (
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                  expired
                    ? "bg-red-900 text-red-300"
                    : "bg-yellow-900 text-yellow-300"
                }`}
              >
                {countdown}
              </span>
            )}
          </div>
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

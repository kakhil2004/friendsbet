"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BetDetail {
  id: string;
  marketId: string;
  outcome: "yes" | "no";
  amount: number;
  createdAt: string;
  marketQuestion: string;
  marketStatus: "open" | "resolved";
  resolvedOutcome: "yes" | "no" | null;
  payout: number | null;
}

interface ProfileData {
  displayName: string;
  balance: number;
  rank: number;
  bets: BetDetail[];
}

export default function ProfileClient({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) {
        setError(res.status === 404 ? "User not found" : "Failed to load");
        setLoading(false);
        return;
      }
      setProfile(await res.json());
      setLoading(false);
    }
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="text-primary-400 hover:text-primary-300 text-sm">
          &larr; Back
        </Link>
      </div>
    );
  }

  const openBets = profile.bets.filter((b) => b.marketStatus === "open");
  const resolvedBets = profile.bets.filter((b) => b.marketStatus === "resolved");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-gray-400 hover:text-gray-200 text-sm mb-6 inline-block"
      >
        &larr; Back
      </Link>

      {/* Profile header */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          {profile.displayName}
        </h1>
        <div className="flex gap-6 text-sm">
          <span className="text-primary-400 font-mono font-semibold">
            {profile.balance} coins
          </span>
          <span className="text-gray-400">
            Rank #{profile.rank}
          </span>
          <span className="text-gray-500">
            {profile.bets.length} total bets
          </span>
        </div>
      </div>

      {/* Open bets */}
      {openBets.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Open Positions ({openBets.length})
          </h2>
          <div className="space-y-2">
            {openBets.map((bet) => (
              <Link
                key={bet.id}
                href={`/market/${bet.marketId}`}
                className="flex items-center justify-between bg-gray-800 rounded-md px-4 py-3 text-sm hover:bg-gray-750 transition-colors block"
              >
                <div>
                  <p className="text-gray-200 font-medium">{bet.marketQuestion}</p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                      bet.outcome === "yes"
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {bet.outcome.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-mono">{bet.amount} coins</span>
                  <p className="text-xs text-yellow-400 mt-1">Pending</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Resolved bets */}
      {resolvedBets.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Resolved Bets ({resolvedBets.length})
          </h2>
          <div className="space-y-2">
            {resolvedBets.map((bet) => (
              <Link
                key={bet.id}
                href={`/market/${bet.marketId}`}
                className="flex items-center justify-between bg-gray-800 rounded-md px-4 py-3 text-sm hover:bg-gray-750 transition-colors block"
              >
                <div>
                  <p className="text-gray-200 font-medium">{bet.marketQuestion}</p>
                  <div className="flex gap-2 mt-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        bet.outcome === "yes"
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {bet.outcome.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 font-mono">{bet.amount} coins</span>
                  {bet.payout !== null && (
                    <p
                      className={`text-xs font-mono mt-1 ${
                        bet.payout > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {bet.payout > 0 ? `+${bet.payout} won` : "Lost"}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {profile.bets.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-500 text-center">No bets yet.</p>
        </div>
      )}
    </div>
  );
}

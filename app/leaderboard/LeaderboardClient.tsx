"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  displayName: string;
  balance: number;
}

export default function LeaderboardClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Leaderboard</h1>
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-sm"
        >
          &larr; Back
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {entries.length === 0 ? (
          <p className="text-gray-500 p-6 text-center">No users yet.</p>
        ) : (
          <div>
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  index !== entries.length - 1 ? "border-b border-gray-800" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 text-center font-bold text-lg ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                        ? "text-gray-300"
                        : index === 2
                        ? "text-amber-600"
                        : "text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <Link
                    href={`/profile/${entry.id}`}
                    className="text-gray-200 font-medium hover:text-primary-400 transition-colors"
                  >
                    {entry.displayName}
                  </Link>
                </div>
                <span className="text-primary-400 font-mono font-semibold">
                  {entry.balance} coins
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

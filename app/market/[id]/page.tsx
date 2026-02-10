"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface BetWithName {
  id: string;
  userId: string;
  marketId: string;
  outcome: "yes" | "no";
  amount: number;
  createdAt: string;
  displayName: string;
  payout: number | null;
}

interface MarketDetail {
  id: string;
  question: string;
  description: string;
  status: "open" | "resolved";
  resolvedOutcome: "yes" | "no" | null;
  createdAt: string;
  resolvedAt: string | null;
  yesPool: number;
  noPool: number;
  totalPool: number;
  bets: BetWithName[];
}

function calculatePotentialPayout(
  betAmount: number,
  outcomePool: number,
  totalPool: number
): number {
  if (betAmount <= 0) return 0;
  return betAmount * (totalPool + betAmount) / (outcomePool + betAmount);
}

export default function MarketDetailPage() {
  const params = useParams();
  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Betting form state
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [betError, setBetError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [bonusMessage, setBonusMessage] = useState("");

  const fetchMarket = useCallback(async () => {
    const res = await fetch(`/api/markets/${params.id}`);
    if (!res.ok) {
      setError(res.status === 404 ? "Market not found" : "Failed to load");
      setLoading(false);
      return;
    }
    setMarket(await res.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  // Fetch user balance
  useEffect(() => {
    async function fetchBalance() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.balance);
      }
    }
    fetchBalance();
  }, []);

  async function placeBet() {
    const amountNum = parseInt(amount, 10);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setBetError("Enter a positive whole number");
      return;
    }
    setBetError("");
    setBonusMessage("");
    setPlacing(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: params.id, outcome, amount: amountNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBetError(data.error || "Failed to place bet");
        return;
      }
      setUserBalance(data.newBalance);
      setAmount("");
      if (data.bonusAmount > 0) {
        setBonusMessage(`Underdog bonus: +${data.bonusAmount} coins added to pool!`);
      }
      // Refresh market data to show updated pools and new bet
      await fetchMarket();
    } catch {
      setBetError("Network error");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="text-primary-400 hover:text-primary-300 text-sm">
          &larr; Back to markets
        </Link>
      </div>
    );
  }

  const yesPercent =
    market.totalPool > 0
      ? Math.round((market.yesPool / market.totalPool) * 100)
      : 50;
  const noPercent = 100 - yesPercent;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-gray-400 hover:text-gray-200 text-sm mb-6 inline-block"
      >
        &larr; Back to markets
      </Link>

      {/* Market header */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-100">{market.question}</h1>
          {market.status === "resolved" && (
            <span
              className={`ml-3 text-sm px-3 py-1 rounded font-medium shrink-0 ${
                market.resolvedOutcome === "yes"
                  ? "bg-green-900 text-green-300"
                  : "bg-red-900 text-red-300"
              }`}
            >
              Resolved: {market.resolvedOutcome?.toUpperCase()}
            </span>
          )}
          {market.status === "open" && (
            <span className="ml-3 text-sm px-3 py-1 rounded font-medium bg-primary-900 text-primary-300 shrink-0">
              Open
            </span>
          )}
        </div>

        {/* Description */}
        {market.description && (
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {market.description}
          </p>
        )}

        {/* Pool visualization */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-400 font-medium">
              Yes — {market.yesPool} coins ({yesPercent}%)
            </span>
            <span className="text-red-400 font-medium">
              No — {market.noPool} coins ({noPercent}%)
            </span>
          </div>
          <div className="h-6 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-green-600 h-full transition-all"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="bg-red-600 h-full transition-all"
              style={{ width: `${noPercent}%` }}
            />
          </div>
          <p className="text-center text-gray-500 text-sm mt-2">
            Total pool: {market.totalPool} coins
          </p>
        </div>

        {/* Betting form */}
        {market.status === "open" && (
          <div className="border border-gray-700 rounded-md p-4">
            <h3 className="text-gray-200 font-semibold mb-3">Place a Bet</h3>

            {/* Outcome toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setOutcome("yes")}
                className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${
                  outcome === "yes"
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setOutcome("no")}
                className={`flex-1 py-2 rounded font-medium text-sm transition-colors ${
                  outcome === "no"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                NO
              </button>
            </div>

            {/* Amount input */}
            <div className="mb-3">
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Amount (coins)"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setBetError(""); setBonusMessage(""); }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              {userBalance !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {userBalance} coins
                </p>
              )}
            </div>

            {/* Potential payout */}
            {amount && parseInt(amount, 10) > 0 && (
              <p className="text-sm text-gray-400 mb-3">
                Potential payout:{" "}
                <span className="text-gray-200 font-medium">
                  {calculatePotentialPayout(
                    parseInt(amount, 10),
                    outcome === "yes" ? market.yesPool : market.noPool,
                    market.totalPool
                  ).toFixed(1)}{" "}
                  coins
                </span>
              </p>
            )}

            {betError && (
              <p className="text-red-400 text-sm mb-3">{betError}</p>
            )}

            {bonusMessage && (
              <p className="text-yellow-400 text-sm mb-3 font-medium">{bonusMessage}</p>
            )}

            <button
              onClick={placeBet}
              disabled={placing}
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded text-sm transition-colors"
            >
              {placing ? "Placing..." : "Place Bet"}
            </button>
          </div>
        )}
      </div>

      {/* Recent bets */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          Recent Bets
        </h2>
        {market.bets.length === 0 ? (
          <p className="text-gray-500 text-sm">No bets yet.</p>
        ) : (
          <div className="space-y-2">
            {market.bets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between bg-gray-800 rounded-md px-4 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${bet.userId}`}
                    className="text-gray-300 font-medium hover:text-primary-400 transition-colors"
                  >
                    {bet.displayName}
                  </Link>
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
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono">
                    {bet.amount} coins
                  </span>
                  {bet.payout !== null && (
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        bet.payout > 0
                          ? "bg-green-900/50 text-green-300"
                          : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {bet.payout > 0 ? `+${bet.payout}` : "0"} won
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

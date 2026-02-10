"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [walletKey, setWalletKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletKey: walletKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("wallet_key", walletKey.trim());
      router.push("/");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-primary-400 mb-8">
          FriendBets
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-lg p-6 space-y-4 border border-gray-800"
        >
          <div>
            <label
              htmlFor="walletKey"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Wallet Key
            </label>
            <input
              id="walletKey"
              type="text"
              value={walletKey}
              onChange={(e) => setWalletKey(e.target.value)}
              placeholder="Enter your wallet key"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !walletKey.trim()}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center text-gray-500 text-xs mt-4">
          Ask your group admin for a wallet key
        </p>
      </div>
    </div>
  );
}

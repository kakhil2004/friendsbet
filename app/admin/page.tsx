"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  walletKey: string;
  displayName: string;
  isAdmin: boolean;
  balance: number;
}

interface Market {
  id: string;
  question: string;
  description: string;
  status: "open" | "resolved";
  resolvedOutcome: "yes" | "no" | null;
  closesAt: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newClosesAt, setNewClosesAt] = useState("");
  const [editingTimer, setEditingTimer] = useState<string | null>(null);
  const [editTimerValue, setEditTimerValue] = useState("");
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [giveAllAmount, setGiveAllAmount] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function fetchData() {
    const [usersRes, marketsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/markets"),
    ]);

    if (usersRes.status === 403) {
      router.push("/");
      return;
    }

    setUsers(await usersRes.json());
    setMarkets(await marketsRes.json());
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: newUserName.trim() }),
    });
    if (!res.ok) {
      setError("Failed to create user");
      return;
    }
    setNewUserName("");
    fetchData();
  }

  async function createMarket(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/markets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: newQuestion.trim(),
        description: newDescription.trim(),
        closesAt: newClosesAt ? new Date(newClosesAt).toISOString() : undefined,
      }),
    });
    if (!res.ok) {
      setError("Failed to create market");
      return;
    }
    setNewQuestion("");
    setNewDescription("");
    setNewClosesAt("");
    fetchData();
  }

  async function resolveMarket(id: string, outcome: "yes" | "no") {
    const res = await fetch(`/api/admin/markets/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    if (!res.ok) {
      setError("Failed to resolve market");
      return;
    }
    fetchData();
  }

  async function adjustBalance(userId: string, mode: "add" | "set", overrideAmount?: number) {
    const num = overrideAmount ?? parseInt(balanceAmount, 10);
    if (isNaN(num)) { setError("Enter a valid number"); return; }
    const res = await fetch("/api/admin/users/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: num, mode }),
    });
    if (!res.ok) { setError("Failed to update balance"); return; }
    setEditingBalance(null);
    setBalanceAmount("");
    fetchData();
  }

  async function giveAll() {
    const num = parseInt(giveAllAmount, 10);
    if (isNaN(num) || num === 0) { setError("Enter a non-zero number"); return; }
    const res = await fetch("/api/admin/users/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: num, mode: "add_all" }),
    });
    if (!res.ok) { setError("Failed to update balances"); return; }
    setGiveAllAmount("");
    fetchData();
  }

  async function updateTimer(id: string) {
    const res = await fetch(`/api/admin/markets/${id}/timer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closesAt: editTimerValue ? new Date(editTimerValue).toISOString() : null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update timer");
      return;
    }
    setEditingTimer(null);
    setEditTimerValue("");
    fetchData();
  }

  async function deleteMarket(id: string) {
    if (!window.confirm("Are you sure you want to delete this market? Open market bets will be refunded.")) {
      return;
    }
    const res = await fetch(`/api/admin/markets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Failed to delete market");
      return;
    }
    fetchData();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-400">Admin Dashboard</h1>
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-gray-200 text-sm"
        >
          &larr; Back
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded mb-6">
          {error}
        </div>
      )}

      {/* Create User */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Create User</h2>
        <form onSubmit={createUser} className="flex gap-3">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Display name"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={!newUserName.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
          >
            Create
          </button>
        </form>
      </section>

      {/* Users List */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-200">
            Users ({users.length})
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={giveAllAmount}
              onChange={(e) => setGiveAllAmount(e.target.value)}
              placeholder="Amount"
              className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={giveAll}
              disabled={!giveAllAmount}
              className="px-3 py-1 text-sm bg-primary-700 hover:bg-primary-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors whitespace-nowrap"
            >
              Give All
            </button>
          </div>
        </div>
        {users.length === 0 ? (
          <p className="text-gray-500">No users yet</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-gray-800 rounded-md px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-200">
                      {user.displayName}
                    </span>
                    {user.isAdmin && (
                      <span className="ml-2 text-xs bg-primary-900 text-primary-300 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    <p className="text-xs text-gray-500 font-mono mt-1 truncate max-w-[150px] sm:max-w-none">
                      Key: {user.walletKey}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono">
                      {user.balance} coins
                    </span>
                    <button
                      onClick={() => {
                        setEditingBalance(editingBalance === user.id ? null : user.id);
                        setBalanceAmount("");
                      }}
                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                {editingBalance === user.id && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                    <input
                      type="number"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none"
                    />
                    <button
                      onClick={() => adjustBalance(user.id, "add")}
                      className="px-2 py-1.5 text-xs bg-green-800 hover:bg-green-700 text-green-200 rounded"
                    >
                      +Add
                    </button>
                    <button
                      onClick={() => adjustBalance(user.id, "add", -Math.abs(parseInt(balanceAmount, 10) || 0))}
                      className="px-2 py-1.5 text-xs bg-red-800 hover:bg-red-700 text-red-200 rounded"
                    >
                      -Remove
                    </button>
                    <button
                      onClick={() => adjustBalance(user.id, "set")}
                      className="px-2 py-1.5 text-xs bg-yellow-800 hover:bg-yellow-700 text-yellow-200 rounded"
                    >
                      Set To
                    </button>
                    <button
                      onClick={() => { setEditingBalance(null); setBalanceAmount(""); }}
                      className="px-2 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Market */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Create Market</h2>
        <form onSubmit={createMarket} className="space-y-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Will the Lakers win tonight?"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional description or context..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Betting cutoff (optional)</label>
            <input
              type="datetime-local"
              value={newClosesAt}
              onChange={(e) => setNewClosesAt(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newQuestion.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-md transition-colors"
          >
            Create
          </button>
        </form>
      </section>

      {/* Markets List */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">
          Markets ({markets.length})
        </h2>
        {markets.length === 0 ? (
          <p className="text-gray-500">No markets yet</p>
        ) : (
          <div className="space-y-3">
            {markets.map((market) => (
              <div
                key={market.id}
                className="bg-gray-800 rounded-md px-3 sm:px-4 py-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-200">
                      {market.question}
                    </p>
                    {market.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {market.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {market.status === "resolved"
                        ? `Resolved: ${market.resolvedOutcome?.toUpperCase()}`
                        : "Open"}
                      {market.status === "open" && market.closesAt && (
                        <span className="ml-2 text-yellow-400">
                          Closes: {new Date(market.closesAt).toLocaleString()}
                        </span>
                      )}
                    </p>
                    {market.status === "open" && editingTimer === market.id && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <input
                          type="datetime-local"
                          value={editTimerValue}
                          onChange={(e) => setEditTimerValue(e.target.value)}
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => updateTimer(market.id)}
                          className="px-2 py-1 text-xs bg-primary-700 hover:bg-primary-600 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingTimer(null); setEditTimerValue(""); }}
                          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {market.status === "open" && (
                      <>
                        <button
                          onClick={() => {
                            setEditingTimer(editingTimer === market.id ? null : market.id);
                            if (market.closesAt) {
                              const d = new Date(market.closesAt);
                              const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                              setEditTimerValue(local);
                            } else {
                              setEditTimerValue("");
                            }
                          }}
                          className="px-3 py-1 text-sm bg-yellow-800 hover:bg-yellow-700 text-yellow-200 rounded transition-colors"
                        >
                          Timer
                        </button>
                        <button
                          onClick={() => resolveMarket(market.id, "yes")}
                          className="px-3 py-1 text-sm bg-green-800 hover:bg-green-700 text-green-200 rounded transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => resolveMarket(market.id, "no")}
                          className="px-3 py-1 text-sm bg-red-800 hover:bg-red-700 text-red-200 rounded transition-colors"
                        >
                          No
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteMarket(market.id)}
                      className="px-2 py-1 text-sm bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors"
                      title="Delete market"
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface UserInfo {
  displayName: string;
  balance: number;
  isAdmin: boolean;
}

export default function NavBar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (isLogin) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data));
  }, [isLogin]);

  if (isLogin) return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("wallet_key");
    router.push("/login");
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-primary-400 font-bold text-lg hover:text-primary-300 transition-colors"
          >
            FriendBets
          </Link>
          <Link
            href="/leaderboard"
            className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/how-it-works"
            className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            How It Works
          </Link>
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              Admin
            </Link>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-primary-400 font-mono text-sm">
              {user.balance} coins
            </span>
            <span className="text-gray-500 text-sm">{user.displayName}</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (isLogin) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data));
  }, [isLogin]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (isLogin) return null;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("wallet_key");
    router.push("/login");
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-primary-400 font-bold text-lg hover:text-primary-300 transition-colors shrink-0"
        >
          FriendBets
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
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

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-4">
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

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-gray-400 hover:text-gray-200 p-1"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-800 px-4 py-3 space-y-3">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-gray-300 text-sm">{user.displayName}</span>
              <span className="text-primary-400 font-mono text-sm">{user.balance} coins</span>
            </div>
          )}
          <Link href="/leaderboard" className="block text-gray-400 hover:text-gray-200 text-sm py-1">
            Leaderboard
          </Link>
          <Link href="/how-it-works" className="block text-gray-400 hover:text-gray-200 text-sm py-1">
            How It Works
          </Link>
          {user?.isAdmin && (
            <Link href="/admin" className="block text-gray-400 hover:text-gray-200 text-sm py-1">
              Admin
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="block text-gray-500 hover:text-gray-300 text-sm py-1"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

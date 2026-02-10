import { NextRequest, NextResponse } from "next/server";
import { getUserByWalletKey } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { walletKey } = await request.json();

  if (!walletKey || typeof walletKey !== "string") {
    return NextResponse.json({ error: "Wallet key required" }, { status: 400 });
  }

  const user = getUserByWalletKey(walletKey.trim());
  if (!user) {
    return NextResponse.json({ error: "Invalid wallet key" }, { status: 401 });
  }

  const response = NextResponse.json({
    id: user.id,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    balance: user.balance,
  });

  response.cookies.set("wallet_key", walletKey.trim(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

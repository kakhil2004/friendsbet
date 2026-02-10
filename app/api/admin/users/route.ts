import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, generateWalletKey } from "@/lib/auth";
import { readData, withLock, generateId } from "@/lib/storage";
import type { User } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = readData<User>("users");
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { displayName } = await request.json();
  if (!displayName || typeof displayName !== "string") {
    return NextResponse.json({ error: "displayName required" }, { status: 400 });
  }

  const walletKey = generateWalletKey();
  const newUser: User = {
    id: generateId(),
    walletKey,
    displayName: displayName.trim(),
    isAdmin: false,
    balance: 1000,
    createdAt: new Date().toISOString(),
  };

  await withLock<User>("users", (users) => [...users, newUser]);

  return NextResponse.json(newUser, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withLock } from "@/lib/storage";
import type { User } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount, mode } = await request.json();

  // mode: "set" = set exact balance, "add" = add/subtract, "add_all" = add to all non-admin users
  if (!mode || !["set", "add", "add_all"].includes(mode)) {
    return NextResponse.json({ error: "mode must be 'set', 'add', or 'add_all'" }, { status: 400 });
  }

  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    return NextResponse.json({ error: "amount must be an integer" }, { status: 400 });
  }

  if (mode === "add_all") {
    let count = 0;
    await withLock<User>("users", (users) =>
      users.map((u) => {
        if (!u.isAdmin) {
          count++;
          return { ...u, balance: Math.max(0, u.balance + amount) };
        }
        return u;
      })
    );
    return NextResponse.json({ updated: count, amount });
  }

  // Single user operations
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  let found = false;
  let newBalance = 0;
  await withLock<User>("users", (users) =>
    users.map((u) => {
      if (u.id === userId) {
        found = true;
        if (mode === "set") {
          newBalance = Math.max(0, amount);
        } else {
          newBalance = Math.max(0, u.balance + amount);
        }
        return { ...u, balance: newBalance };
      }
      return u;
    })
  );

  if (!found) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ userId, newBalance });
}

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readData } from "@/lib/storage";
import type { User } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const users = readData<User>("users");
  const leaderboard = users
    .filter((u) => !u.isAdmin)
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      balance: u.balance,
    }))
    .sort((a, b) => b.balance - a.balance);

  return NextResponse.json({ leaderboard });
}

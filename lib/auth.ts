import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { readData } from "./storage";
import type { User } from "./types";

const COOKIE_NAME = "wallet_key";

export function generateWalletKey(): string {
  return randomBytes(16).toString("hex");
}

export function getUserByWalletKey(walletKey: string): User | null {
  const users = readData<User>("users");
  return users.find((u) => u.walletKey === walletKey) || null;
}

export function getCurrentUser(): User | null {
  const cookieStore = cookies();
  const key = cookieStore.get(COOKIE_NAME)?.value;
  if (!key) return null;
  return getUserByWalletKey(key);
}

export function getUserFromRequest(request: Request): User | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return getUserByWalletKey(match[1]);
}

export function requireAdmin(request: Request): User {
  const user = getUserFromRequest(request);
  if (!user) throw new Error("Unauthorized");
  if (!user.isAdmin) throw new Error("Forbidden");
  return user;
}

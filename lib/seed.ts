import { readData, writeData, generateId } from "./storage";
import { generateWalletKey } from "./auth";
import type { User } from "./types";

let seeded = false;

export function seedAdminIfNeeded() {
  if (seeded) return;
  seeded = true;

  const users = readData<User>("users");
  if (users.length > 0) return;

  const walletKey = generateWalletKey();
  const admin: User = {
    id: generateId(),
    walletKey,
    displayName: "Admin",
    isAdmin: true,
    balance: 1000,
    createdAt: new Date().toISOString(),
  };

  writeData("users", [admin]);
  console.log("\n========================================");
  console.log("  ADMIN WALLET KEY (save this!):");
  console.log(`  ${walletKey}`);
  console.log("========================================\n");
}

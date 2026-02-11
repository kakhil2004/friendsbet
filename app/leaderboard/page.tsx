import type { Metadata } from "next";
import { readData } from "@/lib/storage";
import type { User } from "@/lib/types";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const users = readData<User>("users")
    .filter((u) => !u.isAdmin)
    .sort((a, b) => b.balance - a.balance);

  const top3 = users.slice(0, 3).map((u, i) => `#${i + 1} ${u.displayName} (${u.balance})`);
  const description = top3.length > 0
    ? `${top3.join(" | ")} | ${users.length} players`
    : "No players yet";

  return {
    title: "Leaderboard — FriendBets",
    description,
    openGraph: {
      title: "Leaderboard — FriendBets",
      description,
      siteName: "FriendBets",
    },
  };
}

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}

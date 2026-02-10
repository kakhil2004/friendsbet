import type { Metadata } from "next";
import { readData } from "@/lib/storage";
import type { User, Bet } from "@/lib/types";
import ProfileClient from "./ProfileClient";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const users = readData<User>("users");
  const user = users.find((u) => u.id === params.id);

  if (!user) {
    return { title: "User Not Found — FriendBets" };
  }

  const bets = readData<Bet>("bets").filter((b) => b.userId === params.id);
  const sorted = [...users].filter((u) => !u.isAdmin).sort((a, b) => b.balance - a.balance);
  const rank = user.isAdmin ? 0 : sorted.findIndex((u) => u.id === params.id) + 1;

  const rankText = rank > 0 ? `Rank #${rank}` : "Admin";
  const description = `${rankText} | ${user.balance} coins | ${bets.length} bets`;

  return {
    title: `${user.displayName} — FriendBets`,
    description,
    openGraph: {
      title: `${user.displayName} — FriendBets`,
      description,
      siteName: "FriendBets",
    },
  };
}

export default function ProfilePage({ params }: Props) {
  return <ProfileClient userId={params.id} />;
}

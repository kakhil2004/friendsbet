export interface User {
  id: string;
  walletKey: string;
  displayName: string;
  isAdmin: boolean;
  balance: number;
  createdAt: string;
}

export interface Market {
  id: string;
  question: string;
  description: string;
  status: "open" | "resolved";
  resolvedOutcome: "yes" | "no" | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Bet {
  id: string;
  userId: string;
  marketId: string;
  outcome: "yes" | "no";
  amount: number;
  createdAt: string;
}

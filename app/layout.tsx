import type { Metadata } from "next";
import { seedAdminIfNeeded } from "@/lib/seed";
import "./globals.css";
import NavBar from "./NavBar";

seedAdminIfNeeded();

export const metadata: Metadata = {
  title: "FriendBets",
  description: "Prediction market for friends",
  openGraph: {
    siteName: "FriendBets",
    title: "FriendBets",
    description: "Prediction market for friends — bet on outcomes with your crew",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  );
}

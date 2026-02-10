import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readData, withLock, generateId } from "@/lib/storage";
import { sendDiscordNotification } from "@/lib/discord";
import type { Market } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const markets = readData<Market>("markets");
  return NextResponse.json(markets);
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { question, description, closesAt } = await request.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  let validatedClosesAt: string | null = null;
  if (closesAt) {
    const d = new Date(closesAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid closesAt date" }, { status: 400 });
    }
    if (d <= new Date()) {
      return NextResponse.json({ error: "closesAt must be in the future" }, { status: 400 });
    }
    validatedClosesAt = d.toISOString();
  }

  const newMarket: Market = {
    id: generateId(),
    question: question.trim(),
    description: typeof description === "string" ? description.trim() : "",
    status: "open",
    resolvedOutcome: null,
    closesAt: validatedClosesAt,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  await withLock<Market>("markets", (markets) => [...markets, newMarket]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  sendDiscordNotification({
    title: newMarket.question,
    description: newMarket.description || undefined,
    url: `${baseUrl}/market/${newMarket.id}`,
    color: 0x3b82f6, // blue
    footer: { text: "New market created" },
  });

  return NextResponse.json(newMarket, { status: 201 });
}

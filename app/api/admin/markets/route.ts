import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readData, withLock, generateId } from "@/lib/storage";
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

  const { question, description } = await request.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  const newMarket: Market = {
    id: generateId(),
    question: question.trim(),
    description: typeof description === "string" ? description.trim() : "",
    status: "open",
    resolvedOutcome: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  await withLock<Market>("markets", (markets) => [...markets, newMarket]);

  return NextResponse.json(newMarket, { status: 201 });
}

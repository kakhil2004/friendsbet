import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withLock } from "@/lib/storage";
import type { Market } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { closesAt } = await request.json();

  let validatedClosesAt: string | null = null;
  if (closesAt) {
    const d = new Date(closesAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (d <= new Date()) {
      return NextResponse.json({ error: "Must be in the future" }, { status: 400 });
    }
    validatedClosesAt = d.toISOString();
  }

  let found = false;
  let updated: Market | null = null;

  await withLock<Market>("markets", (markets) =>
    markets.map((m) => {
      if (m.id === params.id) {
        found = true;
        if (m.status !== "open") return m;
        updated = { ...m, closesAt: validatedClosesAt };
        return updated;
      }
      return m;
    })
  );

  if (!found) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (!updated) {
    return NextResponse.json({ error: "Market is not open" }, { status: 400 });
  }

  return NextResponse.json(updated);
}

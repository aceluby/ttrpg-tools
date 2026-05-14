import { NextResponse } from "next/server";

import {
  loadFactionData,
  refreshFactionData,
  saveFactionData,
  type FactionDataFile,
} from "@/lib/factions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldRefresh = searchParams.get("refresh") === "1";
    const data = shouldRefresh ? await refreshFactionData() : await loadFactionData();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      data?: FactionDataFile;
    };

    if (!body.data) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const saved = await saveFactionData(body.data);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

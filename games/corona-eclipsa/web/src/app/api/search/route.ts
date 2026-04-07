import { NextResponse } from "next/server";

import { searchGameDocs } from "@/lib/game-files";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchGameDocs(query);
  return NextResponse.json({ results });
}

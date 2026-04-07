import { NextResponse } from "next/server";

import { listEncounterPresets } from "@/lib/encounter-presets";

export async function GET() {
  const data = await listEncounterPresets();
  return NextResponse.json(data);
}

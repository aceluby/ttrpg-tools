import { NextResponse } from "next/server";

import { readNpcPortrait, saveNpcPortrait } from "@/lib/npc-relationships";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "Missing portrait file." }, { status: 400 });
    }

    const buffer = await readNpcPortrait(file);

    return new NextResponse(buffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      npcId?: string;
    };

    if (!body.npcId || !body.imageDataUrl) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const saved = await saveNpcPortrait(body.npcId, body.imageDataUrl);
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

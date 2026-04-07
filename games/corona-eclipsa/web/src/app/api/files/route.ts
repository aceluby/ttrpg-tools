import { NextResponse } from "next/server";

import { writeGameDoc } from "@/lib/game-files";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      path?: string;
      markdown?: string;
    };

    if (!body.path || typeof body.markdown !== "string") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    await writeGameDoc(body.path, body.markdown);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

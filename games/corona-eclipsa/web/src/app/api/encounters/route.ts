import { NextResponse } from "next/server";

import {
  deleteEncounterFile,
  listEncounterFiles,
  readEncounterFile,
  writeEncounterFile,
} from "@/lib/encounter-storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (file) {
      const encounter = await readEncounterFile(file);
      return NextResponse.json({ encounter });
    }

    const encounters = await listEncounterFiles();
    return NextResponse.json({ encounters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      encounter?: unknown;
    };

    if (!body.fileName || body.encounter === undefined) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const savedFile = await writeEncounterFile(body.fileName, body.encounter);
    return NextResponse.json({ ok: true, file: savedFile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "Missing encounter file." }, { status: 400 });
    }

    const deletedFile = await deleteEncounterFile(file);
    return NextResponse.json({ ok: true, file: deletedFile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

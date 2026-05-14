import { NextResponse } from "next/server";

import { saveSoundAssetFile } from "@/lib/soundboard-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const assetId = formData.get("assetId");
    const file = formData.get("file");

    if (typeof assetId !== "string" || !assetId) {
      return NextResponse.json(
        { error: "Missing sound asset id." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing audio file." },
        { status: 400 },
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only MP3 uploads are supported right now." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const { asset } = await saveSoundAssetFile(assetId, bytes);

    return NextResponse.json({
      assetId: asset.id,
      filePath: asset.filePath,
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save sound asset.",
      },
      { status: 500 },
    );
  }
}

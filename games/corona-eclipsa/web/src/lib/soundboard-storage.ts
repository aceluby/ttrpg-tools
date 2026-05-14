import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { SOUND_ASSETS } from "@/lib/soundboard-assets";

export function getSoundAssetById(assetId: string) {
  return SOUND_ASSETS.find((asset) => asset.id === assetId) ?? null;
}

export function getSoundAssetAbsolutePath(filePath: string) {
  const normalizedPath = filePath.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", normalizedPath);
}

export async function saveSoundAssetFile(assetId: string, bytes: Uint8Array) {
  const asset = getSoundAssetById(assetId);
  if (!asset) {
    throw new Error("Unknown sound asset.");
  }

  const absolutePath = getSoundAssetAbsolutePath(asset.filePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    asset,
    absolutePath,
  };
}

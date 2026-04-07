import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { spotifyApiFetch } from "@/lib/spotify";

type SpotifyDevicesResponse = {
  devices: Array<{
    id: string;
    is_active: boolean;
    name: string;
    type: string;
  }>;
};

export async function POST() {
  const cookieStore = await cookies();

  try {
    const devices = await spotifyApiFetch<SpotifyDevicesResponse>(
      cookieStore,
      "https://api.spotify.com/v1/me/player/devices",
    );
    const device = pickPreferredDevice(devices.devices);
    if (!device?.id) {
      return NextResponse.json(
        { error: "No Spotify playback device found. Open Spotify on your laptop first." },
        { status: 409 },
      );
    }

    await spotifyApiFetch<null>(
      cookieStore,
      `https://api.spotify.com/v1/me/player/next?device_id=${encodeURIComponent(device.id)}`,
      {
        method: "POST",
      },
    );

    return NextResponse.json({
      deviceName: device.name,
      ok: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spotify next track failed";
    console.error("Spotify next track failed:", message);

    return NextResponse.json(
      { error: normalizeSpotifyError(message) },
      { status: 500 },
    );
  }
}

function pickPreferredDevice(devices: SpotifyDevicesResponse["devices"]) {
  return devices.find((device) => device.is_active && device.type === "Computer")
    ?? devices.find((device) => device.type === "Computer")
    ?? devices.find((device) => device.is_active)
    ?? devices[0]
    ?? null;
}

function normalizeSpotifyError(message: string) {
  if (message.includes("No active device found")) {
    return "Spotify could not find an active playback device. Open Spotify on your laptop and play or pause something once so the device becomes available.";
  }

  if (message.includes("Device not found")) {
    return "Spotify could see your account but could not target the selected laptop player. Open the Spotify desktop app and keep it awake, then try again.";
  }

  if (message.includes("PREMIUM_REQUIRED")) {
    return "Spotify Premium is required for remote playback control.";
  }

  if (message.includes("The access token expired")) {
    return "Spotify login expired. Reconnect Spotify and try again.";
  }

  return `Spotify next track failed: ${message}`;
}

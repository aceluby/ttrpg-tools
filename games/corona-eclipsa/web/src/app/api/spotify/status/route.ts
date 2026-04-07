import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { spotifyApiFetch } from "@/lib/spotify";

type SpotifyProfile = {
  display_name: string | null;
};

type SpotifyDevicesResponse = {
  devices: Array<{
    id: string;
    is_active: boolean;
    name: string;
    type: string;
  }>;
};

export async function GET() {
  const cookieStore = await cookies();

  try {
    const [profile, devices] = await Promise.all([
      spotifyApiFetch<SpotifyProfile>(cookieStore, "https://api.spotify.com/v1/me"),
      spotifyApiFetch<SpotifyDevicesResponse>(cookieStore, "https://api.spotify.com/v1/me/player/devices"),
    ]);

    const preferredDevice = pickPreferredDevice(devices.devices);

    return NextResponse.json({
      connected: true,
      deviceName: preferredDevice?.name ?? null,
      displayName: profile.display_name ?? "Spotify",
      devices: devices.devices.map((device) => ({
        isActive: device.is_active,
        name: device.name,
        type: device.type,
      })),
    });
  } catch {
    return NextResponse.json({
      connected: false,
      deviceName: null,
      displayName: null,
      devices: [],
    });
  }
}

function pickPreferredDevice(devices: SpotifyDevicesResponse["devices"]) {
  return devices.find((device) => device.is_active && device.type === "Computer")
    ?? devices.find((device) => device.type === "Computer")
    ?? devices.find((device) => device.is_active)
    ?? devices[0]
    ?? null;
}

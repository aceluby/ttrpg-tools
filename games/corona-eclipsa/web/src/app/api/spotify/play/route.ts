import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getSpotifyScene } from "@/lib/spotify-scenes";
import { spotifyApiFetch } from "@/lib/spotify";

type SpotifySearchResponse = {
  playlists?: {
    items: Array<{
      id: string;
      name: string;
      owner: { display_name: string | null };
      uri: string;
    }>;
  };
};

type SpotifyPlaylistResponse = {
  id: string;
  name: string;
  uri: string;
  tracks?: {
    total: number;
  };
};

type SpotifyDevicesResponse = {
  devices: Array<{
    id: string;
    is_active: boolean;
    name: string;
    type: string;
  }>;
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const body = await request.json() as { category?: string };
  const scene = getSpotifyScene(body.category ?? "");
  if (!scene) {
    return NextResponse.json({ error: "Unknown music category" }, { status: 400 });
  }

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

    const playlist = await findScenePlaylist(cookieStore, [
      scene.query,
      ...(scene.fallbackQueries ?? []),
    ]);
    if (!playlist) {
      return NextResponse.json(
        { error: "No matching Spotify playlist was found for that scene." },
        { status: 404 },
      );
    }

    const trackCount = Math.max(playlist.tracks?.total ?? 1, 1);
    const offset = Math.floor(Math.random() * trackCount);

    await spotifyApiFetch<null>(cookieStore, "https://api.spotify.com/v1/me/player", {
      method: "PUT",
      body: JSON.stringify({
        device_ids: [device.id],
        play: false,
      }),
    });

    await spotifyApiFetch<null>(
      cookieStore,
      `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(device.id)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          context_uri: playlist.uri,
          offset: {
            position: offset,
          },
          position_ms: 0,
        }),
      },
    );

    await spotifyApiFetch<null>(
      cookieStore,
      `https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${encodeURIComponent(device.id)}`,
      {
        method: "PUT",
      },
    );

    return NextResponse.json({
      category: scene.label,
      deviceName: device.name,
      playlistName: playlist.name,
      offset,
      shuffle: true,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Spotify playback failed";
    console.error("Spotify play failed:", message);

    return NextResponse.json({ error: normalizeSpotifyError(message) }, { status: 500 });
  }
}

async function findScenePlaylist(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  queries: string[],
) {
  for (const query of queries) {
    const searchUrl = new URL("https://api.spotify.com/v1/search");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "playlist");
    searchUrl.searchParams.set("limit", "5");

    const search = await spotifyApiFetch<SpotifySearchResponse>(
      cookieStore,
      searchUrl.toString(),
    );

    const candidates = search.playlists?.items ?? [];
    for (const playlistSummary of candidates) {
      if (!playlistSummary?.id) {
        continue;
      }

      const playlist = await spotifyApiFetch<SpotifyPlaylistResponse>(
        cookieStore,
        `https://api.spotify.com/v1/playlists/${playlistSummary.id}?fields=id,name,uri,tracks.total`,
      );

      if (playlist.uri) {
        return playlist;
      }
    }
  }

  return null;
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

  if (message.includes("Restriction violated")) {
    return "This Spotify app does not currently have access to that playlist lookup. We can switch to fixed playlist IDs if needed.";
  }

  if (message.includes("The access token expired")) {
    return "Spotify login expired. Reconnect Spotify and try again.";
  }

  return `Spotify playback failed: ${message}`;
}

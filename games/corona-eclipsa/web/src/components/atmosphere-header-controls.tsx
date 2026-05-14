"use client";

import { useEffect, useState } from "react";

import { ATMOSPHERE_PRESETS } from "@/lib/soundboard-assets";
import { useSoundboard } from "@/components/soundboard-provider";

type SpotifyStatus = {
  connected: boolean;
  deviceName: string | null;
  displayName: string | null;
  devices: Array<{
    isActive: boolean;
    name: string;
    type: string;
  }>;
};

export function AtmosphereHeaderControls() {
  const [status, setStatus] = useState<SpotifyStatus>({
    connected: false,
    deviceName: null,
    displayName: null,
    devices: [],
  });
  const {
    applyPresetById,
    selectedPresetId,
    stopAllAmbient,
  } = useSoundboard();

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 2500);

    async function loadStatus() {
      try {
        const response = await fetch("/api/spotify/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load Spotify status");
        }

        const data = await response.json() as SpotifyStatus;
        if (isActive) {
          setStatus(data);
        }
      } catch {
        if (isActive) {
          setStatus({
            connected: false,
            deviceName: null,
            displayName: null,
            devices: [],
          });
        }
      }
    }

    void loadStatus();

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  async function playSpotifyScene(sceneId: string) {
    const response = await fetch("/api/spotify/play", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: sceneId,
      }),
    });

    if (!response.ok) {
      const data = await safeReadJson(response);
      throw new Error(data.error || "Spotify playback failed.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="w-44 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        onChange={(event) => {
          const nextPresetId = event.target.value;
          if (!nextPresetId) {
            stopAllAmbient();
            return;
          }

          const preset = ATMOSPHERE_PRESETS.find((entry) => entry.id === nextPresetId);
          if (!preset) {
            return;
          }

          void (async () => {
            await applyPresetById(nextPresetId);
            if (status.connected) {
              await playSpotifyScene(preset.spotifyScene);
            }
          })();
        }}
        value={selectedPresetId}
      >
        <option value="">Atmosphere</option>
        {ATMOSPHERE_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>

      <button
        className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
        onClick={stopAllAmbient}
        type="button"
      >
        Stop Atmosphere
      </button>
    </div>
  );
}

async function safeReadJson(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return {} as { error?: string };
  }

  try {
    return JSON.parse(raw) as { error?: string };
  } catch {
    return {
      error: raw,
    };
  }
}

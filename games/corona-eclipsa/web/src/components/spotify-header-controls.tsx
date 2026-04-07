"use client";

import { useEffect, useState } from "react";

import { SPOTIFY_SCENES, type SpotifySceneId } from "@/lib/spotify-scenes";

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

export function SpotifyHeaderControls() {
  const [status, setStatus] = useState<SpotifyStatus>({
    connected: false,
    deviceName: null,
    displayName: null,
    devices: [],
  });
  const [selectedScene, setSelectedScene] = useState<SpotifySceneId>("traveling");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

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

  async function playScene() {
    setIsPlaying(true);

    try {
      const response = await fetch("/api/spotify/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: selectedScene,
        }),
      });

      const data = await response.json() as {
        deviceName?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Spotify playback failed");
      }

      setStatus((current) => ({
        ...current,
        connected: true,
        deviceName: data.deviceName ?? current.deviceName,
      }));
    } catch {
      return;
    } finally {
      setIsPlaying(false);
    }
  }

  async function nextSong() {
    setIsSkipping(true);

    try {
      await fetch("/api/spotify/next", {
        method: "POST",
      });
    } finally {
      setIsSkipping(false);
    }
  }

  function connectSpotify() {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const localOrigin = process.env.NODE_ENV !== "production"
      ? "http://127.0.0.1:3000"
      : window.location.origin;
    window.location.href = `${localOrigin}/api/spotify/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="w-40 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
        onChange={(event) => setSelectedScene(event.target.value as SpotifySceneId)}
        value={selectedScene}
      >
        {SPOTIFY_SCENES.map((scene) => (
          <option key={scene.id} value={scene.id}>
            {scene.label}
          </option>
        ))}
      </select>

      {status.connected ? (
        <>
          <button
            aria-label="Play scene music"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-base text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={isPlaying}
            onClick={playScene}
            title="Play scene music"
            type="button"
          >
            {isPlaying ? "…" : "▶"}
          </button>
          <button
            aria-label="Next song"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-base text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
            disabled={isSkipping}
            onClick={nextSong}
            title="Next song"
            type="button"
          >
            {isSkipping ? "…" : "⏭"}
          </button>
        </>
      ) : (
        <button
          className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          onClick={connectSpotify}
          type="button"
        >
          Connect
        </button>
      )}
    </div>
  );
}

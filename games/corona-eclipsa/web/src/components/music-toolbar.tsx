"use client";

import { useEffect, useState } from "react";

import { SPOTIFY_SCENES, type SpotifySceneId } from "@/lib/spotify-scenes";

type SpotifyStatus = {
  connected: boolean;
  deviceName: string | null;
  displayName: string | null;
};

export function MusicToolbar() {
  const [status, setStatus] = useState<SpotifyStatus>({
    connected: false,
    deviceName: null,
    displayName: null,
  });
  const [selectedScene, setSelectedScene] = useState<SpotifySceneId>("traveling");
  const [playStatus, setPlayStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 2500);

    async function loadStatus() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/spotify/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load Spotify status");
        }

        const data = await response.json() as SpotifyStatus;
        if (!isActive) {
          return;
        }

        setStatus(data);
      } catch {
        if (!isActive) {
          return;
        }

        setStatus({
          connected: false,
          deviceName: null,
          displayName: null,
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
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
    setPlayStatus("");

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
        error?: string;
        category?: string;
        deviceName?: string;
        playlistName?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Spotify playback failed");
      }

      setPlayStatus(`Playing ${data.category} on ${data.deviceName} from ${data.playlistName}.`);
      setStatus((current) => ({
        ...current,
        deviceName: data.deviceName ?? current.deviceName,
      }));
    } catch (error) {
      setPlayStatus(error instanceof Error ? error.message : "Spotify playback failed.");
    } finally {
      setIsPlaying(false);
    }
  }

  function connectSpotify() {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `/api/spotify/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return (
    <div className="shrink-0 border-b border-stone-300 bg-stone-100/90 px-6 py-3 backdrop-blur">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Music</p>
          <p className="truncate text-sm text-stone-700">
            {status.connected
                ? `Connected as ${status.displayName ?? "Spotify"}${status.deviceName ? ` • Device: ${status.deviceName}` : ""}`
                : isLoading
                  ? "Checking Spotify connection..."
                  : "Connect Spotify on this laptop to control scene music from the app."}
          </p>
          {playStatus ? (
            <p className="mt-1 truncate text-xs font-semibold text-stone-600">{playStatus}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="min-w-56 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-600"
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
            <button
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isPlaying}
              onClick={playScene}
              type="button"
            >
              {isPlaying ? "Switching..." : "Play Scene Music"}
            </button>
          ) : (
            <button
              className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              onClick={connectSpotify}
              type="button"
            >
              Connect Spotify
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

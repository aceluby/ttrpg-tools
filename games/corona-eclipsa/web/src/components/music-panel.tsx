"use client";

import { useEffect, useState } from "react";

import { AppPanelHeader } from "@/components/app-panel-header";
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

export function MusicPanel() {
  const [status, setStatus] = useState<SpotifyStatus>({
    connected: false,
    deviceName: null,
    displayName: null,
    devices: [],
  });
  const [selectedScene, setSelectedScene] = useState<SpotifySceneId>("traveling");
  const [playStatus, setPlayStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

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
          devices: [],
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

  async function nextSong() {
    setIsSkipping(true);
    setPlayStatus("");

    try {
      const response = await fetch("/api/spotify/next", {
        method: "POST",
      });

      const data = await response.json() as {
        deviceName?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Spotify next track failed.");
      }

      setPlayStatus(`Skipped to the next song on ${data.deviceName}.`);
    } catch (error) {
      setPlayStatus(error instanceof Error ? error.message : "Spotify next track failed.");
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
    <section className="flex min-h-0 min-w-0 flex-1 w-full flex-col bg-stone-50/92">
      <AppPanelHeader />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Spotify Scene Control</p>
          <h2 className="mt-1 text-3xl font-semibold text-stone-900">Music Director</h2>
          <p className="mt-2 text-sm text-stone-600">
            Jump between table moods without leaving the app.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Status</p>
            <p className="mt-3 text-lg text-stone-900">
              {status.connected
                ? `Connected as ${status.displayName ?? "Spotify"}${status.deviceName ? ` on ${status.deviceName}` : ""}`
                : isLoading
                  ? "Checking Spotify connection..."
                  : "Spotify is not connected yet."}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Open Spotify on your Mac first so it appears as an available playback device.
            </p>
            {status.devices.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {status.devices.map((device) => (
                  <span
                    key={`${device.name}-${device.type}`}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      device.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {device.name} • {device.type}{device.isActive ? " • Active" : ""}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <div className="grid gap-4 lg:grid-cols-[220px_auto] lg:items-end">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Scene
                </span>
                <select
                  className="w-full rounded-full border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setSelectedScene(event.target.value as SpotifySceneId)}
                  value={selectedScene}
                >
                  {SPOTIFY_SCENES.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                {status.connected ? (
                  <div className="flex gap-2">
                    <button
                      aria-label="Play scene music"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-lg text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                      disabled={isPlaying}
                      onClick={playScene}
                      title="Play scene music"
                      type="button"
                    >
                      {isPlaying ? "…" : "▶"}
                    </button>
                    <button
                      aria-label="Next song"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-lg text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                      disabled={isSkipping}
                      onClick={nextSong}
                      title="Next song"
                      type="button"
                    >
                      {isSkipping ? "…" : "⏭"}
                    </button>
                  </div>
                ) : (
                  <button
                    className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    onClick={connectSpotify}
                    type="button"
                  >
                    Connect Spotify
                  </button>
                )}
              </div>
            </div>

            {playStatus ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                {playStatus}
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Available Scenes</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SPOTIFY_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    selectedScene === scene.id
                      ? "border-amber-400 bg-amber-50"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                  }`}
                  onClick={() => setSelectedScene(scene.id)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-stone-900">{scene.label}</p>
                  <p className="mt-1 text-xs text-stone-500">{scene.query}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

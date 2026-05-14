"use client";

import { useEffect, useRef, useState } from "react";

import { AppPanelHeader } from "@/components/app-panel-header";
import { useSoundboard } from "@/components/soundboard-provider";
import {
  AMBIENT_SOUNDS,
  ATMOSPHERE_PRESETS,
  SOUND_ASSETS,
  STINGER_SOUNDS,
  type AtmospherePreset,
} from "@/lib/soundboard-assets";
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

const SPOTIFY_SCENE_STORAGE_KEY = "corona-eclipsa.spotify-scene";

export function MusicPanel() {
  const [status, setStatus] = useState<SpotifyStatus>({
    connected: false,
    deviceName: null,
    displayName: null,
    devices: [],
  });
  const [selectedScene, setSelectedScene] = useState<SpotifySceneId>("traveling");
  const [playStatus, setPlayStatus] = useState("");
  const [soundStatus, setSoundStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [uploadingAssetId, setUploadingAssetId] = useState("");
  const [previewingAssetId, setPreviewingAssetId] = useState("");
  const [assetDurations, setAssetDurations] = useState<Record<string, number>>({});
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const {
    activeAmbientIds,
    ambientVolumes,
    assetAvailability,
    applyPresetById,
    changeAmbientVolume,
    refreshAssetAvailability,
    selectedPresetId,
    stopAllAmbient,
    toggleAmbient,
  } = useSoundboard();

  useEffect(() => {
    try {
      const storedScene = window.localStorage.getItem(SPOTIFY_SCENE_STORAGE_KEY);
      if (storedScene && SPOTIFY_SCENES.some((scene) => scene.id === storedScene)) {
        setSelectedScene(storedScene as SpotifySceneId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SPOTIFY_SCENE_STORAGE_KEY, selectedScene);
  }, [selectedScene]);

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

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadDurations() {
      const entries = await Promise.all(
        SOUND_ASSETS.map(async (asset) => {
          try {
            const duration = await readAudioDuration(asset.filePath);
            return [asset.id, duration] as const;
          } catch {
            return [asset.id, 0] as const;
          }
        }),
      );

      if (!isActive) {
        return;
      }

      setAssetDurations(Object.fromEntries(entries));
    }

    void loadDurations();

    return () => {
      isActive = false;
    };
  }, []);

  async function playScene(sceneId: SpotifySceneId = selectedScene) {
    setIsPlaying(true);
    setPlayStatus("");

    try {
      const response = await fetch("/api/spotify/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: sceneId,
        }),
      });

      const data = await readApiJson<{
        error?: string;
        category?: string;
        deviceName?: string;
        playlistName?: string;
      }>(response);

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

      const data = await readApiJson<{
        deviceName?: string;
        error?: string;
      }>(response);

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

  async function playStinger(assetId: string) {
    const asset = STINGER_SOUNDS.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    try {
      const audio = new Audio(asset.filePath);
      audio.preload = "auto";
      audio.volume = asset.defaultVolume;
      await audio.play();
      setSoundStatus(`${asset.label} fired.`);
    } catch {
      await refreshAssetAvailability();
      setSoundStatus(`Unable to play ${asset.label}. Add the file at ${asset.filePath}.`);
    }
  }

  async function uploadAssetFile(assetId: string, file: File) {
    setUploadingAssetId(assetId);

    try {
      const formData = new FormData();
      formData.set("assetId", assetId);
      formData.set("file", file);

      const response = await fetch("/api/soundboard-assets", {
        method: "POST",
        body: formData,
      });

      const data = await readApiJson<{
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(data.error || "Unable to upload sound asset.");
      }

      await refreshAssetAvailability();
      const duration = await readAudioDuration(getAssetFilePath(assetId));
      setAssetDurations((current) => ({
        ...current,
        [assetId]: duration,
      }));
      setSoundStatus(`${getAssetLabel(assetId)} replaced successfully.`);
    } catch (error) {
      setSoundStatus(error instanceof Error ? error.message : "Unable to replace sound asset.");
    } finally {
      setUploadingAssetId("");
    }
  }

  async function previewAsset(assetId: string) {
    const asset = SOUND_ASSETS.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    try {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(asset.filePath);
      audio.preload = "auto";
      audio.volume = asset.kind === "ambient"
        ? Math.max(0.15, ambientVolumes[asset.id] ?? asset.defaultVolume)
        : asset.defaultVolume;
      audio.onended = () => {
        setPreviewingAssetId((current) => current === asset.id ? "" : current);
      };

      previewAudioRef.current = audio;
      setPreviewingAssetId(asset.id);
      await audio.play();
      setSoundStatus(`Previewing ${asset.label}.`);
    } catch {
      setSoundStatus(`Unable to preview ${asset.label}.`);
    }
  }

  function stopPreview() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }

    setPreviewingAssetId("");
    setSoundStatus("Preview stopped.");
  }

  async function applyPreset(preset: AtmospherePreset) {
    setSelectedScene(preset.spotifyScene);
    await applyPresetById(preset.id);

    if (status.connected) {
      await playScene(preset.spotifyScene);
    }
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 w-full flex-col overflow-hidden bg-stone-50/92">
      <AppPanelHeader />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Spotify + Local Soundboard</p>
          <h2 className="mt-1 text-3xl font-semibold text-stone-900">Music Director</h2>
          <p className="mt-2 text-sm text-stone-600">
            Run Spotify scene music and layer local ambience or one-shot effects over it.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Spotify Status</p>
            <p className="mt-3 text-lg text-stone-900">
              {status.connected
                ? `Connected as ${status.displayName ?? "Spotify"}${status.deviceName ? ` on ${status.deviceName}` : ""}`
                : isLoading
                  ? "Checking Spotify connection..."
                  : "Spotify is not connected yet."}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Spotify handles the music layer. The soundboard below adds local ambience and stingers on top.
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
                  onChange={(event) => {
                    const nextScene = event.target.value as SpotifySceneId;
                    setSelectedScene(nextScene);
                    if (status.connected) {
                      void playScene(nextScene);
                    }
                  }}
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
                      onClick={() => void playScene()}
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Atmosphere Presets</p>
                <p className="mt-2 text-sm text-stone-600">
                  These set a recommended Spotify scene and bring up the matching shared ambience across the app.
                </p>
              </div>
              <button
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={stopAllAmbient}
                type="button"
              >
                Stop All Ambient
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ATMOSPHERE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    selectedPresetId === preset.id
                      ? "border-amber-400 bg-amber-50"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100"
                  }`}
                  onClick={() => void applyPreset(preset)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-900">{preset.label}</p>
                    <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-50">
                      {getSceneLabel(preset.spotifyScene)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{preset.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                    {preset.ambientIds.map((assetId) => getAssetLabel(assetId)).join(" + ")}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Ambient Mixer</p>
            <p className="mt-2 text-sm text-stone-600">
              Local loop playback runs underneath the current Spotify music scene.
            </p>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {AMBIENT_SOUNDS.map((asset) => {
                const isActive = activeAmbientIds.includes(asset.id);
                const availability = assetAvailability[asset.id] ?? "checking";

                return (
                  <div
                    key={asset.id}
                    className={`rounded-3xl border p-5 ${
                      isActive
                        ? "border-emerald-300 bg-emerald-50/70"
                        : "border-stone-200 bg-stone-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-stone-900">{asset.label}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            availability === "ready"
                              ? "bg-emerald-100 text-emerald-800"
                              : availability === "missing"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-700"
                          }`}>
                            {availability}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-stone-600">{asset.description}</p>
                      </div>

                      <button
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-stone-900 text-stone-50 hover:bg-stone-700"
                            : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                        }`}
                        onClick={() => void toggleAmbient(asset.id)}
                        type="button"
                      >
                        {isActive ? "Stop" : "Play"}
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        <span>Volume</span>
                        <span>{Math.round((ambientVolumes[asset.id] ?? asset.defaultVolume) * 100)}%</span>
                      </div>
                      <input
                        className="mt-2 w-full accent-amber-700"
                        max="1"
                        min="0"
                        onChange={(event) => changeAmbientVolume(asset.id, Number(event.target.value))}
                        step="0.01"
                        type="range"
                        value={ambientVolumes[asset.id] ?? asset.defaultVolume}
                      />
                    </div>

                    <p className="mt-3 text-xs text-stone-500">
                      Expected file: <span className="font-mono">{asset.filePath}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Quick Effects</p>
            <p className="mt-2 text-sm text-stone-600">
              One-shot effects fire instantly and can be used while Spotify and ambient loops keep running.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {STINGER_SOUNDS.map((asset) => {
                const availability = assetAvailability[asset.id] ?? "checking";

                return (
                  <button
                    key={asset.id}
                    className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:bg-stone-100"
                    onClick={() => void playStinger(asset.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-stone-900">{asset.label}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        availability === "ready"
                          ? "bg-emerald-100 text-emerald-800"
                          : availability === "missing"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-700"
                      }`}>
                        {availability}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">{asset.description}</p>
                  </button>
                );
              })}
            </div>

            {soundStatus ? (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                {soundStatus}
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Asset Setup</p>
            <p className="mt-2 text-sm text-stone-600">
              Copy audio files into the expected local paths below. The soundboard marks each entry as ready once a file exists.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-sm text-stone-700">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-3 py-3 font-semibold">Sound</th>
                    <th className="px-3 py-3 font-semibold">Type</th>
                    <th className="px-3 py-3 font-semibold">Expected File</th>
                    <th className="px-3 py-3 font-semibold">Source</th>
                    <th className="px-3 py-3 font-semibold">License</th>
                    <th className="px-3 py-3 font-semibold">Preview</th>
                    <th className="px-3 py-3 font-semibold">Replace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {SOUND_ASSETS.map((asset) => (
                    <tr key={asset.id}>
                      <td className="px-3 py-3 font-semibold text-stone-900">{asset.label}</td>
                      <td className="px-3 py-3 capitalize">{asset.kind}</td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs">{asset.filePath}</div>
                        <div className="mt-1">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                            (assetAvailability[asset.id] ?? "checking") === "ready"
                              ? "bg-emerald-100 text-emerald-800"
                              : (assetAvailability[asset.id] ?? "checking") === "missing"
                                ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-700"
                          }`}>
                            {assetAvailability[asset.id] ?? "checking"}
                          </span>
                          {assetDurations[asset.id] ? (
                            <span className="ml-2 text-xs text-stone-500">
                              {formatDuration(assetDurations[asset.id])}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          className="text-amber-800 underline decoration-amber-400 underline-offset-2"
                          href={asset.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {asset.sourceName}
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          className="text-amber-800 underline decoration-amber-400 underline-offset-2"
                          href={asset.licenseUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {asset.licenseLabel}
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                              previewingAssetId === asset.id
                                ? "bg-stone-900 text-stone-50 hover:bg-stone-700"
                                : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                            }`}
                            onClick={() => void previewAsset(asset.id)}
                            type="button"
                          >
                            {previewingAssetId === asset.id ? "Playing" : "Preview"}
                          </button>
                          {previewingAssetId === asset.id ? (
                            <button
                              className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                              onClick={stopPreview}
                              type="button"
                            >
                              Stop
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <label className={`inline-flex cursor-pointer items-center rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 ${
                          uploadingAssetId === asset.id ? "cursor-wait opacity-70" : ""
                        }`}>
                          {uploadingAssetId === asset.id ? "Uploading..." : "Replace MP3"}
                          <input
                            accept=".mp3,audio/mpeg"
                            className="sr-only"
                            disabled={uploadingAssetId === asset.id}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }

                              void uploadAssetFile(asset.id, file);
                              event.target.value = "";
                            }}
                            type="file"
                          />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-stone-500">
              Direct import currently supports `mp3` files and replaces the matching local soundboard asset in place.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}

function getSceneLabel(sceneId: SpotifySceneId) {
  return SPOTIFY_SCENES.find((scene) => scene.id === sceneId)?.label ?? sceneId;
}

function getAssetLabel(assetId: string) {
  return SOUND_ASSETS.find((asset) => asset.id === assetId)?.label ?? assetId;
}

function getAssetFilePath(assetId: string) {
  return SOUND_ASSETS.find((asset) => asset.id === assetId)?.filePath ?? "";
}

async function readApiJson<T>(response: Response) {
  const raw = await response.text();

  if (!raw) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(formatUnexpectedApiResponse(raw));
  }
}

function formatUnexpectedApiResponse(raw: string) {
  const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 120);

  if (!snippet) {
    return "The server returned an empty response.";
  }

  return `The server returned an unexpected response instead of JSON: ${snippet}`;
}

function formatDuration(durationSeconds: number) {
  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function readAudioDuration(filePath: string) {
  return new Promise<number>((resolve, reject) => {
    const audio = new Audio(filePath);
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(audio.duration);
        return;
      }

      reject(new Error("No duration"));
    };

    audio.onerror = () => reject(new Error("Unable to load metadata"));
  });
}

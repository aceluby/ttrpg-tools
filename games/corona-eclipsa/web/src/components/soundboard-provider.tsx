"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AMBIENT_SOUNDS,
  ATMOSPHERE_PRESETS,
  createAmbientVolumeDefaults,
} from "@/lib/soundboard-assets";

type SoundboardContextValue = {
  activeAmbientIds: string[];
  ambientVolumes: Record<string, number>;
  assetAvailability: Record<string, "checking" | "ready" | "missing">;
  selectedPresetId: string;
  soundStatus: string;
  applyPresetById: (presetId: string) => Promise<void>;
  changeAmbientVolume: (assetId: string, nextVolume: number) => void;
  refreshAssetAvailability: () => Promise<void>;
  selectedPresetLabel: string;
  setSelectedPresetId: (presetId: string) => void;
  startAmbient: (assetId: string) => Promise<void>;
  stopAllAmbient: () => void;
  stopAmbient: (assetId: string) => void;
  toggleAmbient: (assetId: string) => Promise<void>;
};

const AMBIENT_VOLUME_STORAGE_KEY = "corona-eclipsa.ambient-volumes";
const ATMOSPHERE_PRESET_STORAGE_KEY = "corona-eclipsa.atmosphere-preset";

const SoundboardContext = createContext<SoundboardContextValue | null>(null);

export function SoundboardProvider({ children }: { children: ReactNode }) {
  const ambientDefaults = useMemo(() => createAmbientVolumeDefaults(), []);
  const [ambientVolumes, setAmbientVolumes] = useState<Record<string, number>>(ambientDefaults);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [soundStatus, setSoundStatus] = useState("");
  const [activeAmbientIds, setActiveAmbientIds] = useState<string[]>([]);
  const [assetAvailability, setAssetAvailability] = useState<Record<string, "checking" | "ready" | "missing">>(() =>
    Object.fromEntries(AMBIENT_SOUNDS.map((asset) => [asset.id, "checking"])),
  );
  const ambientAudioRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    let timeoutId = 0;

    try {
      const storedVolumes = window.localStorage.getItem(AMBIENT_VOLUME_STORAGE_KEY);
      const storedPreset = window.localStorage.getItem(ATMOSPHERE_PRESET_STORAGE_KEY) ?? "";

      timeoutId = window.setTimeout(() => {
        if (storedVolumes) {
          const parsed = JSON.parse(storedVolumes) as Record<string, number>;
          setAmbientVolumes({
            ...ambientDefaults,
            ...parsed,
          });
        }

        setSelectedPresetId(storedPreset);
      }, 0);
    } catch {
      timeoutId = window.setTimeout(() => {
        setAmbientVolumes(ambientDefaults);
      }, 0);
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [ambientDefaults]);

  useEffect(() => {
    window.localStorage.setItem(AMBIENT_VOLUME_STORAGE_KEY, JSON.stringify(ambientVolumes));
  }, [ambientVolumes]);

  useEffect(() => {
    window.localStorage.setItem(ATMOSPHERE_PRESET_STORAGE_KEY, selectedPresetId);
  }, [selectedPresetId]);

  useEffect(() => {
    const ambientAudio = ambientAudioRef.current;

    return () => {
      Object.values(ambientAudio).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  async function refreshAssetAvailability() {
    const entries = await Promise.all(
      AMBIENT_SOUNDS.map(async (asset) => {
        try {
          const response = await fetch(asset.filePath, {
            method: "HEAD",
            cache: "no-store",
          });

          return [asset.id, response.ok ? "ready" : "missing"] as const;
        } catch {
          return [asset.id, "missing"] as const;
        }
      }),
    );

    setAssetAvailability(Object.fromEntries(entries));
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshAssetAvailability();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  function ensureAmbientAudio(assetId: string) {
    const asset = AMBIENT_SOUNDS.find((entry) => entry.id === assetId);
    if (!asset) {
      return null;
    }

    const existing = ambientAudioRef.current[asset.id];
    if (existing) {
      existing.loop = true;
      existing.volume = ambientVolumes[asset.id] ?? asset.defaultVolume;
      return existing;
    }

    const audio = new Audio(asset.filePath);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = ambientVolumes[asset.id] ?? asset.defaultVolume;
    ambientAudioRef.current[asset.id] = audio;
    return audio;
  }

  async function startAmbient(assetId: string) {
    const asset = AMBIENT_SOUNDS.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    try {
      const audio = ensureAmbientAudio(assetId);
      if (!audio) {
        return;
      }

      audio.volume = ambientVolumes[asset.id] ?? asset.defaultVolume;
      await audio.play();
      setActiveAmbientIds((current) => current.includes(assetId) ? current : [...current, assetId]);
      setSoundStatus(`${asset.label} started.`);
    } catch {
      setAssetAvailability((current) => ({
        ...current,
        [assetId]: "missing",
      }));
      setSoundStatus(`Unable to play ${asset.label}. Add the file at ${asset.filePath}.`);
    }
  }

  function stopAmbient(assetId: string) {
    const audio = ambientAudioRef.current[assetId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    const asset = AMBIENT_SOUNDS.find((entry) => entry.id === assetId);
    setActiveAmbientIds((current) => current.filter((id) => id !== assetId));
    if (asset) {
      setSoundStatus(`${asset.label} stopped.`);
    }
  }

  async function toggleAmbient(assetId: string) {
    if (activeAmbientIds.includes(assetId)) {
      stopAmbient(assetId);
      return;
    }

    await startAmbient(assetId);
  }

  function changeAmbientVolume(assetId: string, nextVolume: number) {
    setAmbientVolumes((current) => ({
      ...current,
      [assetId]: nextVolume,
    }));

    const audio = ambientAudioRef.current[assetId];
    if (audio) {
      audio.volume = nextVolume;
    }
  }

  function stopAllAmbient() {
    activeAmbientIds.forEach((assetId) => {
      const audio = ambientAudioRef.current[assetId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    setActiveAmbientIds([]);
    setSoundStatus("All ambient loops stopped.");
  }

  async function applyPresetById(presetId: string) {
    const preset = ATMOSPHERE_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) {
      stopAllAmbient();
      setSelectedPresetId("");
      return;
    }

    setSelectedPresetId(preset.id);

    const desiredAmbientIds = new Set(preset.ambientIds);
    activeAmbientIds
      .filter((assetId) => !desiredAmbientIds.has(assetId))
      .forEach((assetId) => stopAmbient(assetId));

    for (const assetId of preset.ambientIds) {
      if (!activeAmbientIds.includes(assetId)) {
        await startAmbient(assetId);
      }
    }

    setSoundStatus(`${preset.label} atmosphere applied.`);
  }

  const value: SoundboardContextValue = {
    activeAmbientIds,
    ambientVolumes,
    assetAvailability,
    selectedPresetId,
    soundStatus,
    applyPresetById,
    changeAmbientVolume,
    refreshAssetAvailability,
    selectedPresetLabel: ATMOSPHERE_PRESETS.find((preset) => preset.id === selectedPresetId)?.label ?? "",
    setSelectedPresetId,
    startAmbient,
    stopAllAmbient,
    stopAmbient,
    toggleAmbient,
  };

  return (
    <SoundboardContext.Provider value={value}>
      {children}
    </SoundboardContext.Provider>
  );
}

export function useSoundboard() {
  const context = useContext(SoundboardContext);
  if (!context) {
    throw new Error("useSoundboard must be used within SoundboardProvider.");
  }

  return context;
}

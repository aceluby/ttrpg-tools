"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { AppPanelHeader } from "@/components/app-panel-header";
import { generateFantasyName } from "@/lib/fantasy-name-seeds";
import type { FactionDataFile, FactionRecord } from "@/lib/factions";
import type {
  NpcRelationshipDataFile,
  NpcRelationshipLink,
  NpcRelationshipRecord,
  NpcRoleplayCard,
} from "@/lib/npc-relationships";

type ViewMode = "dossier" | "roleplay";

type PortraitCropState = {
  imageHeight: number;
  imageWidth: number;
  source: string;
  x: number;
  y: number;
  zoom: number;
};

const EMPTY_DATA: NpcRelationshipDataFile = {
  generatedAt: "",
  npcs: [],
};
const EMPTY_FACTIONS: FactionDataFile = {
  generatedAt: "",
  factions: [],
};

const PORTRAIT_FRAME_WIDTH = 280;
const PORTRAIT_FRAME_HEIGHT = 350;
const OUTPUT_PORTRAIT_WIDTH = 800;
const OUTPUT_PORTRAIT_HEIGHT = 1000;

type NewNpcDraft = {
  factionId: string;
  name: string;
  role: string;
};

export function NpcRelationshipPanel({ initialSelectedNpcId = "" }: { initialSelectedNpcId?: string }) {
  const router = useRouter();
  const [data, setData] = useState<NpcRelationshipDataFile>(EMPTY_DATA);
  const [factionData, setFactionData] = useState<FactionDataFile>(EMPTY_FACTIONS);
  const [selectedId, setSelectedId] = useState(initialSelectedNpcId);
  const [viewMode, setViewMode] = useState<ViewMode>("dossier");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Loading NPC relationship data...");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingPortrait, setIsSavingPortrait] = useState(false);
  const [cropState, setCropState] = useState<PortraitCropState | null>(null);
  const [isPortraitDragOver, setIsPortraitDragOver] = useState(false);
  const [newNpcDraft, setNewNpcDraft] = useState<NewNpcDraft>({
    factionId: "",
    name: "",
    role: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadData(false);
  }, []);

  const filteredNpcs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return data.npcs;
    }

    return data.npcs.filter((npc) =>
      [
        npc.name,
        npc.role,
        npc.faction,
        npc.rootFactionId,
        npc.summary,
        npc.currentLocation,
        npc.lastSeen,
      ].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [data.npcs, search]);

  const selectedNpc = useMemo(() => {
    return filteredNpcs.find((npc) => npc.id === selectedId)
      ?? data.npcs.find((npc) => npc.id === selectedId)
      ?? filteredNpcs[0]
      ?? data.npcs[0]
      ?? null;
  }, [data.npcs, filteredNpcs, selectedId]);

  const availableFactions = useMemo(() => {
    return [...factionData.factions].sort((left, right) => left.name.localeCompare(right.name));
  }, [factionData.factions]);

  useEffect(() => {
    if (selectedNpc && selectedNpc.id !== selectedId) {
      setSelectedId(selectedNpc.id);
    }
  }, [selectedId, selectedNpc]);

  useEffect(() => {
    if (initialSelectedNpcId) {
      setSelectedId(initialSelectedNpcId);
    }
  }, [initialSelectedNpcId]);

  useEffect(() => {
    if (!selectedNpc) {
      return;
    }

    router.replace(`/?mode=npcs&npc=${encodeURIComponent(selectedNpc.id)}`, {
      scroll: false,
    });
  }, [router, selectedNpc]);

  async function loadData(refresh: boolean) {
    if (refresh) {
      setIsRefreshing(true);
      setStatus("Refreshing NPC relationships from continuity and session notes...");
    } else {
      setStatus("Loading NPC relationship data...");
    }

    try {
      const [npcResponse, factionResponse] = await Promise.all([
        fetch(`/api/npc-relationships${refresh ? "?refresh=1" : ""}`, { cache: "no-store" }),
        fetch("/api/factions", { cache: "no-store" }),
      ]);
      const body = await npcResponse.json() as {
        data?: NpcRelationshipDataFile;
        error?: string;
      };
      const factionBody = await factionResponse.json() as {
        data?: FactionDataFile;
        error?: string;
      };

      if (!npcResponse.ok || !body.data) {
        throw new Error(body.error || "Unable to load NPC relationship data.");
      }
      if (!factionResponse.ok || !factionBody.data) {
        throw new Error(factionBody.error || "Unable to load faction data.");
      }

      const normalized = normalizeNpcFactionAssignments(body.data, factionBody.data);
      setData(normalized);
      setFactionData(factionBody.data);
      setStatus(refresh ? "NPC relationship data refreshed from notes." : "");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load NPC relationship data.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function saveData(nextData: NpcRelationshipDataFile = data) {
    setIsSaving(true);
    setStatus("Saving NPC relationship data...");

    try {
      const response = await fetch("/api/npc-relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: nextData,
        }),
      });
      const body = await response.json() as {
        data?: NpcRelationshipDataFile;
        error?: string;
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error || "Unable to save NPC relationship data.");
      }

      setData(body.data);
      setStatus("NPC relationship data saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save NPC relationship data.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateNpc(updater: (npc: NpcRelationshipRecord) => NpcRelationshipRecord) {
    if (!selectedNpc) {
      return;
    }

    setData((current) => ({
      ...current,
      npcs: current.npcs.map((npc) => npc.id === selectedNpc.id ? updater(npc) : npc),
    }));
  }

  function randomizeNewNpcName() {
    const selectedFaction = availableFactions.find((faction) => faction.id === newNpcDraft.factionId);
    setNewNpcDraft((current) => ({
      ...current,
      name: generateFantasyName(selectedFaction?.name),
    }));
  }

  function addNewNpc() {
    const name = newNpcDraft.name.trim();
    if (!name) {
      setStatus("Give the new NPC a name before adding them.");
      return;
    }

    const baseId = slugify(name);
    if (!baseId) {
      setStatus("Unable to create an NPC from that name.");
      return;
    }

    let id = baseId;
    let counter = 2;
    while (data.npcs.some((npc) => npc.id === id)) {
      id = `${baseId}-${counter}`;
      counter += 1;
    }

    const faction = availableFactions.find((entry) => entry.id === newNpcDraft.factionId);
    const nextNpc: NpcRelationshipRecord = {
      id,
      name,
      aliases: [],
      role: newNpcDraft.role.trim(),
      faction: faction?.name ?? "",
      factionId: faction?.id ?? "",
      rootFactionId: getRootFactionId(availableFactions, faction?.id ?? ""),
      summary: "",
      attitudes: {
        party: "",
        pcs: {
          Harlan: "",
          Dax: "",
          Jin: "",
          Marcel: "",
        },
      },
      goals: [],
      fears: [],
      leverage: [],
      secrets: [],
      voice: [],
      mannerisms: [],
      roleplayCard: {
        wantsNow: "",
        wontSayFreely: "",
        pressure: "",
        kindness: "",
        threats: "",
        bribes: "",
      },
      lastSeen: "",
      currentLocation: "",
      linkedSessions: [],
      sourcePaths: ["manual"],
      portraitPath: "",
      notes: "",
    };

    setData((current) => ({
      ...current,
      npcs: [...current.npcs, nextNpc].sort((left, right) => left.name.localeCompare(right.name)),
    }));
    setSelectedId(id);
    setNewNpcDraft({
      factionId: newNpcDraft.factionId,
      name: "",
      role: "",
    });
    setStatus(`Added ${name} to the NPC tracker.`);
  }

  function updateRoleplayField(key: keyof NpcRoleplayCard, value: string) {
    updateNpc((npc) => ({
      ...npc,
      roleplayCard: {
        ...npc.roleplayCard,
        [key]: value,
      },
    }));
  }

  function updateListField(
    key: "aliases" | "goals" | "fears" | "leverage" | "secrets" | "voice" | "mannerisms",
    value: string,
  ) {
    updateNpc((npc) => ({
      ...npc,
      [key]: splitMultiline(value),
    }));
  }

  async function beginPortraitCrop(file: File) {
    if (!selectedNpc) {
      return;
    }

    const source = await readFileAsDataUrl(file);
    const dimensions = await readImageDimensions(source);
    setCropState(createInitialPortraitCrop(dimensions.width, dimensions.height, source));
    setStatus(`Cropping portrait for ${selectedNpc.name}.`);
  }

  async function handlePortraitFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await beginPortraitCrop(file);
    event.target.value = "";
  }

  function updatePortraitCrop(nextPartial: Partial<PortraitCropState>) {
    setCropState((current) => current ? clampPortraitCrop({ ...current, ...nextPartial }) : current);
  }

  async function savePortraitCrop() {
    if (!selectedNpc || !cropState) {
      return;
    }

    setIsSavingPortrait(true);
    setStatus(`Saving portrait for ${selectedNpc.name}...`);

    try {
      const imageDataUrl = await renderPortraitCrop(cropState);
      const response = await fetch("/api/npc-relationships/portrait", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npcId: selectedNpc.id,
          imageDataUrl,
        }),
      });
      const body = await response.json() as {
        error?: string;
        portraitPath?: string;
      };

      if (!response.ok || !body.portraitPath) {
        throw new Error(body.error || "Unable to save portrait.");
      }

      const nextData = {
        ...data,
        npcs: data.npcs.map((npc) => npc.id === selectedNpc.id
          ? { ...npc, portraitPath: body.portraitPath ?? npc.portraitPath }
          : npc),
      };

      setCropState(null);
      setData(nextData);
      await saveData(nextData);
      setStatus(`Portrait saved for ${selectedNpc.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save portrait.");
    } finally {
      setIsSavingPortrait(false);
    }
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-col bg-stone-50/92">
      <AppPanelHeader />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Relationship & Roleplay Tool
            </p>
            <h2 className="mt-1 text-3xl font-semibold text-stone-900">NPC Tracker</h2>
            <p className="mt-2 max-w-3xl text-sm text-stone-600">
              Track motives, secrets, attitudes, and quick roleplay cues from your continuity and session notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-end gap-2 rounded-[24px] border border-stone-300 bg-white px-3 py-2 shadow-sm">
              <label className="block min-w-[170px]">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  New NPC Faction
                </span>
                <select
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setNewNpcDraft((current) => ({ ...current, factionId: event.target.value }))}
                  value={newNpcDraft.factionId}
                >
                  <option value="">No faction</option>
                  {availableFactions.map((faction) => (
                    <option key={faction.id} value={faction.id}>{faction.name}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-[220px]">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Name
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setNewNpcDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Random or manual name"
                  type="text"
                  value={newNpcDraft.name}
                />
              </label>

              <label className="block min-w-[180px]">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Role
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => setNewNpcDraft((current) => ({ ...current, role: event.target.value }))}
                  placeholder="Guard, noble, agent..."
                  type="text"
                  value={newNpcDraft.role}
                />
              </label>

              <button
                className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={randomizeNewNpcName}
                type="button"
              >
                Random Name
              </button>

              <button
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-700"
                onClick={addNewNpc}
                type="button"
              >
                Add NPC
              </button>
            </div>

            <div className="inline-flex rounded-full border border-stone-300 bg-white p-1 shadow-sm">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "dossier"
                    ? "bg-stone-900 text-stone-50"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
                onClick={() => setViewMode("dossier")}
                type="button"
              >
                Dossier
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "roleplay"
                    ? "bg-stone-900 text-stone-50"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
                onClick={() => setViewMode("roleplay")}
                type="button"
              >
                Roleplay Card
              </button>
            </div>

            <button
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRefreshing}
              onClick={() => void loadData(true)}
              type="button"
            >
              {isRefreshing ? "Refreshing..." : "Refresh From Notes"}
            </button>
            <button
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isSaving}
              onClick={() => void saveData()}
              type="button"
            >
              {isSaving ? "Saving..." : "Save JSON"}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 rounded-[28px] border border-stone-300/80 bg-white/95 p-5 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <div className="space-y-3">
              <input
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search NPCs..."
                type="text"
                value={search}
              />

              <div className="max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto pr-1">
                {filteredNpcs.map((npc) => {
                  const active = npc.id === selectedNpc?.id;
                  return (
                    <div
                      className={`block w-full rounded-3xl border px-4 py-4 text-left transition ${
                        active
                          ? "border-amber-300 bg-amber-100 text-stone-950"
                          : "border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
                      }`}
                      key={npc.id}
                    >
                      <button
                        className="block w-full text-left"
                        onClick={() => setSelectedId(npc.id)}
                        type="button"
                      >
                        <p className="font-semibold">{npc.name}</p>
                        {npc.role ? <p className="mt-1 text-sm text-current/80">{npc.role}</p> : null}
                      </button>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        {npc.factionId ? (
                          <Link
                            className="rounded-full bg-white/70 px-2 py-1 transition hover:bg-white"
                            href={`/?mode=factions&faction=${encodeURIComponent(npc.factionId)}`}
                          >
                            {npc.faction}
                          </Link>
                        ) : null}
                        {npc.lastSeen ? <span className="rounded-full bg-white/70 px-2 py-1">{npc.lastSeen}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {status ? (
              <div className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-semibold text-stone-700">
                {status}
              </div>
            ) : null}

            {selectedNpc ? (
              viewMode === "roleplay" ? (
                <RoleplayCardView
                  npc={selectedNpc}
                  onRoleplayFieldChange={updateRoleplayField}
                />
              ) : (
                <DossierView
                  factions={availableFactions}
                  isPortraitDragOver={isPortraitDragOver}
                  npc={selectedNpc}
                  onListFieldChange={updateListField}
                  onNpcChange={updateNpc}
                  onOpenPortraitFilePicker={() => fileInputRef.current?.click()}
                  onPortraitDragStateChange={setIsPortraitDragOver}
                  onPortraitDrop={async (file) => {
                    setIsPortraitDragOver(false);
                    await beginPortraitCrop(file);
                  }}
                  onRoleplayFieldChange={updateRoleplayField}
                />
              )
            ) : (
              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-8 text-stone-600 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                No NPCs found yet. Refresh from notes to generate the tracker JSON.
              </section>
            )}
          </div>
        </div>
      </div>

      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => void handlePortraitFileChange(event)}
        ref={fileInputRef}
        type="file"
      />

      {cropState ? (
        <PortraitCropModal
          cropState={cropState}
          isSaving={isSavingPortrait}
          npcName={selectedNpc?.name ?? "NPC"}
          onClose={() => setCropState(null)}
          onCropChange={updatePortraitCrop}
          onSave={() => void savePortraitCrop()}
        />
      ) : null}
    </section>
  );
}

type DossierViewProps = {
  factions: FactionRecord[];
  isPortraitDragOver: boolean;
  npc: NpcRelationshipRecord;
  onListFieldChange: (key: "aliases" | "goals" | "fears" | "leverage" | "secrets" | "voice" | "mannerisms", value: string) => void;
  onNpcChange: (updater: (npc: NpcRelationshipRecord) => NpcRelationshipRecord) => void;
  onOpenPortraitFilePicker: () => void;
  onPortraitDragStateChange: (isOver: boolean) => void;
  onPortraitDrop: (file: File) => Promise<void>;
  onRoleplayFieldChange: (key: keyof NpcRoleplayCard, value: string) => void;
};

function DossierView({
  factions,
  isPortraitDragOver,
  npc,
  onListFieldChange,
  onNpcChange,
  onOpenPortraitFilePicker,
  onPortraitDragStateChange,
  onPortraitDrop,
  onRoleplayFieldChange,
}: DossierViewProps) {
  return (
    <>
      <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
        <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-3">
            <button
              className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[28px] border border-dashed text-center text-sm font-semibold transition ${
                isPortraitDragOver
                  ? "border-amber-500 bg-amber-100 text-amber-900"
                  : "border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100"
              }`}
              onClick={onOpenPortraitFilePicker}
              onDragEnter={(event) => {
                event.preventDefault();
                onPortraitDragStateChange(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                onPortraitDragStateChange(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                onPortraitDragStateChange(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (!file) {
                  onPortraitDragStateChange(false);
                  return;
                }

                void onPortraitDrop(file);
              }}
              type="button"
            >
              {npc.portraitPath ? (
                <div
                  aria-label={`${npc.name} portrait`}
                  className="h-full w-full rounded-[28px] bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url("${npc.portraitPath}")` }}
                />
              ) : (
                <span>Portrait Slot</span>
              )}
              <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-full bg-stone-950/72 px-3 py-2 text-xs font-semibold text-stone-50">
                Drop image or click to upload
              </div>
            </button>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Portrait Path
              </span>
              <input
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                onChange={(event) => onNpcChange((current) => ({ ...current, portraitPath: event.target.value }))}
                placeholder="/api/npc-relationships/portrait?file=dorian.png"
                type="text"
                value={npc.portraitPath}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Name
              </span>
              <input
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                onChange={(event) => onNpcChange((current) => ({ ...current, name: event.target.value }))}
                placeholder="NPC name"
                type="text"
                value={npc.name}
              />
            </label>

            <MultilineField
              label="Aliases"
              onChange={(value) => onListFieldChange("aliases", value)}
              value={npc.aliases.join("\n")}
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">NPC Profile</p>
              <h3 className="mt-1 text-3xl font-semibold text-stone-900">{npc.name}</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Role
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => onNpcChange((current) => ({ ...current, role: event.target.value }))}
                  placeholder="Role in the story"
                  type="text"
                  value={npc.role}
                />
              </label>

              <div className="space-y-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Faction
                  </span>
                  <select
                    className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                    onChange={(event) => {
                      const nextFactionId = event.target.value;
                      const nextFaction = factions.find((faction) => faction.id === nextFactionId);
                      onNpcChange((current) => ({
                        ...current,
                        faction: nextFaction?.name ?? "",
                        factionId: nextFaction?.id ?? "",
                        rootFactionId: getRootFactionId(factions, nextFaction?.id ?? ""),
                      }));
                    }}
                    value={npc.factionId}
                  >
                    <option value="">No faction</option>
                    {factions.map((faction) => (
                      <option key={faction.id} value={faction.id}>
                        {faction.name}
                      </option>
                    ))}
                  </select>
                </label>
                {npc.factionId ? (
                  <Link
                    className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    href={`/?mode=factions&faction=${encodeURIComponent(npc.factionId)}`}
                  >
                    Open In Faction Tracker
                  </Link>
                ) : null}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Summary
              </span>
              <textarea
                className="h-24 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                onChange={(event) => onNpcChange((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Quick table summary"
                value={npc.summary}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Last Seen
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => onNpcChange((current) => ({ ...current, lastSeen: event.target.value }))}
                  placeholder="Last session or scene"
                  type="text"
                  value={npc.lastSeen}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Current Location
                </span>
                <input
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                  onChange={(event) => onNpcChange((current) => ({ ...current, currentLocation: event.target.value }))}
                  placeholder="Where are they now?"
                  type="text"
                  value={npc.currentLocation}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Profile Notes
              </span>
              <textarea
                className="h-24 w-full rounded-2xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600 focus:bg-white"
                onChange={(event) => onNpcChange((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Freeform reminders, reveals, plans..."
                value={npc.notes}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Attitudes</p>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <TextAreaCard
            label="Toward The Party"
            onChange={(value) => onNpcChange((current) => ({
              ...current,
              attitudes: {
                ...current.attitudes,
                party: value,
              },
            }))}
            value={npc.attitudes.party}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(npc.attitudes.pcs).map(([pcName, value]) => (
              <TextAreaCard
                key={pcName}
                label={`Toward ${pcName}`}
                onChange={(nextValue) => onNpcChange((current) => ({
                  ...current,
                  attitudes: {
                    ...current.attitudes,
                    pcs: {
                      ...current.attitudes.pcs,
                      [pcName]: nextValue,
                    },
                  },
                }))}
                value={value}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
        <div className="grid gap-4 xl:grid-cols-2">
          <MultilineField label="Goals" onChange={(value) => onListFieldChange("goals", value)} value={npc.goals.join("\n")} />
          <MultilineField label="Fears" onChange={(value) => onListFieldChange("fears", value)} value={npc.fears.join("\n")} />
          <MultilineField label="Leverage The Party Has" onChange={(value) => onListFieldChange("leverage", value)} value={npc.leverage.join("\n")} />
          <MultilineField label="Secrets" onChange={(value) => onListFieldChange("secrets", value)} value={npc.secrets.join("\n")} />
          <MultilineField label="Voice / Persona" onChange={(value) => onListFieldChange("voice", value)} value={npc.voice.join("\n")} />
          <MultilineField label="Mannerisms / Roleplay" onChange={(value) => onListFieldChange("mannerisms", value)} value={npc.mannerisms.join("\n")} />
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Roleplay Card Defaults</p>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <TextAreaCard label="What They Want Right Now" onChange={(value) => onRoleplayFieldChange("wantsNow", value)} value={npc.roleplayCard.wantsNow} />
          <TextAreaCard label="What They Won't Say Freely" onChange={(value) => onRoleplayFieldChange("wontSayFreely", value)} value={npc.roleplayCard.wontSayFreely} />
          <TextAreaCard label="Reaction To Pressure" onChange={(value) => onRoleplayFieldChange("pressure", value)} value={npc.roleplayCard.pressure} />
          <TextAreaCard label="Reaction To Kindness" onChange={(value) => onRoleplayFieldChange("kindness", value)} value={npc.roleplayCard.kindness} />
          <TextAreaCard label="Reaction To Threats" onChange={(value) => onRoleplayFieldChange("threats", value)} value={npc.roleplayCard.threats} />
          <TextAreaCard label="Reaction To Bribes" onChange={(value) => onRoleplayFieldChange("bribes", value)} value={npc.roleplayCard.bribes} />
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Linked Sessions & Scenes</p>
        <div className="mt-4 space-y-3">
          {npc.linkedSessions.length > 0 ? npc.linkedSessions.map((link) => (
            <LinkedSessionRow key={`${link.path}-${link.section}-${link.preview}`} link={link} />
          )) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-500">
              No linked session mentions found yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function RoleplayCardView({
  npc,
  onRoleplayFieldChange,
}: {
  npc: NpcRelationshipRecord;
  onRoleplayFieldChange: (key: keyof NpcRoleplayCard, value: string) => void;
}) {
  return (
    <section className="rounded-[32px] border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,222,0.95))] p-8 shadow-[0_28px_80px_rgba(52,38,18,0.14)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-800">Quick Roleplay Card</p>
          <h3 className="mt-1 text-4xl font-semibold text-stone-900">{npc.name}</h3>
          <p className="mt-2 max-w-3xl text-base text-stone-700">{npc.summary || npc.role}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {npc.factionId ? (
            <Link
              className="rounded-full bg-white/80 px-3 py-1.5 text-stone-700 transition hover:bg-white"
              href={`/?mode=factions&faction=${encodeURIComponent(npc.factionId)}`}
            >
              {npc.faction}
            </Link>
          ) : null}
          {npc.currentLocation ? <span className="rounded-full bg-white/80 px-3 py-1.5 text-stone-700">{npc.currentLocation}</span> : null}
          {npc.lastSeen ? <span className="rounded-full bg-white/80 px-3 py-1.5 text-stone-700">{npc.lastSeen}</span> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <RoleplayCardField label="What They Want Right Now" onChange={(value) => onRoleplayFieldChange("wantsNow", value)} value={npc.roleplayCard.wantsNow} />
        <RoleplayCardField label="What They Won't Say Freely" onChange={(value) => onRoleplayFieldChange("wontSayFreely", value)} value={npc.roleplayCard.wontSayFreely} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RoleplayCardField label="Pressure" onChange={(value) => onRoleplayFieldChange("pressure", value)} value={npc.roleplayCard.pressure} />
        <RoleplayCardField label="Kindness" onChange={(value) => onRoleplayFieldChange("kindness", value)} value={npc.roleplayCard.kindness} />
        <RoleplayCardField label="Threats" onChange={(value) => onRoleplayFieldChange("threats", value)} value={npc.roleplayCard.threats} />
        <RoleplayCardField label="Bribes" onChange={(value) => onRoleplayFieldChange("bribes", value)} value={npc.roleplayCard.bribes} />
      </div>
    </section>
  );
}

function PortraitCropModal({
  cropState,
  isSaving,
  npcName,
  onClose,
  onCropChange,
  onSave,
}: {
  cropState: PortraitCropState;
  isSaving: boolean;
  npcName: string;
  onClose: () => void;
  onCropChange: (nextPartial: Partial<PortraitCropState>) => void;
  onSave: () => void;
}) {
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 px-4 py-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-4xl rounded-[32px] border border-stone-300 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Crop Portrait</p>
            <h3 className="mt-1 text-2xl font-semibold text-stone-900">{npcName}</h3>
            <p className="mt-2 text-sm text-stone-600">
              Drag the image inside the frame and adjust the zoom until the portrait looks right.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isSaving}
              onClick={onSave}
              type="button"
            >
              {isSaving ? "Saving..." : "Save Portrait"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6">
            <div
              className="mx-auto overflow-hidden rounded-[28px] border border-dashed border-stone-300 bg-stone-200"
              style={{
                height: PORTRAIT_FRAME_HEIGHT,
                width: PORTRAIT_FRAME_WIDTH,
              }}
            >
              <div
                className="relative h-full w-full touch-none"
                onPointerDown={(event) => {
                  dragState.current = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    x: cropState.x,
                    y: cropState.y,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
                    return;
                  }

                  onCropChange({
                    x: dragState.current.x + (event.clientX - dragState.current.startX),
                    y: dragState.current.y + (event.clientY - dragState.current.startY),
                  });
                }}
                onPointerUp={(event) => {
                  if (dragState.current?.pointerId === event.pointerId) {
                    dragState.current = null;
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
              >
                <div
                  aria-label={`${npcName} crop source`}
                  className="pointer-events-none absolute left-0 top-0 select-none bg-cover bg-center"
                  role="img"
                  style={{
                    backgroundImage: `url("${cropState.source}")`,
                    height: cropState.imageHeight * cropState.zoom,
                    transform: `translate(${cropState.x}px, ${cropState.y}px)`,
                    width: cropState.imageWidth * cropState.zoom,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-stone-200 bg-stone-50 p-6">
            <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Zoom
                </span>
                <input
                  className="w-full"
                  max={getMinZoom(cropState) * 3}
                  min={getMinZoom(cropState)}
                  onChange={(event) => onCropChange({ zoom: Number(event.target.value) })}
                  step={0.01}
                  type="range"
                value={cropState.zoom}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Horizontal
              </span>
              <input
                className="w-full"
                max={PORTRAIT_FRAME_WIDTH}
                min={-PORTRAIT_FRAME_WIDTH}
                onChange={(event) => onCropChange({ x: Number(event.target.value) })}
                step={1}
                type="range"
                value={cropState.x}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Vertical
              </span>
              <input
                className="w-full"
                max={PORTRAIT_FRAME_HEIGHT}
                min={-PORTRAIT_FRAME_HEIGHT}
                onChange={(event) => onCropChange({ y: Number(event.target.value) })}
                step={1}
                type="range"
                value={cropState.y}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function MultilineField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return <TextAreaCard label={label} onChange={onChange} value={value} />;
}

function TextAreaCard({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <textarea
        className="mt-3 h-28 w-full bg-transparent text-sm leading-6 text-stone-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function RoleplayCardField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block rounded-[24px] border border-amber-200 bg-white/80 px-4 py-4">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
        {label}
      </span>
      <textarea
        className="mt-3 h-32 w-full bg-transparent text-sm leading-6 text-stone-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function LinkedSessionRow({ link }: { link: NpcRelationshipLink }) {
  return (
    <Link
      className="block rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 transition hover:bg-stone-100"
      href={`/?file=${encodeURIComponent(link.path)}`}
    >
      <p className="text-sm font-semibold text-stone-900">{link.title}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{link.section}</p>
      {link.preview ? <p className="mt-2 text-sm text-stone-700">{link.preview}</p> : null}
    </Link>
  );
}

function splitMultiline(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(source: string) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = source;
  });
}

function createInitialPortraitCrop(width: number, height: number, source: string): PortraitCropState {
  const baseScale = Math.max(PORTRAIT_FRAME_WIDTH / width, PORTRAIT_FRAME_HEIGHT / height);
  const scaledWidth = width * baseScale;
  const scaledHeight = height * baseScale;

  return {
    source,
    imageWidth: width,
    imageHeight: height,
    zoom: baseScale,
    x: (PORTRAIT_FRAME_WIDTH - scaledWidth) / 2,
    y: (PORTRAIT_FRAME_HEIGHT - scaledHeight) / 2,
  };
}

function clampPortraitCrop(cropState: PortraitCropState) {
  const minZoom = getMinZoom(cropState);
  const nextZoom = Math.max(minZoom, Math.min(minZoom * 3, cropState.zoom));
  const scaledWidth = cropState.imageWidth * nextZoom;
  const scaledHeight = cropState.imageHeight * nextZoom;
  const minX = Math.min(0, PORTRAIT_FRAME_WIDTH - scaledWidth);
  const maxX = Math.max(0, PORTRAIT_FRAME_WIDTH - scaledWidth);
  const minY = Math.min(0, PORTRAIT_FRAME_HEIGHT - scaledHeight);
  const maxY = Math.max(0, PORTRAIT_FRAME_HEIGHT - scaledHeight);

  return {
    ...cropState,
    zoom: nextZoom,
    x: clamp(cropState.x, minX, maxX),
    y: clamp(cropState.y, minY, maxY),
  };
}

async function renderPortraitCrop(cropState: PortraitCropState) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_PORTRAIT_WIDTH;
  canvas.height = OUTPUT_PORTRAIT_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare portrait canvas.");
  }

  const image = await loadImageElement(cropState.source);
  const scaleFactor = OUTPUT_PORTRAIT_WIDTH / PORTRAIT_FRAME_WIDTH;

  context.drawImage(
    image,
    cropState.x * scaleFactor,
    cropState.y * scaleFactor,
    cropState.imageWidth * cropState.zoom * scaleFactor,
    cropState.imageHeight * cropState.zoom * scaleFactor,
  );

  return canvas.toDataURL("image/png");
}

function loadImageElement(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load crop image."));
    image.src = source;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}


function getMinZoom(cropState: PortraitCropState) {
  return Math.max(
    PORTRAIT_FRAME_WIDTH / cropState.imageWidth,
    PORTRAIT_FRAME_HEIGHT / cropState.imageHeight,
  );
}

function getRootFactionId(factions: FactionRecord[], factionId: string) {
  let current = factions.find((faction) => faction.id === factionId) ?? null;
  while (current?.parentId) {
    current = factions.find((faction) => faction.id === current?.parentId) ?? null;
  }
  return current?.id ?? "";
}

function normalizeNpcFactionAssignments(data: NpcRelationshipDataFile, factionData: FactionDataFile): NpcRelationshipDataFile {
  return {
    ...data,
    npcs: data.npcs.map((npc) => {
      const resolvedFaction = resolveFactionRecord(factionData.factions, npc.factionId, npc.faction);
      if (!resolvedFaction) {
        return npc;
      }

      return {
        ...npc,
        faction: resolvedFaction.name,
        factionId: resolvedFaction.id,
        rootFactionId: getRootFactionId(factionData.factions, resolvedFaction.id),
      };
    }),
  };
}

function resolveFactionRecord(factions: FactionRecord[], factionId: string, factionName: string) {
  if (factionId) {
    const direct = factions.find((faction) => faction.id === factionId);
    if (direct) {
      return direct;
    }
  }

  const cleanName = cleanupFactionLabel(factionName);
  if (!cleanName) {
    return null;
  }

  return factions.find((faction) => {
    const normalized = cleanupFactionLabel(faction.name);
    return normalized === cleanName
      || normalized === `House ${cleanName}`
      || normalized === `Clan ${cleanName}`;
  }) ?? null;
}

function cleanupFactionLabel(value: string) {
  return value
    .replace(/^(Good|Bad|Ugly|Mixed|Shifting)\s+within\s+/i, "")
    .replace(/^the\s+/i, "The ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

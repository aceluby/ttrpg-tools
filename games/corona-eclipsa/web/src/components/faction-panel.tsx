"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppPanelHeader } from "@/components/app-panel-header";
import type { FactionDataFile, FactionLens, FactionRecord } from "@/lib/factions";
import type { NpcRelationshipDataFile } from "@/lib/npc-relationships";

type FactionPanelProps = {
  initialSelectedFactionId?: string;
};

const EMPTY_FACTIONS: FactionDataFile = {
  generatedAt: "",
  factions: [],
};

const EMPTY_NPCS: NpcRelationshipDataFile = {
  generatedAt: "",
  npcs: [],
};

const ROOT_FACTION_IDS = ["everthrone", "cerres", "vraegari", "vaelport", "zephandor"] as const;

export function FactionPanel({ initialSelectedFactionId = "" }: FactionPanelProps) {
  const router = useRouter();
  const [factionData, setFactionData] = useState<FactionDataFile>(EMPTY_FACTIONS);
  const [npcData, setNpcData] = useState<NpcRelationshipDataFile>(EMPTY_NPCS);
  const [selectedFactionId, setSelectedFactionId] = useState(initialSelectedFactionId);
  const [status, setStatus] = useState("Loading faction data...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedFactionIds, setExpandedFactionIds] = useState<string[]>([]);
  const [newFactionName, setNewFactionName] = useState("");
  const [newFactionLens, setNewFactionLens] = useState<FactionLens>("mixed");

  useEffect(() => {
    void loadAll(false);
  }, []);

  useEffect(() => {
    if (initialSelectedFactionId) {
      setSelectedFactionId(initialSelectedFactionId);
    }
  }, [initialSelectedFactionId]);

  const rootFactions = useMemo(() => {
    return ROOT_FACTION_IDS
      .map((id) => factionData.factions.find((faction) => faction.id === id))
      .filter((faction): faction is FactionRecord => Boolean(faction));
  }, [factionData.factions]);

  const selectedFaction = useMemo(() => {
    return factionData.factions.find((faction) => faction.id === selectedFactionId)
      ?? rootFactions[0]
      ?? factionData.factions[0]
      ?? null;
  }, [factionData.factions, rootFactions, selectedFactionId]);

  const childFactions = useMemo(() => {
    if (!selectedFaction) {
      return [];
    }

    return getSortedChildren(factionData.factions, selectedFaction.id);
  }, [factionData.factions, selectedFaction]);

  const linkedNpcs = useMemo(() => {
    if (!selectedFaction) {
      return [];
    }

    const factionIds = new Set(collectFactionBranchIds(factionData.factions, selectedFaction.id));
    const directIds = new Set(collectFactionNpcIds(factionData.factions, selectedFaction.id));
    return npcData.npcs.filter((npc) => directIds.has(npc.id) || factionIds.has(npc.factionId));
  }, [factionData.factions, npcData.npcs, selectedFaction]);

  useEffect(() => {
    if (!selectedFaction) {
      return;
    }

    setExpandedFactionIds((current) => uniqueStrings([
      ...current,
      ...ROOT_FACTION_IDS,
      ...getAncestorIds(factionData.factions, selectedFaction.id),
      selectedFaction.id,
    ]));
  }, [factionData.factions, selectedFaction]);

  useEffect(() => {
    if (!selectedFaction) {
      return;
    }

    if (selectedFaction.id !== selectedFactionId) {
      setSelectedFactionId(selectedFaction.id);
      return;
    }

    router.replace(`/?mode=factions&faction=${encodeURIComponent(selectedFaction.id)}`, {
      scroll: false,
    });
  }, [router, selectedFaction, selectedFactionId]);

  async function loadAll(refresh: boolean) {
    if (refresh) {
      setIsRefreshing(true);
      setStatus("Refreshing faction graph from notes...");
    } else {
      setStatus("Loading faction data...");
    }

    try {
      const [factionResponse, npcResponse] = await Promise.all([
        fetch(`/api/factions${refresh ? "?refresh=1" : ""}`, { cache: "no-store" }),
        fetch(`/api/npc-relationships${refresh ? "?refresh=1" : ""}`, { cache: "no-store" }),
      ]);

      const factionBody = await factionResponse.json() as { data?: FactionDataFile; error?: string };
      const npcBody = await npcResponse.json() as { data?: NpcRelationshipDataFile; error?: string };

      if (!factionResponse.ok || !factionBody.data) {
        throw new Error(factionBody.error || "Unable to load faction data.");
      }

      if (!npcResponse.ok || !npcBody.data) {
        throw new Error(npcBody.error || "Unable to load NPC data.");
      }

      setFactionData(factionBody.data);
      setNpcData(npcBody.data);
      setStatus(refresh ? "Faction data refreshed from notes." : "");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load faction data.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function saveFactions(nextData: FactionDataFile = factionData) {
    setIsSaving(true);
    setStatus("Saving faction data...");

    try {
      const [response, npcResponse] = await Promise.all([
        fetch("/api/factions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: nextData }),
        }),
        fetch("/api/npc-relationships", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: npcData }),
        }),
      ]);
      const body = await response.json() as { data?: FactionDataFile; error?: string };
      const npcBody = await npcResponse.json() as { data?: NpcRelationshipDataFile; error?: string };
      if (!response.ok || !body.data) {
        throw new Error(body.error || "Unable to save faction data.");
      }
      if (!npcResponse.ok || !npcBody.data) {
        throw new Error(npcBody.error || "Unable to save NPC relationship data.");
      }

      setFactionData(body.data);
      setNpcData(npcBody.data);
      setStatus("Faction data saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save faction data.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateFaction(updater: (faction: FactionRecord) => FactionRecord) {
    if (!selectedFaction) {
      return;
    }

    setFactionData((current) => ({
      ...current,
      factions: current.factions.map((faction) => faction.id === selectedFaction.id ? updater(faction) : faction),
    }));
  }

  function addChildFaction() {
    if (!selectedFaction || !newFactionName.trim()) {
      return;
    }

    const name = newFactionName.trim();
    const idBase = slugify(name);
    if (!idBase) {
      return;
    }

    let id = idBase;
    let counter = 2;
    while (factionData.factions.some((faction) => faction.id === id)) {
      id = `${idBase}-${counter}`;
      counter += 1;
    }

    const nextFaction: FactionRecord = {
      id,
      name,
      aliases: [],
      childIds: [],
      keyPeople: [],
      lens: newFactionLens,
      notes: "",
      npcIds: [],
      parentId: selectedFaction.id,
      risks: [],
      sourcePath: "manual",
      summary: "",
      tier: "group",
      why: [],
    };

    setFactionData((current) => ({
      ...current,
      factions: [...current.factions, nextFaction],
    }));
    setExpandedFactionIds((current) => uniqueStrings([...current, selectedFaction.id]));
    setSelectedFactionId(id);
    setNewFactionName("");
    setStatus(`Added ${name} under ${selectedFaction.name}.`);
  }

  function removeSelectedFaction() {
    if (!selectedFaction || ROOT_FACTION_IDS.includes(selectedFaction.id as (typeof ROOT_FACTION_IDS)[number])) {
      return;
    }

    const factionIdsToMove = new Set([selectedFaction.id, ...collectFactionBranchIds(factionData.factions, selectedFaction.id)]);
    const parentId = selectedFaction.parentId ?? "";

    setFactionData((current) => ({
      ...current,
      factions: current.factions
        .filter((faction) => faction.id !== selectedFaction.id)
        .map((faction) => factionIdsToMove.has(faction.parentId ?? "")
          ? { ...faction, parentId }
          : faction),
    }));
    setNpcData((current) => ({
      ...current,
      npcs: current.npcs.map((npc) => factionIdsToMove.has(npc.factionId)
        ? {
            ...npc,
            factionId: parentId,
            faction: factionData.factions.find((faction) => faction.id === parentId)?.name ?? npc.faction,
            rootFactionId: getRootFactionId(factionData.factions, parentId),
          }
        : npc),
    }));
    setSelectedFactionId(parentId);
    setExpandedFactionIds((current) => current.filter((id) => id !== selectedFaction.id));
    setStatus(`Removed ${selectedFaction.name}.`);
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-col bg-stone-50/92">
      <AppPanelHeader />

      <div className="shrink-0 border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Faction Relationship Tool</p>
            <h2 className="mt-1 text-3xl font-semibold text-stone-900">Faction Tracker</h2>
            <p className="mt-2 max-w-3xl text-sm text-stone-600">
              Start with the top-level forces, drill into good/bad/ugly subfactions, and follow the graph down to the NPCs inside them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRefreshing}
              onClick={() => void loadAll(true)}
              type="button"
            >
              {isRefreshing ? "Refreshing..." : "Refresh From Notes"}
            </button>
            <button
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={isSaving}
              onClick={() => void saveFactions()}
              type="button"
            >
              {isSaving ? "Saving..." : "Save JSON"}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-stone-300/80 bg-white/95 p-4 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
            <div className="max-h-[calc(100vh-220px)] space-y-1.5 overflow-y-auto pr-1">
              {rootFactions.map((faction) => {
                return (
                  <FactionTreeNode
                    expandedFactionIds={expandedFactionIds}
                    faction={faction}
                    factions={factionData.factions}
                    key={faction.id}
                    onSelect={setSelectedFactionId}
                    selectedFactionId={selectedFaction?.id ?? ""}
                    onToggleExpand={(id) => setExpandedFactionIds((current) => (
                      current.includes(id)
                        ? current.filter((value) => value !== id)
                        : [...current, id]
                    ))}
                  />
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            {status ? (
              <div className="rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-semibold text-stone-700">
                {status}
              </div>
            ) : null}

            {selectedFaction ? (
              <>
                <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                        {selectedFaction.tier} • {capitalize(selectedFaction.lens)}
                      </p>
                      <h3 className="mt-1 text-3xl font-semibold text-stone-900">{selectedFaction.name}</h3>
                    </div>

                    {selectedFaction.parentId ? (
                      <button
                        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                        onClick={() => setSelectedFactionId(selectedFaction.parentId ?? "")}
                        type="button"
                      >
                        Back To Parent
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <EditableField
                      label="Summary"
                      onChange={(value) => updateFaction((faction) => ({ ...faction, summary: value }))}
                      value={selectedFaction.summary}
                    />
                    <EditableField
                      label="Notes"
                      onChange={(value) => updateFaction((faction) => ({ ...faction, notes: value }))}
                      value={selectedFaction.notes}
                    />
                    <EditableListField
                      label="Why"
                      onChange={(value) => updateFaction((faction) => ({ ...faction, why: splitLines(value) }))}
                      value={selectedFaction.why.join("\n")}
                    />
                    <EditableListField
                      label="Risks"
                      onChange={(value) => updateFaction((faction) => ({ ...faction, risks: splitLines(value) }))}
                      value={selectedFaction.risks.join("\n")}
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 xl:flex-row xl:items-end">
                    <label className="block min-w-0 flex-1">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">New Child Faction</span>
                      <input
                        className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
                        onChange={(event) => setNewFactionName(event.target.value)}
                        placeholder={`Add faction under ${selectedFaction.name}`}
                        type="text"
                        value={newFactionName}
                      />
                    </label>
                    <label className="block xl:w-44">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Lens</span>
                      <select
                        className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-600"
                        onChange={(event) => setNewFactionLens(event.target.value as FactionLens)}
                        value={newFactionLens}
                      >
                        {["good", "bad", "ugly", "mixed", "shifting", "unknown"].map((lens) => (
                          <option key={lens} value={lens}>{capitalize(lens)}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                      onClick={addChildFaction}
                      type="button"
                    >
                      Add Child
                    </button>
                    {!ROOT_FACTION_IDS.includes(selectedFaction.id as (typeof ROOT_FACTION_IDS)[number]) ? (
                      <button
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        onClick={removeSelectedFaction}
                        type="button"
                      >
                        Remove Faction
                      </button>
                    ) : null}
                  </div>
                </section>

                {childFactions.length > 0 ? (
                  <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Good / Bad / Ugly Drill-Down</p>
                    <div className="mt-4 grid gap-4 xl:grid-cols-3">
                      {childFactions.map((faction) => (
                        <button
                          className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:bg-stone-100"
                          key={faction.id}
                          onClick={() => setSelectedFactionId(faction.id)}
                          type="button"
                        >
                          <p className="font-semibold text-stone-900">{faction.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{capitalize(faction.lens)}</p>
                          {faction.summary ? <p className="mt-3 text-sm text-stone-700">{faction.summary}</p> : null}
                          {faction.keyPeople.length > 0 ? (
                            <p className="mt-3 text-sm text-stone-600">Key people: {faction.keyPeople.slice(0, 3).join(", ")}</p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Key NPCs</p>
                      <p className="mt-2 text-sm text-stone-600">
                        Jump straight into the NPC tracker for individuals tied to this faction.
                      </p>
                    </div>
                    <Link
                      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                      href={`/?mode=npcs${linkedNpcs[0] ? `&npc=${encodeURIComponent(linkedNpcs[0].id)}` : ""}`}
                    >
                      Open NPC Tracker
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    {linkedNpcs.length > 0 ? linkedNpcs.map((npc) => (
                      <Link
                        className="block rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 transition hover:bg-stone-100"
                        href={`/?mode=npcs&npc=${encodeURIComponent(npc.id)}`}
                        key={npc.id}
                      >
                        <p className="font-semibold text-stone-900">{npc.name}</p>
                        {npc.role ? <p className="mt-1 text-sm text-stone-700">{npc.role}</p> : null}
                        {npc.summary ? <p className="mt-2 text-sm text-stone-600">{npc.summary}</p> : null}
                      </Link>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-500">
                        No linked NPCs found for this faction yet.
                      </div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section className="rounded-[28px] border border-stone-300/80 bg-white/95 p-8 text-stone-600 shadow-[0_24px_80px_rgba(52,38,18,0.12)]">
                No factions found yet. Refresh from notes to generate the tracker JSON.
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableField({
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
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <textarea
        className="mt-3 h-28 w-full bg-transparent text-sm leading-6 text-stone-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function EditableListField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return <EditableField label={label} onChange={onChange} value={value} />;
}

function splitLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function capitalize(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function FactionTreeNode({
  expandedFactionIds,
  faction,
  factions,
  onSelect,
  selectedFactionId,
  onToggleExpand,
}: {
  expandedFactionIds: string[];
  faction: FactionRecord;
  factions: FactionRecord[];
  onSelect: (id: string) => void;
  selectedFactionId: string;
  onToggleExpand: (id: string) => void;
}) {
  const children = getSortedChildren(factions, faction.id);
  const active = faction.id === selectedFactionId;
  const branchActive = active || hasSelectedDescendant(factions, faction.id, selectedFactionId);
  const isExpanded = expandedFactionIds.includes(faction.id);

  return (
    <div className="space-y-1.5">
      <div
        className={`rounded-2xl border px-3 py-2.5 transition ${
          active
            ? "border-amber-300 bg-amber-100 text-stone-950"
            : branchActive
              ? "border-amber-200 bg-amber-50 text-stone-900 hover:bg-amber-100/70"
              : "border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
        }`}
      >
        <div className="flex items-start gap-3">
          {children.length > 0 ? (
            <button
              aria-label={isExpanded ? `Collapse ${faction.name}` : `Expand ${faction.name}`}
              className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-stone-300 bg-white/70 text-xs font-semibold text-stone-700 transition hover:bg-white"
              onClick={() => onToggleExpand(faction.id)}
              type="button"
            >
              {isExpanded ? "−" : "+"}
            </button>
          ) : (
            <div className="mt-0.5 h-6 w-6 shrink-0" />
          )}

          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => onSelect(faction.id)}
            type="button"
          >
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{faction.name}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
              <span className="rounded-full bg-white/70 px-2 py-0.5 uppercase tracking-[0.12em]">
                {capitalize(faction.lens)}
              </span>
              {children.length > 0 ? (
                <span className="rounded-full bg-white/70 px-2 py-0.5">{children.length} children</span>
              ) : null}
            </div>
          </button>
        </div>
      </div>

      {children.length > 0 && isExpanded ? (
        <div className="ml-3 space-y-1.5 border-l border-stone-200 pl-2.5">
          {children.map((child) => (
            <FactionTreeNode
              expandedFactionIds={expandedFactionIds}
              faction={child}
              factions={factions}
              key={child.id}
              onSelect={onSelect}
              selectedFactionId={selectedFactionId}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getSortedChildren(factions: FactionRecord[], parentId: string) {
  return factions
    .filter((faction) => faction.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function hasSelectedDescendant(factions: FactionRecord[], parentId: string, selectedFactionId: string): boolean {
  const children = factions.filter((faction) => faction.parentId === parentId);
  return children.some((child) => child.id === selectedFactionId || hasSelectedDescendant(factions, child.id, selectedFactionId));
}

function getAncestorIds(factions: FactionRecord[], factionId: string) {
  const ancestors: string[] = [];
  let current = factions.find((faction) => faction.id === factionId) ?? null;
  while (current?.parentId) {
    ancestors.push(current.parentId);
    current = factions.find((faction) => faction.id === current?.parentId) ?? null;
  }
  return ancestors;
}

function collectFactionNpcIds(factions: FactionRecord[], factionId: string): string[] {
  const current = factions.find((faction) => faction.id === factionId);
  if (!current) {
    return [];
  }

  const childIds = factions.filter((faction) => faction.parentId === factionId).flatMap((child) => collectFactionNpcIds(factions, child.id));
  return uniqueStrings([...current.npcIds, ...childIds]);
}

function collectFactionBranchIds(factions: FactionRecord[], factionId: string): string[] {
  const children = factions.filter((faction) => faction.parentId === factionId);
  return uniqueStrings([factionId, ...children.flatMap((child) => collectFactionBranchIds(factions, child.id))]);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRootFactionId(factions: FactionRecord[], factionId: string) {
  let current = factions.find((faction) => faction.id === factionId) ?? null;
  while (current?.parentId) {
    current = factions.find((faction) => faction.id === current?.parentId) ?? null;
  }
  return current?.id ?? "";
}

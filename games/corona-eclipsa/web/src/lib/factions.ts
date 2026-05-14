import fs from "node:fs/promises";
import path from "node:path";

import { buildDossierFactionModel, ROOT_FACTION_IDS, type DossierFactionLens, type DossierFactionTier } from "@/lib/npc-faction-dossier";
import { refreshNpcRelationshipData, type NpcRelationshipRecord } from "@/lib/npc-relationships";

export type FactionLens = DossierFactionLens;
export type FactionTier = DossierFactionTier;

export type FactionRecord = {
  aliases: string[];
  childIds: string[];
  id: string;
  keyPeople: string[];
  lens: FactionLens;
  name: string;
  notes: string;
  npcIds: string[];
  parentId: string | null;
  risks: string[];
  sourcePath: string;
  summary: string;
  tier: FactionTier;
  why: string[];
};

export type FactionDataFile = {
  factions: FactionRecord[];
  generatedAt: string;
};

const GAME_ROOT = path.resolve(process.cwd(), "..");
const TRACKER_DIR = path.join(GAME_ROOT, "factions");
const TRACKER_FILE = path.join(TRACKER_DIR, "factions.json");
const SOURCE_PATH = "continuity/npc-faction-dossier.md";

export { ROOT_FACTION_IDS };

export async function loadFactionData(): Promise<FactionDataFile> {
  try {
    const contents = await fs.readFile(TRACKER_FILE, "utf8");
    return JSON.parse(contents) as FactionDataFile;
  } catch {
    return refreshFactionData();
  }
}

export async function saveFactionData(data: FactionDataFile) {
  await fs.mkdir(TRACKER_DIR, { recursive: true });
  await fs.writeFile(TRACKER_FILE, JSON.stringify(data, null, 2), "utf8");
  return data;
}

export async function refreshFactionData(): Promise<FactionDataFile> {
  const markdown = await fs.readFile(path.join(GAME_ROOT, SOURCE_PATH), "utf8");
  const npcData = await refreshNpcRelationshipData();
  const existing = await readExistingFactionData();
  const factions = buildFactionRecords(markdown, npcData.npcs, existing?.factions ?? []);
  const output: FactionDataFile = {
    generatedAt: new Date().toISOString(),
    factions,
  };

  await saveFactionData(output);
  return output;
}

async function readExistingFactionData() {
  try {
    const contents = await fs.readFile(TRACKER_FILE, "utf8");
    return JSON.parse(contents) as FactionDataFile;
  } catch {
    return null;
  }
}

function buildFactionRecords(markdown: string, npcs: NpcRelationshipRecord[], existing: FactionRecord[]) {
  const model = buildDossierFactionModel(markdown);
  const existingById = new Map(existing.map((faction) => [faction.id, faction]));
  const npcById = new Map(npcs.map((npc) => [npc.id, npc]));
  const npcByName = new Map(
    npcs.flatMap((npc) => [
      [slugify(npc.name), npc.id],
      ...npc.aliases.map((alias) => [slugify(alias), npc.id] as const),
    ]),
  );

  const records = model.factions.map((node) => {
    const existingRecord = existingById.get(node.id);
    const directNpcIds = uniqueStrings(node.npcNames.map((name) => npcByName.get(slugify(name)) ?? ""));
    const descendantNpcIds = collectDescendantNpcIds(model.factions, node.id)
      .map((id) => model.factions.find((candidate) => candidate.id === id))
      .flatMap((candidate) => candidate?.npcNames ?? [])
      .map((name) => npcByName.get(slugify(name)) ?? "");
    const npcIds = uniqueStrings([...(existingRecord?.npcIds ?? []), ...directNpcIds, ...descendantNpcIds])
      .filter((id) => npcById.has(id));
    const keyPeople = uniqueStrings([
      ...(existingRecord?.keyPeople ?? []),
      ...node.npcNames,
      ...npcIds.map((id) => npcById.get(id)?.name ?? ""),
    ]);

    return {
      id: node.id,
      name: node.name,
      aliases: uniqueStrings([...(existingRecord?.aliases ?? []), stripLeadingArticle(node.name)]),
      childIds: uniqueStrings(model.factions.filter((candidate) => candidate.parentId === node.id).map((candidate) => candidate.id)),
      keyPeople,
      lens: node.lens,
      notes: node.notes,
      npcIds,
      parentId: node.parentId,
      risks: existingRecord?.risks ?? [],
      sourcePath: SOURCE_PATH,
      summary: node.summary,
      tier: node.tier,
      why: existingRecord?.why ?? [],
    } satisfies FactionRecord;
  });

  return records.sort((left, right) => {
    const leftRoot = rootSort(left.id);
    const rightRoot = rootSort(right.id);
    return leftRoot - rightRoot || left.name.localeCompare(right.name);
  });
}

function collectDescendantNpcIds(
  factions: Array<{ id: string; parentId: string | null; npcNames: string[] }>,
  factionId: string,
): string[] {
  const children = factions.filter((faction) => faction.parentId === factionId);
  return children.flatMap((child) => [child.id, ...collectDescendantNpcIds(factions, child.id)]);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => cleanupText(value ?? "")).filter(Boolean))];
}

function cleanupText(value: string) {
  return value
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[-:| ]+|[-:| ]+$/g, "")
    .trim();
}

function slugify(value: string) {
  return cleanupText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripLeadingArticle(value: string) {
  return cleanupText(value.replace(/^(the)\s+/i, ""));
}

function rootSort(id: string) {
  const index = ROOT_FACTION_IDS.indexOf(id as (typeof ROOT_FACTION_IDS)[number]);
  return index >= 0 ? index : ROOT_FACTION_IDS.length;
}

export function getFactionChildren(data: FactionDataFile, parentId: string | null) {
  return data.factions.filter((faction) => faction.parentId === parentId);
}

export function getFactionById(data: FactionDataFile, factionId: string) {
  return data.factions.find((faction) => faction.id === factionId) ?? null;
}

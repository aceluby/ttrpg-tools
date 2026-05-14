import fs from "node:fs/promises";
import path from "node:path";

import { buildDossierFactionModel, looksLikeNpc } from "@/lib/npc-faction-dossier";

type MarkdownDoc = {
  path: string;
  title: string;
  markdown: string;
};

type PlanMention = {
  path: string;
  title: string;
  section: string;
  preview: string;
  sortKey: string;
};

export type NpcRelationshipLink = {
  path: string;
  title: string;
  section: string;
  preview: string;
};

export type NpcRoleplayCard = {
  bribes: string;
  kindness: string;
  pressure: string;
  threats: string;
  wantsNow: string;
  wontSayFreely: string;
};

export type NpcRelationshipRecord = {
  id: string;
  name: string;
  aliases: string[];
  role: string;
  faction: string;
  factionId: string;
  rootFactionId: string;
  summary: string;
  attitudes: {
    party: string;
    pcs: Record<string, string>;
  };
  goals: string[];
  fears: string[];
  leverage: string[];
  secrets: string[];
  voice: string[];
  mannerisms: string[];
  roleplayCard: NpcRoleplayCard;
  lastSeen: string;
  currentLocation: string;
  linkedSessions: NpcRelationshipLink[];
  sourcePaths: string[];
  portraitPath: string;
  notes: string;
};

export type NpcRelationshipDataFile = {
  generatedAt: string;
  npcs: NpcRelationshipRecord[];
};

const GAME_ROOT = path.resolve(process.cwd(), "..");
const TRACKER_DIR = path.join(GAME_ROOT, "npc-relationships");
const TRACKER_FILE = path.join(TRACKER_DIR, "npc-relationships.json");
const PORTRAITS_DIR = path.join(TRACKER_DIR, "portraits");
const PARTY_NAMES = ["Harlan", "Dax", "Jin", "Marcel"];
const NPC_DOCS = [
  "continuity/npc-faction-dossier.md",
];
const PLAN_DIR = path.join(GAME_ROOT, "plans");
const FENCE = /[`*_]/g;

export async function loadNpcRelationshipData(): Promise<NpcRelationshipDataFile> {
  try {
    const contents = await fs.readFile(TRACKER_FILE, "utf8");
    return JSON.parse(contents) as NpcRelationshipDataFile;
  } catch {
    return refreshNpcRelationshipData();
  }
}

export async function saveNpcRelationshipData(data: NpcRelationshipDataFile) {
  await fs.mkdir(TRACKER_DIR, { recursive: true });
  await fs.writeFile(TRACKER_FILE, JSON.stringify(data, null, 2), "utf8");
  return data;
}

export async function saveNpcPortrait(npcId: string, imageDataUrl: string) {
  const safeId = sanitizeNpcId(npcId);
  const match = imageDataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error("Portrait must be provided as a PNG data URL.");
  }

  await fs.mkdir(PORTRAITS_DIR, { recursive: true });
  const fileName = `${safeId}.png`;
  const absolutePath = path.join(PORTRAITS_DIR, fileName);
  await fs.writeFile(absolutePath, Buffer.from(match[1], "base64"));

  return {
    fileName,
    portraitPath: `/api/npc-relationships/portrait?file=${encodeURIComponent(fileName)}`,
  };
}

export async function readNpcPortrait(fileName: string) {
  const safeName = sanitizePortraitFileName(fileName);
  const absolutePath = path.join(PORTRAITS_DIR, safeName);
  return fs.readFile(absolutePath);
}

export async function refreshNpcRelationshipData(): Promise<NpcRelationshipDataFile> {
  const existing = await readExistingData();
  const npcDocs = await Promise.all(
    NPC_DOCS.map(async (relativePath) => {
      const absolutePath = path.join(GAME_ROOT, relativePath);
      const markdown = await fs.readFile(absolutePath, "utf8");
      return {
        path: relativePath,
        title: getTitle(markdown, relativePath),
        markdown,
      } satisfies MarkdownDoc;
    }),
  );

  const planFiles = await readPlanDocs();
  const planMentions = collectPlanMentions(planFiles);
  const records = buildNpcRecords(npcDocs, planMentions, existing);
  const output: NpcRelationshipDataFile = {
    generatedAt: new Date().toISOString(),
    npcs: records.sort((left, right) => left.name.localeCompare(right.name)),
  };

  await saveNpcRelationshipData(output);
  return output;
}

async function readExistingData() {
  try {
    const contents = await fs.readFile(TRACKER_FILE, "utf8");
    return JSON.parse(contents) as NpcRelationshipDataFile;
  } catch {
    return null;
  }
}

async function readPlanDocs() {
  const entries = await fs.readdir(PLAN_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(PLAN_DIR, entry.name));

  return Promise.all(files.map(async (filePath) => {
    const relativePath = toPosix(path.relative(GAME_ROOT, filePath));
    const markdown = await fs.readFile(filePath, "utf8");
    return {
      path: relativePath,
      title: getTitle(markdown, relativePath),
      markdown,
    } satisfies MarkdownDoc;
  }));
}

function buildNpcRecords(
  docs: MarkdownDoc[],
  planMentions: Map<string, PlanMention[]>,
  existing: NpcRelationshipDataFile | null,
) {
  const existingById = new Map(existing?.npcs.map((record) => [record.id, record]) ?? []);
  const records = new Map<string, NpcRelationshipRecord>();
  const dossierDoc = docs.find((doc) => doc.path === "continuity/npc-faction-dossier.md");
  const factionModel = dossierDoc ? buildDossierFactionModel(dossierDoc.markdown) : null;

  for (const doc of docs) {
    for (const section of splitLevelTwoSections(doc.markdown)) {
      if (!looksLikeNpc(section.title, section.body)) {
        continue;
      }

      const id = slugify(section.title);
      const bullets = parseLabeledBullets(section.body);
      const role = firstValue(bullets, [
        "Role",
        "Public role",
      ]);
      const assignment = factionModel?.npcAssignments.get(id);
      const faction = assignment?.factionName || deriveFaction(section.body);
      const factionId = assignment?.factionId || existingById.get(id)?.factionId || slugify(faction);
      const rootFactionId = assignment?.rootFactionId || existingById.get(id)?.rootFactionId || "";
      const goals = uniqueStrings([
        ...valuesMatchingKeys(bullets, ["Core motive", "Core drive", "True drive", "True political drive", "Motivation"]),
        ...extractInlineStatements(section.body, /\b(wants to|wants|seeks to|tries to|hopes to)\b/i),
      ]);
      const fears = uniqueStrings([
        ...valuesMatchingKeys(bullets, ["Current pressures", "Vice or pressure point", "Open details"]),
        ...extractInlineStatements(section.body, /\b(fears?|afraid|terrified|does not want|avoid)\b/i),
      ]);
      const secrets = uniqueStrings([
        ...valuesMatchingKeys(bullets, ["Secret", "Secrets", "True drive", "True political drive", "Open details", "Threat context"]),
        ...extractInlineStatements(section.body, /\b(secretly|hidden|behind the scenes|does not know|taboo|killed by|works with)\b/i),
      ]);
      const leverage = uniqueStrings([
        ...extractPotentialLeverage(section.body),
        ...extractInlineStatements(section.body, /\b(owes|depends on|needs|caught in|tied to|bonded|soft spot)\b/i),
      ]);
      const publicFace = valuesMatchingKeys(bullets, ["Public face", "Personality", "Core personality"]);
      const mannerisms = valuesMatchingKeys(bullets, ["Physical or behavioral trait"]);
      const partyAttitude = derivePartyAttitude(section.body);
      const pcAttitudes = Object.fromEntries(
        PARTY_NAMES.map((name) => [name, derivePcAttitude(section.body, name)]),
      );
      const linked = planMentions.get(id) ?? [];
      const latestMention = linked[0];
      const currentLocation = deriveCurrentLocation(section.body, latestMention);
      const existingRecord = existingById.get(id);

      const generated: NpcRelationshipRecord = {
        id,
        name: cleanupText(section.title),
        aliases: buildAliases(section.title, section.body),
        role: role || existingRecord?.role || "",
        faction: faction || existingRecord?.faction || "",
        factionId,
        rootFactionId,
        summary: summarizeNpc(section.body, role, faction || assignment?.rootFactionName || ""),
        attitudes: {
          party: partyAttitude || existingRecord?.attitudes.party || "",
          pcs: Object.fromEntries(
            PARTY_NAMES.map((name) => [name, pcAttitudes[name] || existingRecord?.attitudes.pcs[name] || ""]),
          ),
        },
        goals: mergeList(existingRecord?.goals ?? [], goals),
        fears: mergeList(existingRecord?.fears ?? [], fears),
        leverage: mergeList(existingRecord?.leverage ?? [], leverage),
        secrets: mergeList(existingRecord?.secrets ?? [], secrets),
        voice: mergeList(existingRecord?.voice ?? [], publicFace),
        mannerisms: mergeList(existingRecord?.mannerisms ?? [], mannerisms),
        roleplayCard: buildRoleplayCard({
          body: section.body,
          existing: existingRecord?.roleplayCard,
          faction,
          goals,
          mannerisms,
          publicFace,
          secrets,
          latestMention,
        }),
        lastSeen: latestMention?.title ?? existingRecord?.lastSeen ?? "",
        currentLocation: existingRecord?.currentLocation || currentLocation,
        linkedSessions: linked.map((mention) => ({
          path: mention.path,
          title: mention.title,
          section: mention.section,
          preview: mention.preview,
        })),
        sourcePaths: uniqueStrings([
          ...(existingRecord?.sourcePaths ?? []),
          doc.path,
          ...linked.map((mention) => mention.path),
        ]),
        portraitPath: existingRecord?.portraitPath ?? "",
        notes: existingRecord?.notes ?? "",
      };

      records.set(id, generated);
    }
  }

  return [...records.values()];
}

function collectPlanMentions(planDocs: MarkdownDoc[]) {
  const mentions = new Map<string, PlanMention[]>();

  for (const doc of planDocs) {
    const sections = splitSectionsWithHeading(doc.markdown);
    for (const section of sections) {
      const candidates = extractBacktickedNames(section.body);
      const plainCandidates = extractPlainImportantNpcNames(section.body, section.heading);
      for (const name of uniqueStrings([...candidates, ...plainCandidates])) {
        const id = slugify(name);
        if (!id) {
          continue;
        }

        const list = mentions.get(id) ?? [];
        list.push({
          path: doc.path,
          title: doc.title,
          section: section.heading,
          preview: cleanupPreview(section.body),
          sortKey: getPlanSortKey(doc.path),
        });
        mentions.set(id, list);
      }
    }
  }

  for (const [id, list] of mentions) {
    mentions.set(id, list.sort((left, right) => right.sortKey.localeCompare(left.sortKey)));
  }

  return mentions;
}

function splitLevelTwoSections(markdown: string) {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const bodyStart = start + match[0].length;
    const nextStart = index + 1 < matches.length ? (matches[index + 1].index ?? markdown.length) : markdown.length;
    return {
      title: cleanupText(match[1]),
      body: markdown.slice(bodyStart, nextStart).trim(),
    };
  });
}

function splitSectionsWithHeading(markdown: string) {
  const lines = markdown.split("\n");
  const sections: Array<{ heading: string; body: string }> = [];
  let currentHeading = "Document";
  let buffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      sections.push({
        heading: currentHeading,
        body: buffer.join("\n").trim(),
      });
      currentHeading = cleanupText(headingMatch[1]);
      buffer = [];
      continue;
    }

    buffer.push(line);
  }

  sections.push({
    heading: currentHeading,
    body: buffer.join("\n").trim(),
  });

  return sections.filter((section) => section.body);
}

function parseLabeledBullets(body: string) {
  const map = new Map<string, string[]>();
  const lines = body.split("\n");
  let currentKey = "";

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const labeledMatch = line.match(/^- ([^:]+):\s*(.*)$/);
    if (labeledMatch) {
      currentKey = cleanupText(labeledMatch[1]);
      const value = cleanupText(labeledMatch[2]);
      if (value) {
        appendMapValue(map, currentKey, value);
      } else {
        appendMapValue(map, currentKey, "");
      }
      continue;
    }

    const subBulletMatch = line.match(/^\s+- (.+)$/);
    if (subBulletMatch && currentKey) {
      appendMapValue(map, currentKey, cleanupText(subBulletMatch[1]));
    }
  }

  return map;
}

function deriveFaction(body: string) {
  return cleanupText(
    firstMatch(body, /- Faction lens:\s*(.+)/)
      ?? firstMatch(body, /within House `?([^`]+)`?/)
      ?? firstMatch(body, /inside the ([^.]+ court)/i)
      ?? "",
  );
}

function derivePartyAttitude(body: string) {
  return cleanupText(
    firstMatch(body, /- Party view:\s*(.+)/)
      ?? firstMatch(body, /- Relationship to the party:\s*(.+)/)
      ?? firstMatch(body, /trusted ally of the party/i)?.replace(/^- /, "")
      ?? firstMatch(body, /\b(hates the group|trusted ally of the party|sees him as a trusted ally)\b/i)
      ?? "",
  );
}

function derivePcAttitude(body: string, pcName: string) {
  const mentions = body.split("\n").filter((line) => new RegExp(`\\b${escapeRegExp(pcName)}\\b`, "i").test(line));
  return cleanupText(mentions.join(" | "));
}

function deriveCurrentLocation(body: string, latestMention?: PlanMention) {
  const direct = cleanupText(
    firstMatch(body, /- Current location:\s*(.+)/)
      ?? firstMatch(body, /\bfrom `?([^`]+)`?, the/i),
  );

  if (direct) {
    return direct;
  }

  if (!latestMention) {
    return "";
  }

  return latestMention.section === "Important NPCs" ? latestMention.title : "";
}

function buildAliases(title: string, body: string) {
  return uniqueStrings([
    cleanupText(title.replace(/\b(Prince|Princess|King|Queen|Lord|Lady|Ser|Captain|General|Matriarch|Warden|Master|Magistrate|Advisor|Sir)\b/gi, "").trim()),
    ...extractBacktickedNames(body).filter((name) => slugify(name) === slugify(title)),
  ]).filter((alias) => alias && alias !== cleanupText(title));
}

function summarizeNpc(body: string, role: string, faction: string) {
  const snippets = uniqueStrings([
    role,
    firstMatch(body, /- Public face:\s*(.+)/),
    firstMatch(body, /- Core motive:\s*(.+)/),
    faction,
  ]).filter(Boolean);

  return cleanupText(snippets.slice(0, 3).join(" | "));
}

function buildRoleplayCard(input: {
  body: string;
  existing?: NpcRoleplayCard;
  faction: string;
  goals: string[];
  mannerisms: string[];
  publicFace: string[];
  secrets: string[];
  latestMention?: PlanMention;
}) {
  const tone = [input.faction, ...input.publicFace, ...input.mannerisms].join(" ");
  const wantsNow = input.existing?.wantsNow
    || input.latestMention?.preview
    || input.goals[0]
    || "";
  const wontSayFreely = input.existing?.wontSayFreely
    || input.secrets[0]
    || "";

  return {
    wantsNow: cleanupText(wantsNow),
    wontSayFreely: cleanupText(wontSayFreely),
    pressure: input.existing?.pressure || inferReaction(tone, "pressure"),
    kindness: input.existing?.kindness || inferReaction(tone, "kindness"),
    threats: input.existing?.threats || inferReaction(tone, "threats"),
    bribes: input.existing?.bribes || inferReaction(tone, "bribes"),
  };
}

function inferReaction(source: string, type: "pressure" | "kindness" | "threats" | "bribes") {
  const text = source.toLowerCase();

  if (type === "pressure") {
    if (text.match(/\b(duty|honor|formal|controlled|disciplined)\b/)) {
      return "Tightens up, doubles down on principle, and gives away very little.";
    }
    if (text.match(/\b(anxious|fear|survive|wary|watchful)\b/)) {
      return "Looks for exits, bargains for safety, and shows stress in small tells.";
    }
    return "Pushes back, narrows their options, and reveals stress through clipped responses.";
  }

  if (type === "kindness") {
    if (text.match(/\b(compassionate|good|soft|protect)\b/)) {
      return "Softens quickly if the kindness feels sincere and not performative.";
    }
    return "Registers it carefully, then tests whether it is genuine before opening up.";
  }

  if (type === "threats") {
    if (text.match(/\b(proud|martial|charismatic|narciss|dominant)\b/)) {
      return "Meets threats with defiance and often escalates rather than yielding.";
    }
    return "Gets guarded fast and starts thinking in terms of retaliation, escape, or leverage.";
  }

  if (text.match(/\b(trade|debt|favor|patronage|money|contracts)\b/)) {
    return "Listens closely if the offer increases security, status, or future usefulness.";
  }
  return "Considers bribes pragmatically, especially if they solve an immediate pressure point.";
}

function valuesMatchingKeys(map: Map<string, string[]>, keys: string[]) {
  return keys.flatMap((key) => map.get(key) ?? []).map(cleanupText).filter(Boolean);
}

function extractPotentialLeverage(body: string) {
  return body
    .split("\n")
    .map(cleanupText)
    .filter((line) => /\b(soft spot|pressure|caught in|tied to|bond|family|owes|survive|depends on|missing)\b/i.test(line));
}

function extractInlineStatements(body: string, pattern: RegExp) {
  return body
    .split("\n")
    .map(cleanupText)
    .filter((line) => pattern.test(line));
}

function extractBacktickedNames(body: string) {
  return [...body.matchAll(/`([^`]+)`/g)].map((match) => cleanupText(match[1]));
}

function extractPlainImportantNpcNames(body: string, heading: string) {
  if (!/Important NPCs|Session-By-Session Recaps|Strong Start|Scenes/i.test(heading)) {
    return [];
  }

  return body
    .split("\n")
    .map((line) => line.match(/^- ([A-Z][A-Za-z' -]+)$/)?.[1] ?? "")
    .map(cleanupText)
    .filter(Boolean);
}

function cleanupPreview(body: string) {
  return cleanupText(
    body
      .split("\n")
      .map(cleanupText)
      .find((line) => line && !line.startsWith("##"))
      ?? "",
  ).slice(0, 220);
}

function mergeList(existing: string[], generated: string[]) {
  return uniqueStrings([...(existing ?? []), ...(generated ?? [])]);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => cleanupText(value ?? "")).filter(Boolean))];
}

function appendMapValue(map: Map<string, string[]>, key: string, value: string) {
  const current = map.get(key) ?? [];
  current.push(value);
  map.set(key, current);
}

function firstValue(map: Map<string, string[]>, keys: string[]) {
  for (const key of keys) {
    const value = map.get(key)?.find(Boolean);
    if (value) {
      return cleanupText(value);
    }
  }

  return "";
}

function firstMatch(input: string, pattern: RegExp) {
  const match = input.match(pattern);
  return match?.[1] ?? "";
}

function getTitle(markdown: string, relativePath: string) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
    ?? path.basename(relativePath, ".md").replace(/[-_]/g, " ");
}

function getPlanSortKey(relativePath: string) {
  const datePrefix = relativePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
  return `${datePrefix}:${relativePath}`;
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function cleanupText(value: string) {
  return value
    .replace(FENCE, "")
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeNpcId(npcId: string) {
  const safe = slugify(npcId);
  if (!safe) {
    throw new Error("NPC id is required.");
  }

  return safe;
}

function sanitizePortraitFileName(fileName: string) {
  const base = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base || !base.endsWith(".png")) {
    throw new Error("Invalid portrait file.");
  }

  return base;
}

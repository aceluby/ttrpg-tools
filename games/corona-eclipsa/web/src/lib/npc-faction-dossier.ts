const FENCE = /[`*_]/g;

export const ROOT_FACTION_IDS = ["everthrone", "cerres", "vraegari", "vaelport", "zephandor"] as const;

export type RootFactionId = (typeof ROOT_FACTION_IDS)[number];

export type DossierFactionTier = "major" | "faction" | "group" | "family";
export type DossierFactionLens = "good" | "bad" | "ugly" | "mixed" | "shifting" | "unknown";

export type DossierFactionNode = {
  id: string;
  lens: DossierFactionLens;
  name: string;
  notes: string;
  npcNames: string[];
  parentId: string | null;
  rootId: RootFactionId;
  summary: string;
  tier: DossierFactionTier;
};

export type DossierNpcFactionAssignment = {
  factionId: string;
  factionName: string;
  rootFactionId: RootFactionId;
  rootFactionName: string;
};

type DossierSection = {
  body: string;
  title: string;
};

type Context = {
  currentFactionId: string;
  currentRootId: RootFactionId;
};

const ROOT_FACTION_NAMES: Record<RootFactionId, string> = {
  everthrone: "Everthrone",
  cerres: "Cerres",
  vraegari: "Vraegari",
  vaelport: "Vaelport",
  zephandor: "Zephandor",
};

const DIRECT_FACTION_TITLES = new Set([
  "Red Reavers",
  "The Corterie",
  "Piebalds",
  "Harvest Festival Troupes",
  "Cerres Leadership",
  "Vaelport",
  "The Tattooed",
  "The Ashmarked",
  "The Iron Ink",
  "The Saltbound",
]);

const IGNORED_SECTION_TITLES = new Set([
  "Liveships",
  "Serpents",
]);

export function buildDossierFactionModel(markdown: string) {
  const sections = splitLevelTwoSections(markdown);
  const nodes = new Map<string, DossierFactionNode>();
  const assignments = new Map<string, DossierNpcFactionAssignment>();
  let context: Context = {
    currentRootId: "everthrone",
    currentFactionId: "everthrone",
  };

  for (const rootId of ROOT_FACTION_IDS) {
    nodes.set(rootId, {
      id: rootId,
      name: ROOT_FACTION_NAMES[rootId],
      lens: rootId === "cerres" || rootId === "vraegari" ? "bad" : "mixed",
      notes: "",
      npcNames: [],
      parentId: null,
      rootId,
      summary: "",
      tier: "major",
    });
  }

  for (const section of sections) {
    const role = getPrimaryRole(section.body).toLowerCase();
    if (IGNORED_SECTION_TITLES.has(section.title) || role.includes("world element")) {
      continue;
    }

    const inferredRootId = inferRootFactionId(section.title, section.body, context.currentRootId);
    context = {
      ...context,
      currentRootId: inferredRootId,
    };

    if (isFactionSection(section.title, section.body)) {
      const nextFactionId = upsertFactionNode(nodes, section, context);
      context = {
        currentRootId: inferredRootId,
        currentFactionId: nextFactionId,
      };
      continue;
    }

    if (!looksLikeNpc(section.title, section.body)) {
      continue;
    }

    const npcId = slugify(section.title);
    const factionId = ensureNpcFaction(nodes, section, context);
    const factionNode = nodes.get(factionId);
    if (!factionNode) {
      continue;
    }

    factionNode.npcNames = uniqueStrings([...factionNode.npcNames, cleanupText(section.title)]);
    assignments.set(npcId, {
      factionId: factionNode.id,
      factionName: factionNode.name,
      rootFactionId: factionNode.rootId,
      rootFactionName: ROOT_FACTION_NAMES[factionNode.rootId],
    });
  }

  return {
    factions: [...nodes.values()].sort((left, right) => {
      const leftRoot = rootSort(left.id);
      const rightRoot = rootSort(right.id);
      return leftRoot - rightRoot || left.name.localeCompare(right.name);
    }),
    npcAssignments: assignments,
  };
}

function upsertFactionNode(
  nodes: Map<string, DossierFactionNode>,
  section: DossierSection,
  context: Context,
) {
  const rootId = context.currentRootId;
  const title = cleanupText(section.title);
  if (slugify(title) === rootId || title === ROOT_FACTION_NAMES[rootId]) {
    const rootNode = nodes.get(rootId);
    if (rootNode) {
      rootNode.summary = rootNode.summary || summarizeSection(section.body);
      rootNode.notes = mergeText(rootNode.notes, summarizeNotes(section.body));
      rootNode.lens = resolveLens(rootNode.lens, parseLens(section.body));
    }
    return rootId;
  }

  const id = slugify(title);
  const existing = nodes.get(id);
  const parentId = determineParentFactionId(title, rootId, context.currentFactionId, nodes);
  const next: DossierFactionNode = {
    id,
    name: title,
    lens: resolveLens(existing?.lens ?? "unknown", parseLens(section.body)),
    notes: mergeText(existing?.notes ?? "", summarizeNotes(section.body)),
    npcNames: existing?.npcNames ?? [],
    parentId,
    rootId,
    summary: existing?.summary || summarizeSection(section.body),
    tier: inferFactionTier(title, parentId, rootId),
  };
  nodes.set(id, next);
  return id;
}

function ensureNpcFaction(
  nodes: Map<string, DossierFactionNode>,
  section: DossierSection,
  context: Context,
) {
  const explicitFactionName = extractFactionName(section.body);
  if (explicitFactionName) {
    const explicitFactionId = ensureFactionByName(nodes, explicitFactionName, context.currentRootId, context.currentFactionId);
    if (explicitFactionId) {
      return explicitFactionId;
    }
  }

  const namedTargets = extractBacktickedNames(section.body)
    .map(cleanupText)
    .filter((name) => isLikelyFactionReference(name, nodes));
  for (const name of namedTargets) {
    const existingId = findFactionIdByName(nodes, name);
    if (existingId) {
      return existingId;
    }
  }

  return context.currentFactionId || context.currentRootId;
}

function ensureFactionByName(
  nodes: Map<string, DossierFactionNode>,
  name: string,
  rootId: RootFactionId,
  currentFactionId: string,
) {
  const cleanName = cleanupText(name);
  const existingId = findFactionIdByName(nodes, cleanName);
  if (existingId) {
    return existingId;
  }

  const id = slugify(cleanName);
  const parentId = determineImplicitFactionParent(cleanName, rootId, currentFactionId, nodes);
  nodes.set(id, {
    id,
    name: cleanName,
    lens: "unknown",
    notes: "",
    npcNames: [],
    parentId,
    rootId,
    summary: "",
    tier: inferFactionTier(cleanName, parentId, rootId),
  });
  return id;
}

function determineParentFactionId(
  title: string,
  rootId: RootFactionId,
  currentFactionId: string,
  nodes: Map<string, DossierFactionNode>,
) {
  if (rootId === "vraegari" && /^Clan /i.test(title)) {
    return nodes.has("red-reavers") ? "red-reavers" : rootId;
  }

  if (rootId === "vaelport" && /^House /i.test(title)) {
    const current = nodes.get(currentFactionId);
    if (current && current.rootId === rootId && isRegionalPortFaction(current.name)) {
      return current.id;
    }
    return rootId;
  }

  if (rootId === "everthrone" && /^House /i.test(title)) {
    return rootId;
  }

  if (rootId === "zephandor" && /^House /i.test(title)) {
    return rootId;
  }

  if (DIRECT_FACTION_TITLES.has(title)) {
    return rootId;
  }

  return rootId;
}

function determineImplicitFactionParent(
  name: string,
  rootId: RootFactionId,
  currentFactionId: string,
  nodes: Map<string, DossierFactionNode>,
) {
  if (cleanMatches(name, "the magicians")) {
    return rootId;
  }

  if (cleanMatches(name, "the king's assassins")) {
    return rootId;
  }

  if (cleanMatches(name, "house marinel")) return "vaelport";
  if (cleanMatches(name, "house vaylen")) return "vaelport";
  if (cleanMatches(name, "house rhalmere")) return "vaelport";
  if (cleanMatches(name, "house kharvos")) return "merovyx";
  if (cleanMatches(name, "house thalrix")) return "merovyx";
  if (cleanMatches(name, "house vescaro")) return "merovyx";

  const current = nodes.get(currentFactionId);
  if (current && current.rootId === rootId) {
    return current.id;
  }

  return rootId;
}

function inferFactionTier(name: string, parentId: string | null, rootId: RootFactionId): DossierFactionTier {
  if (parentId === null || slugify(name) === rootId) {
    return "major";
  }
  if (/^House |^Clan /i.test(name)) {
    return "family";
  }
  if (name === "Red Reavers" || name === "Vaelport") {
    return "faction";
  }
  return "group";
}

function isRegionalPortFaction(name: string) {
  return ["Vaelessa", "Oryndral", "Merovyx"].some((candidate) => cleanMatches(name, candidate));
}

function parseLens(body: string): DossierFactionLens {
  const text = body.toLowerCase();
  if (text.includes("internally split") || text.includes("split ")) return "mixed";
  if (text.includes("`good`") || text.includes("good within")) return "good";
  if (text.includes("`bad`") || text.includes("bad within")) return "bad";
  if (text.includes("`ugly`") || text.includes("ugly within")) return "ugly";
  if (text.includes("shifting")) return "shifting";
  if (text.includes("mixed")) return "mixed";
  return "unknown";
}

function resolveLens(left: DossierFactionLens, right: DossierFactionLens): DossierFactionLens {
  if (left !== "unknown") {
    return left;
  }
  return right;
}

function summarizeSection(body: string) {
  return firstNonEmpty([
    firstValue(parseLabeledBullets(body), ["Role", "Political identity", "Court identity", "Port identity", "Public understanding", "Current objective"]),
    cleanupParagraph(body),
  ]);
}

function summarizeNotes(body: string) {
  return uniqueStrings([
    ...valuesMatchingKeys(parseLabeledBullets(body), [
      "Political identity",
      "Court identity",
      "Port identity",
      "Major internal blocs",
      "Current objective",
      "Internal note",
      "Known example",
      "Open details",
    ]),
    cleanupParagraph(body),
  ]).join(" | ");
}

function inferRootFactionId(title: string, body: string, currentRootId: RootFactionId): RootFactionId {
  const haystack = `${title} ${body}`.toLowerCase();
  if (haystack.match(/\b(cerres|inkveil|piebald)\b/)) return "cerres";
  if (haystack.match(/\b(vraegari|red reavers|skallvyr|ormskar|bloodwake|redmaw|ironhowl|frostvein|vargrim|brynja|eirik|astrid)\b/)) return "vraegari";
  if (haystack.match(/\b(zephandor|aiuvarin|auvareth|caerwyn|draevor|morvain|tarrowen|selverin|therion|lirael|kaelith)\b/)) return "zephandor";
  if (haystack.match(/\b(vaelport|marinel|vaylen|vaelessa|oryndral|rhalmere|merovyx|kharvos|thalrix|vescaro|tattooed|ashmarked|iron ink|saltbound)\b/)) return "vaelport";
  if (haystack.match(/\b(everthrone|vaelor|valemere|aerlyn|vossaryn|marovant|serrat|thorne|rhaegar|dorian|magicians|corterie|king's assassins)\b/)) return "everthrone";
  return currentRootId;
}

function isFactionSection(title: string, body: string) {
  if (ROOT_FACTION_IDS.includes(slugify(title) as RootFactionId)) {
    return true;
  }

  if (DIRECT_FACTION_TITLES.has(cleanupText(title))) {
    return true;
  }

  if (/^(House|Clan)\s+/i.test(title)) {
    return true;
  }

  const role = getPrimaryRole(body).toLowerCase();
  if (!role) {
    return false;
  }

  if (role.includes("world element")) {
    return false;
  }

  if (role.match(/\b(trading house|raiding threat|group|city|leadership|troupes|court bloc)\b/)) {
    return true;
  }

  return false;
}

export function looksLikeNpc(title: string, body: string) {
  if (isFactionSection(title, body)) {
    return false;
  }

  const role = getPrimaryRole(body).toLowerCase();
  if (!role) {
    return false;
  }

  if (role.includes("world element")) {
    return false;
  }

  if (role.match(/\b(prince|princess|king|queen|lord|lady|ser|captain|matriarch|magistrate|general|advisor|wizard|assassin|member|operative|ally|champion|heir|voice|figure|head|mother|pirate king|liveship)\b/)) {
    return true;
  }

  return body.includes("- Public face")
    || body.includes("- Personality")
    || body.includes("- Physical or behavioral trait")
    || body.includes("- Core motive")
    || body.includes("- Core drive");
}

function extractFactionName(body: string) {
  const factionLens = firstValue(parseLabeledBullets(body), ["Faction lens"]);
  return cleanupText(
    firstMatch(factionLens, /within House `?([^`]+)`?/i)
      || firstMatch(factionLens, /within Clan `?([^`]+)`?/i)
      || firstMatch(factionLens, /within the ([^\n.]+)/i)
      || firstMatch(factionLens, /within `?([^`]+)`?/i)
      || "",
  );
}

function isLikelyFactionReference(name: string, nodes: Map<string, DossierFactionNode>) {
  if (findFactionIdByName(nodes, name)) {
    return true;
  }

  return /^(House|Clan)\s+/i.test(name)
    || ["Everthrone", "Cerres", "Vraegari", "Vaelport", "Zephandor", "The Corterie"].some((candidate) => cleanMatches(name, candidate));
}

function findFactionIdByName(nodes: Map<string, DossierFactionNode>, name: string) {
  const cleanName = cleanupText(name);
  for (const node of nodes.values()) {
    if (
      cleanMatches(node.name, cleanName)
      || cleanMatches(node.name, `House ${cleanName}`)
      || cleanMatches(node.name, `Clan ${cleanName}`)
      || node.id === slugify(cleanName)
      || node.id === slugify(`House ${cleanName}`)
      || node.id === slugify(`Clan ${cleanName}`)
    ) {
      return node.id;
    }
  }
  return "";
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
      appendMapValue(map, currentKey, value);
      continue;
    }

    const subBulletMatch = line.match(/^\s+- (.+)$/);
    if (subBulletMatch && currentKey) {
      appendMapValue(map, currentKey, cleanupText(subBulletMatch[1]));
    }
  }

  return map;
}

function getPrimaryRole(body: string) {
  return firstValue(parseLabeledBullets(body), ["Role"]);
}

function valuesMatchingKeys(map: Map<string, string[]>, keys: string[]) {
  return keys.flatMap((key) => map.get(key) ?? []).map(cleanupText).filter(Boolean);
}

function extractBacktickedNames(body: string) {
  return [...body.matchAll(/`([^`]+)`/g)].map((match) => cleanupText(match[1]));
}

function cleanupParagraph(body: string) {
  const line = body
    .split("\n")
    .find((entry) => {
      const trimmed = entry.trim();
      return trimmed
        && !trimmed.startsWith("-")
        && !trimmed.startsWith("###");
    })
    ?? "";
  return cleanupText(line);
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

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => cleanupText(value ?? "")).filter(Boolean))];
}

function mergeText(left: string, right: string) {
  return uniqueStrings([left, right]).join(" | ");
}

function firstNonEmpty(values: Array<string | undefined | null>) {
  return values.map((value) => cleanupText(value ?? "")).find(Boolean) ?? "";
}

function rootSort(id: string) {
  const index = ROOT_FACTION_IDS.indexOf(id as RootFactionId);
  return index >= 0 ? index : ROOT_FACTION_IDS.length;
}

function cleanMatches(left: string, right: string) {
  return cleanupText(left).toLowerCase() === cleanupText(right).toLowerCase();
}

import fs from "node:fs/promises";
import path from "node:path";

export type EncounterPresetRole = "character" | "npc" | "enemy" | "hazard";

export type EncounterPreset = {
  id: string;
  name: string;
  role: EncounterPresetRole;
  sourcePath: string;
  sourceTitle: string;
  sourceBody: string | null;
  level: number | null;
  maxHp: number | null;
  ac: number | null;
  initiativeMod: number | null;
  effects: string[];
  notes: string;
  combatProfile: EncounterCombatProfile | null;
};

export type EncounterCombatProfile = {
  summary: string[];
  saves: string[];
  attacks: EncounterProfileEntry[];
  skills: EncounterProfileEntry[];
  spells: EncounterProfileEntry[];
  specials: EncounterProfileEntry[];
  resistances: string[];
  sourcePath: string;
};

export type EncounterProfileEntry = {
  label: string;
  detail: string;
};

export type EncounterPresetGroup = {
  id: string;
  name: string;
  memberIds: string[];
};

const GAME_ROOT = path.resolve(process.cwd(), "..");
const PLAYER_JSON_ROOT = path.join(GAME_ROOT, "player-json");
const MD_EXT = ".md";
const JSON_EXT = ".json";
const PARTY_NAMES = ["Marcel", "Dax", "Jin", "Harlan"];
const PARTY_JSON_NAME_MAP: Record<string, string> = {
  marcel: "Marcel",
  dax: "Dax",
  jin: "Jin",
  harlan: "Harlan",
};

export async function listEncounterPresets(): Promise<{
  presets: EncounterPreset[];
  groups: EncounterPresetGroup[];
}> {
  const files = await walkMarkdown(GAME_ROOT);
  const markdownFiles = await Promise.all(
    files.map(async (filePath) => {
      const relativePath = toPosix(path.relative(GAME_ROOT, filePath));
      const markdown = await fs.readFile(filePath, "utf8");
      return {
        relativePath,
        sourceTitle: getTitle(markdown, relativePath),
        markdown,
      };
    }),
  );

  const statPresets = markdownFiles.flatMap(({ markdown, relativePath, sourceTitle }) =>
    extractStatBlockPresets(markdown, relativePath, sourceTitle),
  );

  const partyPresets = markdownFiles.flatMap(({ markdown, relativePath, sourceTitle }) =>
    extractPartyPresets(markdown, relativePath, sourceTitle),
  );

  const playerJsonPresets = await loadPlayerJsonPresets();

  const merged = new Map<string, EncounterPreset>();
  for (const preset of [...statPresets, ...partyPresets, ...playerJsonPresets]) {
    const key = normalizePartyKey(preset.name);
    const existing = merged.get(key);
    merged.set(key, existing ? mergePreset(existing, preset) : preset);
  }

  const presets = [...merged.values()].sort((left, right) => {
    return roleOrder(left.role) - roleOrder(right.role)
      || left.name.localeCompare(right.name);
  });

  const partyMemberIds = PARTY_NAMES
    .map((name) => presets.find((preset) => preset.role === "character" && preset.name === name)?.id)
    .filter((id): id is string => Boolean(id));

  const groups: EncounterPresetGroup[] = partyMemberIds.length > 0
    ? [
      {
        id: "group-corona-eclipsa",
        name: "Entire Party",
        memberIds: partyMemberIds,
      },
    ]
    : [];

  return {
    presets,
    groups,
  };
}

async function walkMarkdown(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "web") {
          return [];
        }

        return walkMarkdown(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(MD_EXT)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

async function walkJson(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkJson(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(JSON_EXT)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function extractStatBlockPresets(markdown: string, sourcePath: string, sourceTitle: string) {
  const sections = splitSections(markdown);
  const presets: EncounterPreset[] = [];

  for (const section of sections) {
    if (!section.body.match(/(?:^|\n)- AC \d+/m) || !section.body.match(/(?:^|\n)- HP \d+/m)) {
      continue;
    }

    const maxHp = matchInteger(section.body, /(?:^|\n)- HP (\d+)/m);
    const ac = matchInteger(section.body, /(?:^|\n)- AC (\d+)/m);
    const level = matchSignedInteger(section.body, /(?:^|\n)- Level ([+-]?\d+)/m)
      ?? matchSignedInteger(section.title, /\bLevel\s+([+-]?\d+)\b/i);
    const perception = matchSignedInteger(
      section.body,
      /(?:^|\n)- Perception `?([+-]?\d+)`?/m,
    );

    presets.push({
      id: `preset-${slugify(sourcePath)}-${slugify(section.title)}`,
      name: cleanupName(section.title),
      role: inferRole(section.title, sourcePath),
      sourcePath,
      sourceTitle,
      sourceBody: section.body,
      level,
      maxHp,
      ac,
      initiativeMod: perception,
      effects: [],
      notes: buildNotes(section.body),
      combatProfile: null,
    });
  }

  return presets;
}

function extractPartyPresets(markdown: string, sourcePath: string, sourceTitle: string) {
  const presets: EncounterPreset[] = [];

  for (const name of PARTY_NAMES) {
    const headingMatch = markdown.match(new RegExp(`^##\\s+${escapeRegExp(name)}\\s*$`, "m"));
    const bulletMatch = markdown.match(new RegExp(`^-\\s+\`${escapeRegExp(name)}\`\\s*$`, "m"));

    if (!headingMatch && !bulletMatch) {
      continue;
    }

    const section = headingMatch ? extractSectionBody(markdown, name) : "";
    const ac = matchInteger(section, /(?:^|\n)- AC (\d+)/m);
    const hp = matchInteger(section, /(?:^|\n)- HP (\d+)/m);
    const level = matchInteger(section, /(?:^|\n)- Level (\d+)/m);
    const perception = matchSignedInteger(
      section,
      /(?:^|\n)- Perception `?([+-]?\d+)`?/m,
    );

    presets.push({
      id: `preset-party-${slugify(name)}`,
      name,
      role: "character",
      sourcePath,
      sourceTitle,
      sourceBody: null,
      level,
      maxHp: hp,
      ac,
      initiativeMod: perception,
      effects: [],
      notes: buildPartyNotes(name, section),
      combatProfile: null,
    });
  }

  return presets;
}

function splitSections(markdown: string) {
  const matches = [...markdown.matchAll(/^###\s+(.+)$/gm)];
  return matches.map((match) => {
    const start = match.index ?? 0;
    const bodyStart = start + match[0].length;
    const rest = markdown.slice(bodyStart);
    const nextHeading = rest.match(/^##\s+|^###\s+/m);
    const nextStart = nextHeading?.index !== undefined ? bodyStart + nextHeading.index : markdown.length;
    const body = markdown.slice(bodyStart, nextStart).trim();

    return {
      title: match[1].trim(),
      body,
    };
  });
}

function extractSectionBody(markdown: string, title: string) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m");
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch || headingMatch.index === undefined) {
    return "";
  }

  const bodyStart = headingMatch.index + headingMatch[0].length;
  const rest = markdown.slice(bodyStart);
  const nextHeading = rest.match(/^##\s+/m);
  const nextIndex = nextHeading?.index ?? rest.length;
  return rest.slice(0, nextIndex).trim();
}

function buildPartyNotes(name: string, section: string) {
  const combatHints = compactLines(section)
    .filter((line) => isCombatUsefulLine(line, name))
    .slice(0, 5);

  if (combatHints.length > 0) {
    return combatHints.join(" | ");
  }

  return "";
}

async function loadPlayerJsonPresets(): Promise<EncounterPreset[]> {
  try {
    const files = await walkJson(PLAYER_JSON_ROOT);

    const presets = await Promise.all(
      files.map(async (filePath) => {
        const relativePath = toPosix(path.relative(GAME_ROOT, filePath));
        const raw = await fs.readFile(filePath, "utf8");
        return buildPlayerJsonPreset(raw, relativePath, path.basename(filePath, JSON_EXT));
      }),
    );

    return presets.filter((preset): preset is EncounterPreset => Boolean(preset));
  } catch {
    return [];
  }
}

function buildPlayerJsonPreset(raw: string, sourcePath: string, fileStem: string): EncounterPreset | null {
  try {
    const parsed = JSON.parse(raw) as {
      build?: Record<string, unknown>;
    };
    const build = parsed.build;
    if (!build) {
      return null;
    }

    const shortName = PARTY_JSON_NAME_MAP[fileStem.toLowerCase()] ?? toDisplayName(fileStem);
    const level = readNumber(build.level);
    const className = readString(build.class);
    const ancestry = readString(build.ancestry);
    const heritage = readString(build.heritage);
    const ac = readNumber((build.acTotal as Record<string, unknown> | undefined)?.acTotal);
    const maxHp = deriveMaxHp(build);
    const initiativeMod = derivePerception(build);
    const profile = buildCombatProfile(build, sourcePath);
    const notes = buildCharacterNotes(profile);

    return {
      id: `preset-player-json-${slugify(shortName)}`,
      name: shortName,
      role: "character",
      sourcePath,
      sourceTitle: [shortName, level ? `Level ${level}` : "", className].filter(Boolean).join(" "),
      sourceBody: null,
      level,
      maxHp,
      ac,
      initiativeMod,
      effects: [],
      notes,
      combatProfile: {
        ...profile,
        summary: [
          [level ? `Level ${level}` : "", className].filter(Boolean).join(" "),
          [heritage, ancestry].filter(Boolean).join(" "),
          profile.summary[0] ?? "",
          profile.summary[1] ?? "",
        ].filter(Boolean),
      },
    };
  } catch {
    return null;
  }
}

function buildCharacterNotes(profile: EncounterCombatProfile) {
  const reminderTraits = profile.specials
    .map((entry) => entry.label)
    .filter((label) => isReminderTrait(label))
    .slice(0, 4);

  return [
    profile.resistances.length > 0 ? `Resistances: ${profile.resistances.join(", ")}` : "",
    reminderTraits.length > 0 ? `Combat reminders: ${reminderTraits.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildCombatProfile(build: Record<string, unknown>, sourcePath: string): EncounterCombatProfile {
  const speed = deriveSpeed(build);
  const perception = derivePerception(build);
  const saves = deriveSaves(build);
  const attacks = deriveAttacks(build);
  const skills = deriveSkills(build);
  const spells = deriveSpells(build);
  const specials = readStringArray(build.specials).slice(0, 8).map((special) => ({
    label: special,
    detail: special,
  }));
  const resistances = readStringArray(build.resistances);

  return {
    summary: [
      speed ? `Speed ${speed}` : "",
      Number.isFinite(perception) ? `Perception +${perception}` : "",
    ].filter(Boolean),
    saves,
    attacks,
    skills,
    spells,
    specials,
    resistances,
    sourcePath,
  };
}

function buildNotes(body: string) {
  const summary = compactLines(body)
    .filter((line) => isCombatUsefulLine(line))
    .slice(0, 6)
    .join(" | ");

  return summary || "";
}
function compactLines(body: string) {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);
}

function mergePreset(existing: EncounterPreset, incoming: EncounterPreset): EncounterPreset {
  const notes = [existing.notes, incoming.notes]
    .filter(Boolean)
    .join(" | ")
    .split(" | ")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(" | ");

  const preferMarkdownSource = existing.sourcePath.endsWith(MD_EXT) ? existing : incoming.sourcePath.endsWith(MD_EXT) ? incoming : incoming;

  return {
    ...preferMarkdownSource,
    id: existing.id,
    name: PARTY_NAMES.find((name) => normalizePartyKey(name) === normalizePartyKey(existing.name)) ?? existing.name,
    role: existing.role === "character" || incoming.role === "character" ? "character" : existing.role,
    sourceBody: existing.sourceBody ?? incoming.sourceBody,
    level: incoming.level ?? existing.level,
    maxHp: incoming.maxHp ?? existing.maxHp,
    ac: incoming.ac ?? existing.ac,
    initiativeMod: incoming.initiativeMod ?? existing.initiativeMod,
    effects: existing.effects.length > 0 ? existing.effects : incoming.effects,
    notes,
    combatProfile: incoming.combatProfile ?? existing.combatProfile,
  };
}

function isCombatUsefulLine(line: string, preferredName?: string) {
  const lower = line.toLowerCase();

  if (
    lower.startsWith("ac ")
    || lower.startsWith("hp ")
    || lower.startsWith("perception ")
    || lower.startsWith("speed ")
    || lower.startsWith("fort ")
    || lower.startsWith("ref ")
    || lower.startsWith("will ")
    || lower.startsWith("str ")
    || lower.startsWith("dex ")
    || lower.startsWith("con ")
    || lower.startsWith("int ")
    || lower.startsWith("wis ")
    || lower.startsWith("cha ")
    || lower.startsWith("level ")
    || lower.startsWith("languages ")
    || lower.startsWith("skills ")
    || lower.startsWith("items ")
  ) {
    return false;
  }

  return lower.includes("resist")
    || lower.includes("immune")
    || lower.includes("weakness")
    || lower.includes("vulnerab")
    || lower.includes("attack")
    || lower.includes("strike")
    || lower.includes("damage")
    || lower.includes("bite")
    || lower.includes("claw")
    || lower.includes("jaws")
    || lower.includes("fang")
    || lower.includes("knockdown")
    || lower.includes("two-action")
    || lower.includes("[two-actions]")
    || lower.includes("stride")
    || lower.includes("drag down")
    || lower.includes("guardian instinct")
    || lower.includes("reaction")
    || lower.includes("passive")
    || lower.includes("trait")
    || lower.includes("signature")
    || lower.includes("feature")
    || lower.includes("burden")
    || lower.includes("disabil")
    || lower.includes("blind")
    || lower.includes("deaf")
    || lower.includes("clumsy")
    || lower.includes("frightened")
    || lower.includes("off-guard")
    || lower.includes("companion")
    || lower.includes("beast magic")
    || lower.includes("dragonblood")
    || lower.includes("support")
    || lower.includes("frontline")
    || lower.includes("ranged")
    || lower.includes("stealth")
    || lower.includes("spellstrike")
    || lower.includes("spell")
    || lower.includes("escape")
    || (preferredName ? lower.includes(preferredName.toLowerCase()) : false);
}

function isReminderTrait(label: string) {
  const lower = label.toLowerCase();

  if (
    lower.includes("reactive strike")
    || lower.includes("shield")
    || lower.includes("sneak attack")
    || lower.includes("hunt prey")
    || lower.includes("flurry of blows")
    || lower.includes("counter performance")
    || lower.includes("hymn of healing")
    || lower.includes("battle medicine")
    || lower.includes("dragonblood")
    || lower.includes("mirage")
    || lower.includes("thief racket")
  ) {
    return true;
  }

  return false;
}

function getTitle(markdown: string, relativePath: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) {
    return heading;
  }

  return path.basename(relativePath, MD_EXT).replace(/[-_]/g, " ");
}

function normalizePartyKey(value: string) {
  return value.toLowerCase().replace(/\s+\d+$/, "").trim();
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function roleOrder(role: EncounterPresetRole) {
  if (role === "character") {
    return 0;
  }

  if (role === "npc") {
    return 1;
  }

  if (role === "enemy") {
    return 2;
  }

  return 3;
}

function inferRole(name: string, sourcePath: string): EncounterPresetRole {
  if (PARTY_NAMES.includes(name)) {
    return "character";
  }

  const lowerPath = sourcePath.toLowerCase();
  const lowerName = name.toLowerCase();
  if (
    lowerPath.includes("hazard")
    || lowerName.includes("hazard")
    || lowerName.includes("trap")
    || lowerName.includes("haunt")
  ) {
    return "hazard";
  }

  if (lowerPath.includes("continuity/") || lowerName.includes("prince") || lowerName.includes("princess")) {
    return "npc";
  }

  return "enemy";
}

function cleanupName(value: string) {
  return value.replace(/[`*]/g, "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function matchInteger(body: string, pattern: RegExp) {
  const match = body.match(pattern);
  return match ? Number.parseInt(match[1], 10) : null;
}

function matchSignedInteger(body: string, pattern: RegExp) {
  const match = body.match(pattern);
  return match ? Number.parseInt(match[1], 10) : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toDisplayName(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((entry) => {
      if (typeof entry === "string") {
        return [entry.trim()];
      }

      return [];
    })
    .filter(Boolean);
}

function readAbilityModifier(build: Record<string, unknown>, ability: "str" | "dex" | "con" | "int" | "wis" | "cha") {
  const abilities = build.abilities as { [key: string]: unknown } | undefined;
  const score = readNumber(abilities?.[ability]);
  if (score === null) {
    return 0;
  }

  return Math.floor((score - 10) / 2);
}

function readItemBonus(
  build: Record<string, unknown>,
  target: string,
) {
  const mods = build.mods as Record<string, Record<string, unknown>> | undefined;
  const entry = mods?.[target];
  const bonus = readNumber(entry?.["Item Bonus"]);
  return bonus ?? 0;
}

function deriveSpeed(build: Record<string, unknown>) {
  const attributes = build.attributes as Record<string, unknown> | undefined;
  const base = readNumber(attributes?.speed) ?? 0;
  const bonus = readNumber(attributes?.speedBonus) ?? 0;
  const total = base + bonus;
  return total > 0 ? `${total} ft` : "";
}

function derivePerception(build: Record<string, unknown>) {
  const level = readNumber(build.level) ?? 0;
  const proficiencies = build.proficiencies as Record<string, unknown> | undefined;
  const rank = readNumber(proficiencies?.perception) ?? 0;
  return level + rank + readAbilityModifier(build, "wis") + readItemBonus(build, "Perception");
}

function deriveSave(build: Record<string, unknown>, save: "fortitude" | "reflex" | "will") {
  const level = readNumber(build.level) ?? 0;
  const proficiencies = build.proficiencies as Record<string, unknown> | undefined;
  const rank = readNumber(proficiencies?.[save]) ?? 0;
  const ability = save === "fortitude" ? "con" : save === "reflex" ? "dex" : "wis";
  const target = save === "fortitude" ? "Fortitude" : save === "reflex" ? "Reflex" : "Will";
  return level + rank + readAbilityModifier(build, ability) + readItemBonus(build, target);
}

function deriveSaves(build: Record<string, unknown>) {
  return [
    `Fort +${deriveSave(build, "fortitude")}`,
    `Ref +${deriveSave(build, "reflex")}`,
    `Will +${deriveSave(build, "will")}`,
  ];
}

function deriveAttacks(build: Record<string, unknown>) {
  const weapons = Array.isArray(build.weapons) ? build.weapons : [];

  return weapons
    .flatMap((weapon) => {
      if (!weapon || typeof weapon !== "object") {
        return [];
      }

      const name = readString((weapon as Record<string, unknown>).display)
        || readString((weapon as Record<string, unknown>).name);
      const attack = readNumber((weapon as Record<string, unknown>).attack);
      const damageDie = readString((weapon as Record<string, unknown>).die);
      const damageBonus = readNumber((weapon as Record<string, unknown>).damageBonus);
      const damageType = readString((weapon as Record<string, unknown>).damageType);

      if (!name || attack === null) {
        return [];
      }

      const damage = damageDie
        ? `${damageDie}${damageBonus && damageBonus > 0 ? `+${damageBonus}` : damageBonus === 0 ? "" : damageBonus ?? ""}${damageType ? damageType.toLowerCase() : ""}`
        : "";

      return [{
        label: damage ? `${name} +${attack}` : `${name} +${attack}`,
        detail: damage ? `Damage ${damage}` : name,
      }];
    })
    .slice(0, 4);
}

function deriveSpells(build: Record<string, unknown>) {
  const casters = Array.isArray(build.spellCasters) ? build.spellCasters : [];
  const focus = build.focus as Record<string, unknown> | undefined;

  const spellEntries = casters.flatMap((caster) => {
    if (!caster || typeof caster !== "object") {
      return [];
    }

    const casterName = readString((caster as Record<string, unknown>).name);
    const spells = Array.isArray((caster as Record<string, unknown>).spells)
      ? (caster as Record<string, unknown>).spells as Array<Record<string, unknown>>
      : [];

    const rankedSpells = spells
      .map((entry) => {
        const spellLevel = readNumber(entry.spellLevel);
        const list = readStringArray(entry.list);
        return {
          spellLevel: spellLevel ?? 0,
          list,
        };
      })
      .filter((entry) => entry.list.length > 0)
      .sort((left, right) => right.spellLevel - left.spellLevel);

    return rankedSpells.flatMap((entry) => {
      const label = entry.spellLevel === 0 ? "Cantrips" : `Rank ${entry.spellLevel}`;
      return entry.list.map((spellName) => ({
        label: spellName,
        detail: `${casterName || "Spells"} ${label}`,
      }));
    });
  });

  const focusEntries = focus
    ? Object.values(focus).flatMap((tradition) => {
      if (!tradition || typeof tradition !== "object") {
        return [];
      }

      return Object.values(tradition as Record<string, unknown>).flatMap((abilityBlock) => {
        if (!abilityBlock || typeof abilityBlock !== "object") {
          return [];
        }

        const block = abilityBlock as Record<string, unknown>;
        const cantrips = readStringArray(block.focusCantrips).map((spellName) => ({
          label: spellName,
          detail: "Focus Cantrip",
        }));
        const focusSpells = readStringArray(block.focusSpells).map((spellName) => ({
          label: spellName,
          detail: "Focus Spell",
        }));
        return [...cantrips, ...focusSpells];
      });
    })
    : [];

  return [...spellEntries, ...focusEntries]
    .filter((entry, index, entries) => entries.findIndex((candidate) =>
      candidate.label === entry.label && candidate.detail === entry.detail) === index)
    .slice(0, 24);
}

function deriveSkills(build: Record<string, unknown>) {
  const level = readNumber(build.level) ?? 0;
  const proficiencies = build.proficiencies as Record<string, unknown> | undefined;
  const topSkills = [
    { key: "acrobatics", label: "Acrobatics", ability: "dex" as const },
    { key: "arcana", label: "Arcana", ability: "int" as const },
    { key: "athletics", label: "Athletics", ability: "str" as const },
    { key: "crafting", label: "Crafting", ability: "int" as const },
    { key: "deception", label: "Deception", ability: "cha" as const },
    { key: "diplomacy", label: "Diplomacy", ability: "cha" as const },
    { key: "intimidation", label: "Intimidation", ability: "cha" as const },
    { key: "medicine", label: "Medicine", ability: "wis" as const },
    { key: "nature", label: "Nature", ability: "wis" as const },
    { key: "occultism", label: "Occultism", ability: "int" as const },
    { key: "performance", label: "Performance", ability: "cha" as const },
    { key: "religion", label: "Religion", ability: "wis" as const },
    { key: "society", label: "Society", ability: "int" as const },
    { key: "stealth", label: "Stealth", ability: "dex" as const },
    { key: "survival", label: "Survival", ability: "wis" as const },
    { key: "thievery", label: "Thievery", ability: "dex" as const },
  ]
    .map((skill) => {
      const rank = readNumber(proficiencies?.[skill.key]) ?? 0;
      const modifier = level + rank + readAbilityModifier(build, skill.ability) + readItemBonus(build, skill.label);
      return {
        label: `${skill.label} +${modifier}`,
        detail: skill.label,
        modifier,
      };
    })
    .sort((left, right) => right.modifier - left.modifier)
    .slice(0, 6)
    .map(({ label, detail }) => ({ label, detail }));

  const lores = Array.isArray(build.lores) ? build.lores : [];
  const loreEntries = lores.flatMap((lore) => {
    if (!Array.isArray(lore) || lore.length < 2) {
      return [];
    }

    const loreName = typeof lore[0] === "string" ? lore[0].trim() : "";
    const rank = typeof lore[1] === "number" ? lore[1] : null;
    if (!loreName || rank === null) {
      return [];
    }

    const modifier = level + rank + readAbilityModifier(build, "int");
    return [{
      label: `Lore: ${loreName} +${modifier}`,
      detail: `Lore skill: ${loreName}`,
    }];
  });

  return [...topSkills, ...loreEntries].slice(0, 8);
}

function deriveMaxHp(build: Record<string, unknown>) {
  const level = readNumber(build.level);
  const attributes = build.attributes as Record<string, unknown> | undefined;
  if (level === null || !attributes) {
    return null;
  }

  const ancestryHp = readNumber(attributes.ancestryhp) ?? 0;
  const classHp = readNumber(attributes.classhp) ?? 0;
  const bonusHp = readNumber(attributes.bonushp) ?? 0;
  const bonusHpPerLevel = readNumber(attributes.bonushpPerLevel) ?? 0;
  const conMod = readAbilityModifier(build, "con");

  return ancestryHp + bonusHp + level * (classHp + conMod + bonusHpPerLevel);
}

import { type SpotifySceneId } from "@/lib/spotify-scenes";

export type SoundAsset = {
  id: string;
  kind: "ambient" | "stinger";
  label: string;
  description: string;
  filePath: string;
  defaultVolume: number;
  sourceName: string;
  sourceUrl: string;
  licenseLabel: string;
  licenseUrl: string;
};

export type AtmospherePreset = {
  id: string;
  label: string;
  description: string;
  spotifyScene: SpotifySceneId;
  ambientIds: string[];
};

const MIXKIT_LICENSE_URL = "https://mixkit.co/license/";

export const SOUND_ASSETS: SoundAsset[] = [
  {
    id: "tavern-crowd",
    kind: "ambient",
    label: "Tavern Crowd",
    description: "Busy room tone for inns, pubs, market taverns, and warm social scenes.",
    filePath: "/audio/ambient/tavern-crowd.mp3",
    defaultVolume: 0.35,
    sourceName: "Mixkit Very crowded pub or party loop",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/360/360-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "rain-loop",
    kind: "ambient",
    label: "Rain",
    description: "Steady rain bed for roads, rooftops, tense travel, and moody downtime.",
    filePath: "/audio/ambient/rain-loop.mp3",
    defaultVolume: 0.4,
    sourceName: "Mixkit Rain long loop",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/2394/2394-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "fire-crackling",
    kind: "ambient",
    label: "Fire Crackling",
    description: "Campfire or hearth bed for taverns, camps, and quiet conversations.",
    filePath: "/audio/ambient/fire-crackling.mp3",
    defaultVolume: 0.28,
    sourceName: "Mixkit Campfire crackles",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/1330/1330-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "battlefield-noise",
    kind: "ambient",
    label: "Marching",
    description: "Marching crowd and army movement bed for war drums, columns, and looming forces.",
    filePath: "/audio/ambient/battlefield-noise.mp3",
    defaultVolume: 0.3,
    sourceName: "Mixkit Big army crowd marching",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/461/461-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "thunder-hit",
    kind: "stinger",
    label: "Thunder",
    description: "Quick thunder accent for storms, omens, and dramatic reveals.",
    filePath: "/audio/stingers/thunder-hit.mp3",
    defaultVolume: 0.7,
    sourceName: "Mixkit Nature ambience with lightning strike and thunder",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/3093/3093-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "hoof-beats",
    kind: "stinger",
    label: "Hoof Beats",
    description: "Gallop or incoming rider cue for roads, cavalry, and sudden arrivals.",
    filePath: "/audio/stingers/hoof-beats.mp3",
    defaultVolume: 0.72,
    sourceName: "Mixkit Horse fast gallop in the dirt",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/77/77-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "horror-hit",
    kind: "stinger",
    label: "Horror Hit",
    description: "Sharp scare chord for reveals, jump cuts, and eldritch punctuation.",
    filePath: "/audio/stingers/horror-hit.mp3",
    defaultVolume: 0.8,
    sourceName: "Mixkit Horror impact",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/773/773-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "electricity-zap",
    kind: "stinger",
    label: "Electricity",
    description: "Crackling zap for spells, broken wards, arcane devices, and lightning strikes.",
    filePath: "/audio/stingers/electricity-zap.mp3",
    defaultVolume: 0.76,
    sourceName: "Mixkit Electricity lightning blast",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/2601/2601-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "explosion-hit",
    kind: "stinger",
    label: "Explosion",
    description: "Big impact hit for blasts, alchemical detonations, and collapsing scenes.",
    filePath: "/audio/stingers/explosion-hit.mp3",
    defaultVolume: 0.85,
    sourceName: "Mixkit Explosion hit",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/1704/1704-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
  {
    id: "combat-clash",
    kind: "stinger",
    label: "Combat Clash",
    description: "Sword-on-sword accent for melee starts, parries, and dramatic blows.",
    filePath: "/audio/stingers/combat-clash.mp3",
    defaultVolume: 0.72,
    sourceName: "Mixkit Metallic sword strike",
    sourceUrl: "https://assets.mixkit.co/active_storage/sfx/2160/2160-preview.mp3",
    licenseLabel: "Mixkit License",
    licenseUrl: MIXKIT_LICENSE_URL,
  },
];

export const AMBIENT_SOUNDS = SOUND_ASSETS.filter((asset) => asset.kind === "ambient");
export const STINGER_SOUNDS = SOUND_ASSETS.filter((asset) => asset.kind === "stinger");

export const ATMOSPHERE_PRESETS: AtmospherePreset[] = [
  {
    id: "tavern",
    label: "Tavern",
    description: "Warm room tone for inns, conversations, and hearth-lit downtime.",
    spotifyScene: "tavern",
    ambientIds: ["tavern-crowd", "fire-crackling"],
  },
  {
    id: "storm",
    label: "Storm",
    description: "Wet tension with rain on loop and thunder ready to punctuate scenes.",
    spotifyScene: "eerie",
    ambientIds: ["rain-loop"],
  },
  {
    id: "battle",
    label: "Battle",
    description: "Use battle ambience as a chaos bed under combat playlists.",
    spotifyScene: "combat",
    ambientIds: ["battlefield-noise"],
  },
  {
    id: "campfire",
    label: "Campfire",
    description: "Quiet firelight and conversation support without crowd noise.",
    spotifyScene: "talking",
    ambientIds: ["fire-crackling"],
  },
];

export function createAmbientVolumeDefaults() {
  return Object.fromEntries(
    AMBIENT_SOUNDS.map((asset) => [asset.id, asset.defaultVolume]),
  ) as Record<string, number>;
}

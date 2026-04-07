export type SpotifySceneId =
  | "tavern"
  | "traveling"
  | "eerie"
  | "combat"
  | "talking"
  | "tense";

export type SpotifyScene = {
  id: SpotifySceneId;
  label: string;
  query: string;
  fallbackQueries?: string[];
};

export const SPOTIFY_SCENES: SpotifyScene[] = [
  {
    id: "tavern",
    label: "Tavern",
    query: "DnD tavern music",
    fallbackQueries: ["fantasy tavern music", "rpg tavern ambience"],
  },
  {
    id: "traveling",
    label: "Traveling",
    query: "dnd traveling music",
    fallbackQueries: ["dnd travel music", "fantasy adventure travel music", "rpg exploration music"],
  },
  {
    id: "eerie",
    label: "Eerie",
    query: "DnD eerie music",
    fallbackQueries: ["dark fantasy ambience", "rpg eerie ambience"],
  },
  {
    id: "combat",
    label: "Combat",
    query: "DnD combat music",
    fallbackQueries: ["fantasy battle music", "rpg combat music"],
  },
  {
    id: "talking",
    label: "Talking",
    query: "DnD casual conversation music",
    fallbackQueries: ["fantasy conversation ambience", "rpg city ambience"],
  },
  {
    id: "tense",
    label: "Tense",
    query: "DnD tense suspense music",
    fallbackQueries: ["fantasy suspense music", "rpg tense ambience"],
  },
];

export function getSpotifyScene(sceneId: string) {
  return SPOTIFY_SCENES.find((scene) => scene.id === sceneId) ?? null;
}

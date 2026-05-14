const FIRST_NAMES = [
  "Aelar",
  "Alina",
  "Aric",
  "Brenna",
  "Caelan",
  "Cassia",
  "Darian",
  "Delia",
  "Edrin",
  "Elira",
  "Faelan",
  "Garrik",
  "Ilyra",
  "Jorren",
  "Kaelis",
  "Kaelin",
  "Liora",
  "Lyra",
  "Marek",
  "Mira",
  "Nerys",
  "Orin",
  "Perrin",
  "Rhea",
  "Seren",
  "Sylas",
  "Tavian",
  "Thera",
  "Vaelin",
  "Ysara",
];

const LAST_NAMES = [
  "Ashdown",
  "Blackwater",
  "Brightwood",
  "Corvane",
  "Dawnmere",
  "Duskryn",
  "Emberfall",
  "Fenmere",
  "Gloamheart",
  "Hallowmere",
  "Ironvale",
  "Kestrel",
  "Larkspur",
  "Mistvale",
  "Moonbrook",
  "Ravencrest",
  "Stormhollow",
  "Thornfield",
  "Valehart",
  "Wintermere",
];

export function generateFantasyName(factionName?: string) {
  const first = pick(FIRST_NAMES);
  const seededLast = deriveFactionSurname(factionName);
  const last = seededLast && Math.random() < 0.7 ? seededLast : pick(LAST_NAMES);
  return `${first} ${last}`;
}

function deriveFactionSurname(factionName?: string) {
  if (!factionName) {
    return "";
  }

  const match = factionName.match(/^(?:House|Clan)\s+(.+)$/i);
  if (match?.[1]) {
    return cleanup(match[1]);
  }

  return "";
}

function pick(values: string[]) {
  return values[Math.floor(Math.random() * values.length)] ?? "";
}

function cleanup(value: string) {
  return value.replace(/[`*_]/g, "").trim();
}

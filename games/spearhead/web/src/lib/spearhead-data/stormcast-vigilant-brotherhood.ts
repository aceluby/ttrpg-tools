import type { ArmyDefinition } from "@/lib/spearhead-data/types";

export const stormcastVigilantBrotherhood: ArmyDefinition = {
  enhancements: [
    {
      details: [
        "Passive summary: your general gains Ward (5+).",
      ],
      name: "Staunch Defender",
      sourceLabel: "Mapped from official Stormcast Spearhead enhancement list",
      sourceUrl:
        "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
    },
    {
      details: [
        "Once per battle in any combat phase: your general fights with Strike-first for that phase.",
      ],
      name: "Shock and Awe",
      sourceLabel: "Mapped from official Stormcast Spearhead enhancement list",
      sourceUrl:
        "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
    },
  ],
  faction: "Stormcast Eternals",
  id: "stormcast-eternals-vigilant-brotherhood",
  name: "Stormcast Eternals: Vigilant Brotherhood",
  notes: [
    "Initial detailed army data model scaffold.",
    "Full warscroll ingestion for every supported Spearhead is still in progress.",
    "This file establishes the source metadata and full-text storage shape the rest of the armies will follow.",
  ],
  regimentAbilities: [
    {
      details: [
        "Reaction summary: a unit that retreats avoids retreat mortal damage and can still charge later that turn.",
      ],
      name: "Strike Where Needed",
      sourceLabel: "Official Stormcast Spearhead PDF",
      sourceUrl:
        "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
    },
    {
      details: [
        "Once per battle in any combat phase: a chosen friendly unit deals vengeance-style mortal damage on a 4+ each time one of its models is slain that phase.",
      ],
      name: "Blaze of Glory",
      sourceLabel: "Official Stormcast Spearhead PDF",
      sourceUrl:
        "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
    },
  ],
  source: {
    title: "Warhammer Age of Sigmar Downloads",
    url: "https://www.warhammer-community.com/en-gb/downloads/warhammer-age-of-sigmar/",
    versionLabel: "V1 scaffold based on official downloads index and pending faction pack transcription",
  },
  summary:
    "A disciplined Stormcast Spearhead built around elite resilience, decisive counter-pressure, and dependable frontline units.",
  tags: ["elite", "durable", "counter-punch"],
  units: [
    {
      id: "lord-vigilant-on-gryph-stalker",
      keywords: ["Hero", "Stormcast Eternals"],
      name: "Lord-Vigilant on Gryph-stalker",
      role: "Mobile leader and pressure piece.",
      warscrollText: [
        "Full warscroll text pending transcription from the official Spearhead pack.",
      ],
    },
    {
      id: "liberators",
      keywords: ["Infantry", "Redeemer", "Stormcast Eternals"],
      name: "Liberators",
      role: "Objective holders and steady frontline.",
      warscrollText: [
        "Full warscroll text pending transcription from the official Spearhead pack.",
      ],
    },
    {
      id: "prosecutors",
      keywords: ["Fly", "Infantry", "Stormcast Eternals"],
      name: "Prosecutors",
      role: "Fast flanking and pressure projection.",
      warscrollText: [
        "Full warscroll text pending transcription from the official Spearhead pack.",
      ],
    },
    {
      id: "reclusians",
      keywords: ["Infantry", "Warrior Chamber", "Stormcast Eternals"],
      name: "Reclusians",
      role: "Hard-hitting elite unit for sustained engagements.",
      warscrollText: [
        "Full warscroll text pending transcription from the official Spearhead pack.",
      ],
    },
  ],
};

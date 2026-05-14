import { stormcastVigilantBrotherhood } from "@/lib/spearhead-data/stormcast-vigilant-brotherhood";
import type { ArmyDefinition, ArmySummary } from "@/lib/spearhead-data/types";

const armySummaries: ArmySummary[] = [
  {
    dataStatus: "Detailed army model started",
    enhancements: [
      {
        details: [
          "Passive summary: your general gains Ward (5+).",
        ],
        name: "Hallowed Scrolls",
        sourceLabel: "Official Stormcast Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
      },
      {
        details: [
          "Passive summary: your general's Hallowed Greataxe gains Crit (Mortal).",
        ],
        name: "Morrda's Talon",
        sourceLabel: "Official Stormcast Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
      },
      {
        details: [
          "Once per battle in any combat phase: your general gains Strike-first for that phase.",
        ],
        name: "Quicksilver Draught",
        sourceLabel: "Official Stormcast Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
      },
      {
        details: [
          "Once per battle at the end of any turn: roll for each enemy unit contesting the same objective as your general; on a 2+, reduce that unit's control score by the roll for the turn.",
        ],
        name: "Null Pendant",
        sourceLabel: "Official Stormcast Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/stormcast-eternals-spearhead/eng_stormcast_eternals_spearhead.pdf",
      },
    ],
    faction: "Stormcast Eternals",
    id: "stormcast-eternals-vigilant-brotherhood",
    name: "Stormcast Eternals: Vigilant Brotherhood",
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
    summary:
      "Elite armored warriors with reliable staying power and strong counter-pressure tools.",
    tags: ["elite", "durable", "counter-punch"],
  },
  {
    dataStatus: "Summary scaffold ready",
    enhancements: [
      {
        details: [
          "Passive summary: enemy units in combat with your general subtract 1 from save rolls.",
        ],
        name: "Warpstone Charm",
        sourceLabel: "Official Skaven Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/skaven-spearhead/eng_skaven_spearhead.pdf",
      },
      {
        details: [
          "Passive summary: your general's Ratling Pistol increases from D6 attacks to 2D6 attacks.",
        ],
        name: "Skryre Connections",
        sourceLabel: "Official Skaven Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/skaven-spearhead/eng_skaven_spearhead.pdf",
      },
      {
        details: [
          "Passive summary: your general gains Ward (5+).",
        ],
        name: "Cloak of Stitched Victories",
        sourceLabel: "Official Skaven Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/skaven-spearhead/eng_skaven_spearhead.pdf",
      },
      {
        details: [
          "Reaction summary for Call for Reinforcements: instead of the normal setup instructions, the replacement unit can be set up wholly within 13 inches of this unit and not in combat.",
        ],
        name: "Lead the Seething Horde",
        sourceLabel: "Official Skaven Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/skaven-spearhead/eng_skaven_spearhead.pdf",
      },
    ],
    faction: "Skaven",
    id: "skaven-gnawfeast-clawpack",
    name: "Skaven: Gnawfeast Clawpack",
    regimentAbilities: [
      {
        details: [
          "Your movement phase summary: pick a ranged weapon a friendly unit is armed with; that weapon gains Crit (Mortal) for the phase.",
        ],
        name: "Warpstone-laced Bullets",
        sourceLabel: "Official Skaven Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/skaven-spearhead/eng_skaven_spearhead.pdf",
      },
      {
        details: [
          "Passive summary: friendly units do not take retreat mortal damage when they retreat.",
        ],
        name: "Too Quick to Hit-hit",
        sourceLabel: "Official Skaven Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/rules-downloads/age-of-sigmar/skaven-spearhead/eng_skaven_spearhead.pdf",
      },
    ],
    summary:
      "Aggressive ratmen pressure list that likely leans on numbers, velocity, and opportunistic damage.",
    tags: ["aggressive", "swarm", "trickery"],
  },
  {
    dataStatus: "Summary scaffold ready",
    enhancements: [
      {
        details: [
          "Once per phase in your hero phase: pick a friendly unit and Heal (D3) it.",
        ],
        name: "Locus of Fecundity",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
      {
        details: [
          "Passive summary: when a friendly model is slain, you can pick an enemy unit within 1 inch; on a 4+, it takes 1 mortal damage.",
        ],
        name: "Infested with Wonders",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
      {
        details: [
          "Once per battle in any combat phase: pick an enemy unit within 7 inches of your general and roll for each model in it; each 5+ deals 1 mortal damage.",
        ],
        name: "Pestilent Breath",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
      {
        details: [
          "Your movement phase summary: pick a friendly Plaguebearers unit wholly within 14 inches of your general and return 1 slain model to it.",
        ],
        name: "Summoner of Plaguebearers",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
    ],
    faction: "Maggotkin of Nurgle",
    id: "maggotkin-of-nurgle-bleak-host",
    name: "Maggotkin of Nurgle: Bleak Host",
    regimentAbilities: [
      {
        details: [
          "Once per phase in your hero phase: while friendly units are wholly within 7 inches of your general, add 1 to the Attacks characteristic of their melee weapons until end of phase.",
        ],
        name: "Gift of Febrile Frenzy",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
      {
        details: [
          "Passive summary: if your general is contesting an uncontested objective, roll a die; on a 3+, it becomes desecrated and your friendly units get Ward (4+) while contesting it until the opponent takes control.",
        ],
        name: "Gardener of Nurgle",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
      {
        details: [
          "Your movement phase summary: spend any number of disease points; for each point spent, pick an enemy unit in combat with one of your units and roll a die, dealing 1 mortal damage on a 4+.",
        ],
        name: "Nurgle's Embrace",
        sourceLabel: "Official Bleak Host PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_maggotkin_of_nurgle_bleak_host-anonar5akg-es9llpugle.pdf",
      },
    ],
    summary:
      "A grinding, disease-forward force built to absorb punishment and outlast key fights.",
    tags: ["durable", "attrition", "board control"],
  },
  {
    dataStatus: "Summary scaffold ready",
    enhancements: [
      {
        details: [
          "Once per battle in your movement phase: after a nearby unit uses Skeleton Legion, add 1 to each legion roll made for that unit.",
        ],
        name: "Grave-sand Shard",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
      {
        details: [
          "Passive summary: ignore negative modifiers to save rolls for shooting attacks that target your general.",
        ],
        name: "Aura of Night",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
      {
        details: [
          "Your hero phase summary: make a casting roll of 2D6; on a 7+, inflict 1 mortal damage on each enemy unit on the battlefield.",
        ],
        name: "Spirit Gale",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
      {
        details: [
          "Passive summary: after a friendly Vampire unit fights, heal it by the number of damage points it allocated with those attacks.",
        ],
        name: "The Hunger",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
    ],
    faction: "Soulblight Gravelords",
    id: "soulblight-gravelords-bloodcrave-hunt",
    name: "Soulblight Gravelords: Bloodcrave Hunt",
    regimentAbilities: [
      {
        details: [
          "Once per battle in your movement phase: pick a destroyed friendly Deathrattle Skeletons unit and return a replacement unit with D6+4 models, set up anywhere more than 6 inches from enemy units.",
        ],
        name: "Endless Legions",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
      {
        details: [
          "Any charge phase summary: after your Blood Knights charge, they inflict D3 mortal damage on each enemy unit they passed across during that charge.",
        ],
        name: "Ruinous Chargers",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
      {
        details: [
          "Once per battle in your movement phase: your Vargheists can be set up anywhere on the battlefield more than 6 inches from enemy units.",
        ],
        name: "Swoop Down",
        sourceLabel: "Official Bloodcrave Hunt PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_01-04_aos_spearhead_soulblight_gravelords_bloodcrave_hunt-vdg57qq6dt-h7hylvvtke.pdf",
      },
    ],
    summary:
      "A predatory undead Spearhead expected to combine speed, pressure, and recursion themes.",
    tags: ["undead", "pressure", "recursion"],
  },
  {
    dataStatus: "Summary scaffold ready",
    enhancements: [
      {
        details: [
          "Passive summary: your general's Health becomes 15 instead of 12.",
        ],
        name: "Monstrously Tough",
        sourceLabel: "Official Sons of Behemat Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_aos_spearhead_sons_of_behemat_wallsmasher_stomp-pixgkvvzk0-hh6q2dgl7y.pdf",
      },
      {
        details: [
          "Passive summary: your general can target 2 enemy units instead of 1 with Stuff 'Em In Me Bag.",
        ],
        name: "Extra-big Bag",
        sourceLabel: "Official Sons of Behemat Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_aos_spearhead_sons_of_behemat_wallsmasher_stomp-pixgkvvzk0-hh6q2dgl7y.pdf",
      },
      {
        details: [
          "Passive summary: your general rolls 3D6 instead of 2D6 for charge rolls.",
        ],
        name: "Lanky Git",
        sourceLabel: "Official Sons of Behemat Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_aos_spearhead_sons_of_behemat_wallsmasher_stomp-pixgkvvzk0-hh6q2dgl7y.pdf",
      },
      {
        details: [
          "Passive summary: add 1 to hit rolls for your general's attacks against enemy units contesting an objective you do not control.",
        ],
        name: "Furiously Territorial",
        sourceLabel: "Official Sons of Behemat Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_aos_spearhead_sons_of_behemat_wallsmasher_stomp-pixgkvvzk0-hh6q2dgl7y.pdf",
      },
    ],
    faction: "Sons of Behemat",
    id: "sons-of-behemat-wallsmasher-stomp",
    name: "Sons of Behemat: Wallsmasher Stomp",
    regimentAbilities: [
      {
        details: [
          "Once per phase in any charge phase: for each enemy unit in combat with a friendly unit that charged, roll a die; on a 3+ that enemy unit has Strike-last this turn.",
        ],
        name: "Earth-shaking Charge",
        sourceLabel: "Official Sons of Behemat Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_aos_spearhead_sons_of_behemat_wallsmasher_stomp-pixgkvvzk0-hh6q2dgl7y.pdf",
      },
      {
        details: [
          "Passive summary: each time Stuff 'Em In Me Bag slays an enemy model for a friendly unit, that unit heals D3.",
        ],
        name: "Foe-chompers",
        sourceLabel: "Official Sons of Behemat Spearhead PDF",
        sourceUrl:
          "https://assets.warhammer-community.com/eng_aos_spearhead_sons_of_behemat_wallsmasher_stomp-pixgkvvzk0-hh6q2dgl7y.pdf",
      },
    ],
    summary:
      "Low-model-count giant force focused on brutal impact, presence, and objective bullying.",
    tags: ["monsters", "elite", "impact"],
  },
];

const armiesById = new Map<string, ArmyDefinition>([
  [stormcastVigilantBrotherhood.id, stormcastVigilantBrotherhood],
]);
const armySummariesById = new Map(armySummaries.map((army) => [army.id, army]));

export function getArmyById(armyId: string) {
  return armiesById.get(armyId) ?? null;
}

export function getArmySummaryById(armyId: string) {
  return armySummariesById.get(armyId) ?? null;
}

export function listArmies() {
  return armySummaries;
}

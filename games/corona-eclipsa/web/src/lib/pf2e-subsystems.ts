export type SubsystemId =
  | "victory-points"
  | "influence"
  | "research"
  | "chases"
  | "infiltration"
  | "reputation"
  | "duels"
  | "leadership"
  | "hexploration"
  | "vehicles";

export type SubsystemRow = {
  id: string;
  name: string;
  role: string;
  secondary: string;
  progress: number;
  target: number;
  dc: number;
  status: string;
  notes: string;
  tags: string;
};

export type SubsystemMetricDefinition = {
  defaultValue: number;
  description: string;
  key: string;
  label: string;
  step?: number;
};

export type SubsystemFieldDefinition = {
  key: Exclude<keyof SubsystemRow, "id">;
  label: string;
  min?: number;
  options?: string[];
  placeholder?: string;
  type: "number" | "select" | "text" | "textarea";
};

export type SubsystemCollectionDefinition = {
  addLabel: string;
  description: string;
  emptyLabel: string;
  fields: SubsystemFieldDefinition[];
  key: string;
  label: string;
  template: Omit<SubsystemRow, "id">;
};

export type SubsystemDefinition = {
  collections: SubsystemCollectionDefinition[];
  description: string;
  eyebrow: string;
  id: SubsystemId;
  label: string;
  metrics: SubsystemMetricDefinition[];
  phases: string[];
  rules: string[];
  runLoop: string[];
  sourceHref: string;
  tips: string[];
};

export type SubsystemWorkspace = {
  gmNotes: string;
  metrics: Record<string, number>;
  notes: string;
  phase: string;
  round: number;
  title: string;
  collections: Record<string, SubsystemRow[]>;
};

export type SubsystemRunnerState = {
  selectedSubsystemId: SubsystemId;
  workspaces: Record<SubsystemId, SubsystemWorkspace>;
};

const SOURCE_HREF = "https://2e.aonprd.com/Rules.aspx?ID=3026";

export const PF2E_SUBSYSTEMS: SubsystemDefinition[] = [
  {
    id: "victory-points",
    label: "Victory Points",
    eyebrow: "GM Core Baseline",
    description: "Use PF2e's generic progress framework to track scene, session, or adventure-scale success.",
    sourceHref: SOURCE_HREF,
    phases: ["Setup", "Active Challenge", "Threshold", "Resolved"],
    metrics: [
      { key: "currentVp", label: "Current VP", description: "The party's running total.", defaultValue: 0 },
      { key: "goalVp", label: "Goal VP", description: "How many points end the challenge.", defaultValue: 5 },
      { key: "thresholdVp", label: "Threshold", description: "The first partial-success marker.", defaultValue: 3 },
      { key: "enemyVp", label: "Opposition VP", description: "Use when the opposition has its own track.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "tasks",
        label: "Tasks & Obstacles",
        description: "List the routes to victory, important DCs, and consequences.",
        addLabel: "Add Task",
        emptyLabel: "No tasks yet. Add obstacles, goals, or opportunities.",
        fields: [
          { key: "name", label: "Name", type: "text", placeholder: "Sway the duke" },
          { key: "role", label: "Approach", type: "text", placeholder: "Diplomacy, Society, leverage" },
          { key: "progress", label: "VP", type: "number", min: 0 },
          { key: "target", label: "Target", type: "number", min: 0 },
          { key: "dc", label: "DC", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Available", "In Play", "Cleared", "Closed"] },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "CS +2 VP, CF -1 VP" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 1,
          dc: 15,
          status: "Available",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "PF2e uses Victory Points as a flexible subsystem backbone when a single check is too small to hold the whole challenge.",
      "The default accumulating roll scale is critical success +2 VP, success +1 VP, failure +0 VP, and critical failure -1 VP.",
      "The chapter also supports diminishing-point structures and multi-track structures when tension comes from losing ground or balancing two tracks at once.",
      "Choose a scale that matches how long the challenge should last and place thresholds where partial wins or twists should fire.",
    ],
    runLoop: [
      "Set the point goal, thresholds, and any opposing or risk tracks.",
      "List the main approaches, obstacles, and easier or harder DCs.",
      "Resolve each meaningful player action into VP changes and update the trackers immediately.",
      "Trigger threshold effects as soon as they are crossed, then resolve the scene once the end condition is met.",
    ],
    tips: [
      "Use this when you need a custom subsystem that the chapter doesn't already model directly.",
      "If clever preparation lowers the DC, also consider granting extra VP for exploiting a true weakness.",
    ],
  },
  {
    id: "influence",
    label: "Influence",
    eyebrow: "Social Subsystem",
    description: "Run structured social encounters where each NPC has its own influence track and thresholds.",
    sourceHref: SOURCE_HREF,
    phases: ["Introductions", "Open Exchange", "Closing Push", "Resolved"],
    metrics: [
      { key: "currentRound", label: "Round", description: "How many social turns have passed.", defaultValue: 1 },
      { key: "roundLimit", label: "Round Limit", description: "How long the social event lasts.", defaultValue: 3 },
      { key: "partyLeverage", label: "Leverage", description: "Shared advantage or leverage available to spend.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "npcs",
        label: "NPC Influence Tracks",
        description: "Track each NPC's attitude threshold, discovered preferences, and current influence.",
        addLabel: "Add NPC",
        emptyLabel: "No NPCs yet. Add the people the party can sway.",
        fields: [
          { key: "name", label: "NPC", type: "text", placeholder: "Lady Talvera" },
          { key: "role", label: "Hook", type: "text", placeholder: "Honor, fear, greed" },
          { key: "progress", label: "Influence", type: "number", min: 0 },
          { key: "target", label: "Threshold", type: "number", min: 1 },
          { key: "dc", label: "DC", type: "number", min: 0 },
          { key: "status", label: "Attitude", type: "select", options: ["Unknown", "Wary", "Open", "Won Over", "Offended"] },
          { key: "tags", label: "Biases", type: "text", placeholder: "Weaknesses, resistances, taboo topics" },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Best skills, tells, discovered leverage" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 3,
          dc: 20,
          status: "Unknown",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Influence expands a social scene into rounds so multiple PCs can contribute instead of boiling everything down to one check.",
      "Each NPC should have individual thresholds, preferred approaches, and topics that can help or backfire.",
      "Use the subsystem when the relationship itself matters enough to be a significant scene, not for every conversation.",
    ],
    runLoop: [
      "Set the guest list, the round limit, and each NPC's threshold plus hooks and dealbreakers.",
      "On each round, let each PC choose an approach, roll, and adjust that NPC's influence track.",
      "Record discovered biases or social weaknesses as soon as the party learns them.",
      "When an NPC crosses their threshold, lock in the benefit or concession they grant.",
    ],
    tips: [
      "Keep each NPC distinct: what impresses one target should not automatically work on all of them.",
      "Use notes to record soft roleplay tells you want on hand mid-scene.",
    ],
  },
  {
    id: "research",
    label: "Research",
    eyebrow: "Investigation Subsystem",
    description: "Track Research Points, thresholds, and which sources the party has already exploited.",
    sourceHref: SOURCE_HREF,
    phases: ["Orientation", "Active Research", "Breakthrough", "Resolved"],
    metrics: [
      { key: "researchPoints", label: "Research Points", description: "The total RP the party has earned.", defaultValue: 0 },
      { key: "goalPoints", label: "Goal RP", description: "How many points fully solve the topic.", defaultValue: 6 },
      { key: "thresholdPoints", label: "Threshold RP", description: "The first clue threshold.", defaultValue: 2 },
      { key: "researchDay", label: "Day / Interval", description: "Track time spent researching.", defaultValue: 1 },
    ],
    collections: [
      {
        key: "topics",
        label: "Topics & Sources",
        description: "Track what the party is researching and where they can investigate next.",
        addLabel: "Add Topic",
        emptyLabel: "No research topics yet. Add questions, archives, or clues.",
        fields: [
          { key: "name", label: "Topic", type: "text", placeholder: "Dragon sacrifice ritual" },
          { key: "role", label: "Source", type: "text", placeholder: "Library, contact, ruin, archive" },
          { key: "progress", label: "RP", type: "number", min: 0 },
          { key: "target", label: "Threshold", type: "number", min: 1 },
          { key: "dc", label: "DC", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Available", "Exhausted", "Solved", "Blocked"] },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "What this source reveals or when it refreshes" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 2,
          dc: 18,
          status: "Available",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Research scenes work best when the party can chase multiple sources and reach clue thresholds over time.",
      "Track both the party's total progress and which individual sources have been exhausted or are still available.",
      "Partial thresholds should reveal actionable information so the scene keeps moving.",
    ],
    runLoop: [
      "Set the overall RP goal, threshold reveals, and the available research sources.",
      "For each interval, resolve the PCs' chosen sources and add RP on success.",
      "Mark sources exhausted or blocked when the fiction says they no longer help.",
      "Reveal bigger truths whenever the RP total crosses a threshold.",
    ],
    tips: [
      "Use one row per archive, scholar, or clue stream rather than one row per book.",
      "If time pressure matters, let the day tracker be the real tension instead of enemy actions.",
    ],
  },
  {
    id: "chases",
    label: "Chases",
    eyebrow: "Action Subsystem",
    description: "Track obstacle progress, the party's current lead, and the pace of the opposing side.",
    sourceHref: SOURCE_HREF,
    phases: ["Launch", "Obstacle Run", "Final Stretch", "Resolved"],
    metrics: [
      { key: "obstaclesCleared", label: "Obstacles Cleared", description: "How many chase obstacles the party has beaten.", defaultValue: 0 },
      { key: "lead", label: "Lead", description: "Positive means the party is ahead; negative means behind.", defaultValue: 0 },
      { key: "currentObstacle", label: "Current Obstacle", description: "The obstacle number the party is facing now.", defaultValue: 1 },
      { key: "rivalPace", label: "Rival Pace", description: "Track the opposition's current push.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "obstacles",
        label: "Chase Obstacles",
        description: "List each obstacle, the skills it invites, and what happens on success or failure.",
        addLabel: "Add Obstacle",
        emptyLabel: "No obstacles yet. Add the barriers in the route.",
        fields: [
          { key: "name", label: "Obstacle", type: "text", placeholder: "Crowded market square" },
          { key: "role", label: "Approaches", type: "text", placeholder: "Athletics, Acrobatics, Society" },
          { key: "progress", label: "Progress", type: "number", min: 0 },
          { key: "target", label: "Needed", type: "number", min: 1 },
          { key: "dc", label: "DC", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Upcoming", "Active", "Cleared", "Failed"] },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Complications, hazards, rival reactions" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 1,
          dc: 20,
          status: "Upcoming",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Chases are built from a sequence of obstacles rather than grid movement.",
      "Each obstacle should offer multiple plausible approaches and meaningful consequences on failure.",
      "Use the lead and obstacle trackers to show whether the party is gaining ground or being overtaken.",
    ],
    runLoop: [
      "Build the route as a series of obstacles with different skills and fiction.",
      "Set the starting lead and mark which obstacle is currently active.",
      "Resolve each PC's attempt against the active obstacle and update its progress.",
      "When the obstacle is cleared, move to the next one and adjust the lead based on the results.",
    ],
    tips: [
      "Good chase obstacles change the scene dramatically, not just the DC.",
      "If a rival group matters, use the rival pace metric to note sudden surges or setbacks.",
    ],
  },
  {
    id: "infiltration",
    label: "Infiltration",
    eyebrow: "Stealth & Heist Subsystem",
    description: "Track preparation, Edge Points, Awareness Points, and objective progress during a heist or covert op.",
    sourceHref: SOURCE_HREF,
    phases: ["Preparation", "Insertion", "Objective", "Extraction"],
    metrics: [
      { key: "infiltrationPoints", label: "Infiltration Points", description: "Progress toward pulling off the objective.", defaultValue: 0 },
      { key: "awarenessPoints", label: "Awareness Points", description: "How close the defenders are to catching on.", defaultValue: 0 },
      { key: "edgePoints", label: "Edge Points", description: "Prepared advantages available to spend.", defaultValue: 0 },
      { key: "goalPoints", label: "Goal IP", description: "How much progress is needed for success.", defaultValue: 5 },
    ],
    collections: [
      {
        key: "prep",
        label: "Preparation Activities",
        description: "Track prep work, contacts, forged papers, recon, and what advantages they create.",
        addLabel: "Add Prep",
        emptyLabel: "No prep activities yet. Add the heist groundwork.",
        fields: [
          { key: "name", label: "Prep", type: "text", placeholder: "Forge invitation" },
          { key: "role", label: "Approach", type: "text", placeholder: "Diplomacy, Society, Stealth" },
          { key: "progress", label: "Edge", type: "number", min: 0 },
          { key: "target", label: "Uses", type: "number", min: 0 },
          { key: "dc", label: "DC", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Planned", "Ready", "Spent", "Burned"] },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "What benefit it gives and where it applies" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 1,
          target: 1,
          dc: 20,
          status: "Planned",
          notes: "",
          tags: "",
        },
      },
      {
        key: "objectives",
        label: "Objectives & Obstacles",
        description: "Track the live objectives, patrols, and trouble spots during the infiltration.",
        addLabel: "Add Objective",
        emptyLabel: "No objectives yet. Add entry points, goals, and complications.",
        fields: [
          { key: "name", label: "Objective", type: "text", placeholder: "Reach the vault" },
          { key: "role", label: "Approach", type: "text", placeholder: "Stealth, Deception, Thievery" },
          { key: "progress", label: "IP", type: "number", min: 0 },
          { key: "target", label: "Needed", type: "number", min: 1 },
          { key: "dc", label: "DC", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Upcoming", "Active", "Cleared", "Alerted"] },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Patrols, locks, alarms, extraction route" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 1,
          dc: 20,
          status: "Upcoming",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Infiltration uses multiple point tracks: Infiltration Points for success, Awareness Points for how alerted the opposition is, and Edge Points for prepared advantages.",
      "Preparation matters: advance scouting, contacts, and forged documents should create concrete edges the party can spend later.",
      "Awareness often rises over time or through failures, so the system rewards speed and clean execution.",
    ],
    runLoop: [
      "Plan the job first: list prep activities, entry routes, and where Edge Points will matter.",
      "When the infiltration begins, track both progress and awareness every time the party acts.",
      "Spend Edge Points to improve key moments and record when they are burned or exposed.",
      "If Awareness spikes, change the fiction immediately with patrols, alarms, or a hard pivot into escape.",
    ],
    tips: [
      "Use one collection for prep and another for live objectives so the job stays legible.",
      "If something looks too easy on paper, add time pressure instead of only raising DCs.",
    ],
  },
  {
    id: "reputation",
    label: "Reputation",
    eyebrow: "Faction Subsystem",
    description: "Track how factions view the party over time, from revered allies to active hunters.",
    sourceHref: SOURCE_HREF,
    phases: ["Background Tracking", "Shift", "Benefit", "Backlash"],
    metrics: [
      { key: "activeFactions", label: "Active Factions", description: "How many groups are currently in play.", defaultValue: 1 },
      { key: "favorSwing", label: "Recent Favor", description: "Use this to note the last change before applying it to a faction row.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "factions",
        label: "Faction Reputation",
        description: "Track each group's points, rank band, and the favors or disservices that moved them.",
        addLabel: "Add Faction",
        emptyLabel: "No factions yet. Add the groups reacting to the party.",
        fields: [
          { key: "name", label: "Faction", type: "text", placeholder: "Town Guard" },
          { key: "role", label: "Current Rank", type: "select", options: ["Hunted", "Hated", "Disliked", "Ignored", "Liked", "Admired", "Revered"] },
          { key: "progress", label: "RP", type: "number", min: 0 },
          { key: "target", label: "Next Threshold", type: "number", min: 0 },
          { key: "status", label: "Trend", type: "select", options: ["Improving", "Stable", "Worsening"] },
          { key: "tags", label: "Triggers", type: "text", placeholder: "Favours and disservices that matter" },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "How the faction behaves at this rank" },
        ],
        template: {
          name: "",
          role: "Ignored",
          secondary: "",
          progress: 0,
          target: 10,
          dc: 0,
          status: "Stable",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Reputation is best as a background subsystem that tracks how the world reacts to the party's long-term behavior.",
      "The chapter presents reputation bands that range from Revered on the positive side to Hunted on the negative side.",
      "When the fiction changes radically, you should adjust the faction's track to fit the story instead of obeying the numbers blindly.",
    ],
    runLoop: [
      "List the factions that matter and give each a current rank plus next threshold.",
      "Whenever the party does a favor or disservice, update that faction's points and notes.",
      "If a threshold is crossed, change the faction's behavior immediately in the world.",
      "Use the notes field to capture the concrete privileges, hostility, or pressure the rank creates.",
    ],
    tips: [
      "This is ideal for sandbox campaigns where the party's choices need to echo forward.",
      "If a single public event changes everything, jump the rank and let the fiction lead the math.",
    ],
  },
  {
    id: "duels",
    label: "Duels",
    eyebrow: "One-on-One Subsystem",
    description: "Track duel rounds, stakes, initiative posture, and the state of each duelist.",
    sourceHref: SOURCE_HREF,
    phases: ["Terms", "Opening Exchange", "Escalation", "Judgment"],
    metrics: [
      { key: "duelRound", label: "Round", description: "Current round of the duel.", defaultValue: 1 },
      { key: "victoryCount", label: "Victory Count", description: "Use this if the duel uses accumulated victories instead of HP alone.", defaultValue: 0 },
      { key: "stakes", label: "Stakes", description: "A simple numeric reminder of how costly the duel's outcome is.", defaultValue: 1 },
    ],
    collections: [
      {
        key: "duelists",
        label: "Duelists",
        description: "Track each participant, their current posture, and special dueling notes.",
        addLabel: "Add Duelist",
        emptyLabel: "No duelists yet. Add the duel participants.",
        fields: [
          { key: "name", label: "Duelist", type: "text", placeholder: "Sir Varo" },
          { key: "role", label: "Style", type: "text", placeholder: "Combat, spellcasting, first blood" },
          { key: "progress", label: "Score", type: "number", min: 0 },
          { key: "target", label: "To Win", type: "number", min: 1 },
          { key: "status", label: "State", type: "select", options: ["Ready", "Pressing", "Shaken", "Yielded", "Disqualified"] },
          { key: "tags", label: "Specials", type: "text", placeholder: "Reaction, tradition focus, banned tactics" },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Judge rulings, honor terms, concessions" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 1,
          dc: 0,
          status: "Ready",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Duels start with agreed terms and a judge or accepted rules, and a caught rule-breaker loses immediately under those terms.",
      "The subsystem supports several duel forms, including combat and spellcasting variants.",
      "The chapter includes duel-specific actions and endings, including yielding, cheating, and formal confirmation of victory.",
    ],
    runLoop: [
      "Record the stakes, the judge, and the victory condition before the first exchange.",
      "Track each round and note any special duel-only options or reactions in play.",
      "Update the duelist states as pressure rises, someone yields, or cheating is exposed.",
      "Resolve the duel the moment the agreed victory condition is confirmed.",
    ],
    tips: [
      "Write the terms into notes before initiative starts so you do not renegotiate them mid-scene.",
      "If this is a spellcasting duel, use tags to note each duelist's tradition focus.",
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    eyebrow: "Campaign-Scale Subsystem",
    description: "Track the party's organization, its followers, lieutenants, and ongoing obligations.",
    sourceHref: SOURCE_HREF,
    phases: ["Founding", "Growth", "Operations", "Advancement"],
    metrics: [
      { key: "organizationLevel", label: "Organization Level", description: "The current level of the party's organization.", defaultValue: 1 },
      { key: "followers", label: "Followers", description: "Total active followers on the roster.", defaultValue: 0 },
      { key: "lieutenants", label: "Lieutenants", description: "Trusted higher-level followers leading the rest.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "assets",
        label: "Followers, Lieutenants & Assets",
        description: "Track the people and bases that make the organization function.",
        addLabel: "Add Asset",
        emptyLabel: "No organization assets yet. Add followers, lieutenants, or bases.",
        fields: [
          { key: "name", label: "Asset", type: "text", placeholder: "Rivergate safehouse" },
          { key: "role", label: "Type", type: "select", options: ["Follower", "Lieutenant", "Base", "Benefit", "Problem"] },
          { key: "progress", label: "Level", type: "number", min: 0 },
          { key: "target", label: "Capacity", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Active", "At Risk", "Unavailable", "Lost"] },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "What this asset does for the organization" },
        ],
        template: {
          name: "",
          role: "Follower",
          secondary: "",
          progress: 0,
          target: 0,
          dc: 0,
          status: "Active",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Leadership is a long-term subsystem about building an organization and gaining followers over downtime and play.",
      "Organizations have levels, and growth comes from acquiring followers and infrastructure rather than from a VP track.",
      "By the mid levels of an organization, a base of operations becomes necessary unless the story strongly says otherwise.",
    ],
    runLoop: [
      "Set the organization's level, purpose, and current base of operations.",
      "Add followers and lieutenants as rewards for play, influence, reputation, or story developments.",
      "Update the roster and base notes whenever the organization gains new benefits or obligations.",
      "Raise the organization level when its actual structure and follower base justify it.",
    ],
    tips: [
      "This subsystem works best between adventures, but the roster is still useful during active play.",
      "Use notes to capture obligations, politics, and adventure hooks created by growth.",
    ],
  },
  {
    id: "hexploration",
    label: "Hexploration",
    eyebrow: "Exploration Subsystem",
    description: "Track route progress, explored hexes, discoveries, and the cadence of travel in the wild.",
    sourceHref: SOURCE_HREF,
    phases: ["Briefing", "Travel", "Discovery", "Camp"],
    metrics: [
      { key: "travelDay", label: "Travel Day", description: "Current day or watch of travel.", defaultValue: 1 },
      { key: "exploredHexes", label: "Explored Hexes", description: "Hexes fully explored so far.", defaultValue: 0 },
      { key: "discoveries", label: "Discoveries", description: "Interesting sites or revelations found.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "hexes",
        label: "Hexes & Discoveries",
        description: "Track routes, terrain, discoveries, and what remains unexplored.",
        addLabel: "Add Hex",
        emptyLabel: "No hexes yet. Add the route or map nodes you want to track.",
        fields: [
          { key: "name", label: "Hex", type: "text", placeholder: "B4" },
          { key: "role", label: "Terrain", type: "text", placeholder: "Forest, swamp, mountain" },
          { key: "progress", label: "Discoveries", type: "number", min: 0 },
          { key: "target", label: "Sites", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Unseen", "Entered", "Explored", "Dangerous"] },
          { key: "tags", label: "Features", type: "text", placeholder: "Road, ruin, lair, weather" },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Travel obstacles, clues, encounter seeds" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 1,
          dc: 0,
          status: "Unseen",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Hexploration is about discovery and route choice, not just counting miles.",
      "Each hex should give the party a sense that exploration decisions matter, with secrets, risks, and landmarks.",
      "Track both what the party has entered and what they have fully explored, because those are not always the same.",
    ],
    runLoop: [
      "Lay out the travel area, key terrain, and what each hex can reveal.",
      "Advance the travel day as the party chooses routes and enters new hexes.",
      "Change a hex from unseen to entered to explored as the party spends time there.",
      "Use notes to preserve what the party learned so returning to a hex stays fast to run.",
    ],
    tips: [
      "A small number of meaningful hexes is better than a giant empty spreadsheet.",
      "Use the discoveries metric as a quick reward pulse for the expedition.",
    ],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    eyebrow: "Vehicle Subsystem",
    description: "Track vehicles, pilots, crew jobs, and the mechanical state of each vehicle during travel or action scenes.",
    sourceHref: SOURCE_HREF,
    phases: ["Boarding", "Control", "Maneuvers", "Aftermath"],
    metrics: [
      { key: "currentRound", label: "Round", description: "Round or interval while the vehicle scene is active.", defaultValue: 1 },
      { key: "speed", label: "Current Speed", description: "The vehicle's current speed or speed band.", defaultValue: 0 },
      { key: "crewActions", label: "Crew Actions", description: "Track how many crew tasks are still unresolved this round.", defaultValue: 0 },
    ],
    collections: [
      {
        key: "vehicles",
        label: "Vehicles & Crew",
        description: "Track the active vehicles, their pilots, and their current conditions.",
        addLabel: "Add Vehicle",
        emptyLabel: "No vehicles yet. Add the vehicle or convoy in play.",
        fields: [
          { key: "name", label: "Vehicle", type: "text", placeholder: "Sky barge" },
          { key: "role", label: "Pilot / Crew", type: "text", placeholder: "Pilot, gunner, crew assignments" },
          { key: "progress", label: "HP", type: "number", min: 0 },
          { key: "target", label: "Hardness / Cap", type: "number", min: 0 },
          { key: "dc", label: "Piloting DC", type: "number", min: 0 },
          { key: "status", label: "State", type: "select", options: ["Ready", "Moving", "Uncontrolled", "Broken", "Stopped"] },
          { key: "tags", label: "Stats", type: "text", placeholder: "Crew, passengers, speed, heading" },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Reckless actions, hazards, terrain, cargo" },
        ],
        template: {
          name: "",
          role: "",
          secondary: "",
          progress: 0,
          target: 0,
          dc: 15,
          status: "Ready",
          notes: "",
          tags: "",
        },
      },
    ],
    rules: [
      "Vehicle scenes revolve around who is controlling the vehicle, what actions the pilot takes, and whether the vehicle remains under control.",
      "A vehicle can become uncontrolled when the pilot fails certain risky checks or when a round passes without the pilot taking the move action needed to control it or stop it.",
      "Reckless maneuvers can succeed spectacularly but can also send the vehicle drifting and uncontrolled on a failure.",
    ],
    runLoop: [
      "Set the active vehicle, pilot, crew assignments, and starting speed.",
      "Track each round's piloting and crew actions before changing the speed or state.",
      "If the pilot fails a reckless maneuver or loses the controls, flip the vehicle to uncontrolled immediately.",
      "Use notes to track heading, hazards, and environmental complications that are too situational for a fixed field.",
    ],
    tips: [
      "For simple travel, only use the notes and state fields; save the full tracker for dramatic scenes.",
      "If several vehicles matter, add one row per vessel and keep the shared scene metrics above them.",
    ],
  },
];

export function createInitialSubsystemRunnerState(): SubsystemRunnerState {
  const workspaces = PF2E_SUBSYSTEMS.reduce<Record<SubsystemId, SubsystemWorkspace>>(
    (accumulator, definition) => {
      accumulator[definition.id] = {
        title: definition.label,
        phase: definition.phases[0] ?? "Setup",
        round: 1,
        notes: "",
        gmNotes: "",
        metrics: Object.fromEntries(
          definition.metrics.map((metric) => [metric.key, metric.defaultValue]),
        ),
        collections: Object.fromEntries(
          definition.collections.map((collection) => [collection.key, []]),
        ),
      };
      return accumulator;
    },
    {} as Record<SubsystemId, SubsystemWorkspace>,
  );

  return {
    selectedSubsystemId: "victory-points",
    workspaces,
  };
}

export function getSubsystemDefinition(subsystemId: SubsystemId) {
  return PF2E_SUBSYSTEMS.find((definition) => definition.id === subsystemId) ?? PF2E_SUBSYSTEMS[0];
}

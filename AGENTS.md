# TTRPG Tools Project Guide

## Purpose

This repository is for AI-assisted tools that help tabletop RPG game masters prepare and run games.

The first tool is a **session planning tool**. It takes a short description of an upcoming session and a target session length, then generates a practical session prep document in the style of the Lazy GM / Lazy Dungeon Master approach.

## Canonical Goal For V1

Build a tool that helps a GM go from a rough idea to a useful prep document quickly.

The generated output should:

- be easy to skim at the table
- emphasize actionable prep over lore dumping
- scale to the available session time
- follow the well-known eight-step Lazy GM prep structure
- remain system-flexible where possible

## Product Principles

- Prep for play, not for fiction completeness.
- Optimize for usefulness at the table.
- Prefer concise bullets over long paragraphs.
- Generate ingredients for improvisation, not a rigid script.
- Scale prep to the requested session length.
- Keep the workflow friendly for both experienced GMs and new GMs.

## Planning Workflow Requirement

Before generating a final session plan, the tool must ask clarifying questions.

Requirements:

- always ask at least `10` clarifying questions
- never ask more than `20` clarifying questions
- prioritize questions that materially improve session quality, pacing, continuity, and system fit
- if the user leaves some questions unanswered, proceed with reasonable assumptions and state them briefly
- do not draft, outline, or generate the session plan until after the GM has had a chance to answer the clarifying questions
- treat the clarifying phase as a collaborative writers-room step where the GM can steer direction, constraints, reveals, pacing, and desired ending beats
- during the clarifying phase, prefer gathering and organizing the GM's intent over filling gaps with speculative content
- after the GM answers, synthesize those answers into explicit assumptions before writing the plan

## Corona Eclipsa File Roles And UI Rules

When working in `games/corona-eclipsa`, treat the markdown files as both campaign source material and app-facing content.

### File roles

- `GAME.md`
  - game-wide defaults, system assumptions, durable planner rules, campaign overview, and table procedures
- `continuity/`
  - canonical truth that persists across sessions
  - reusable NPC, faction, lore, and party files
- `plans/`
  - session-specific prep meant to run at the table
  - should be optimized for skimability, scene flow, and immediate use
  - also includes `session-arc-history.md`, which is session-facing historical context rather than continuity canon
- `references/`
  - supporting notes, character-specific material, and handout-style lore that may be helpful but are not always primary canon

### UI-aware markdown rules

- the first `#` heading becomes the document title in the web UI
- markdown headings drive section navigation and sidebar trees
- internal `.md` links with optional `#section` anchors should remain valid when possible
- inline backticks are clickable lookup chips in the UI and should be reserved for useful search targets
- good backtick targets include:
  - NPC names
  - factions
  - locations
  - organizations
  - notable items
  - named magical concepts
  - gods
  - ships
  - unique creatures or threats
- avoid backticks for:
  - plain numbers
  - DCs
  - damage values
  - durations
  - action counts
  - generic system terms
  - long phrases used only for emphasis
- when emphasis is needed for non-searchable text, prefer `**bold**`, headings, tables, or plain prose over backticks

### Search and navigation expectations

- changing a heading can change its anchor, so do not rename headings casually in active docs
- use one consistent canonical name for the same person, place, faction, or item across files whenever practical
- session plans should share names with continuity docs so search and inline lookups produce strong results
- keep documents web-readable:
  - prefer short bullets over dense walls of text
  - use tables for compact reference data
  - use horizontal rules sparingly
  - keep read-aloud text short enough to scan aloud comfortably

## Expected Inputs

The tool should support these inputs for the session planner.

### Required Inputs

- `session_description`
  - Freeform text describing the upcoming session
  - May include campaign context, previous session summary, player goals, threats, factions, locations, or encounter ideas

- `session_duration`
  - A target play length
  - Should accept common formats like `2 hours`, `3h`, `150 minutes`, `2.5 hrs`

### Strongly Recommended Inputs

- `system`
  - Example: `D&D 5e`, `Pathfinder 2e`, `Shadowdark`, `Call of Cthulhu`

- `tone`
  - Example: `grim horror`, `heroic fantasy`, `political intrigue`, `heist`

- `party_summary`
  - Short description of the player characters, party goals, and unresolved hooks

- `previous_session_summary`
  - Short recap of what happened in the previous session

- `existing_characters`
  - Reusable definitions for player characters and recurring important characters from previous sessions

- `existing_secrets_and_clues`
  - Reusable unresolved or recurring secrets and clues from previous sessions

- `session_goal`
  - What the GM wants this session to accomplish

### Optional Inputs

- `campaign_context`
  - Current state of the world, story arc, important recent events

- `constraints`
  - Example: `avoid combat-heavy play`, `include a social encounter`, `one boss fight max`

- `must_include`
  - NPCs, locations, clues, factions, rewards, or scenes that must appear

- `must_avoid`
  - Content, pacing, themes, or specific story directions to exclude

- `prep_style`
  - Example: `minimal`, `standard`, `rich`

## Expected Outputs

The tool should output a session prep document in markdown.

### Output Characteristics

- one session plan per generation
- clear section headers
- concise bullets
- practical information first
- no filler prose unless needed for clarity
- suitable for printing, exporting, or table-side use
- continuity-aware when prior session data is available

### Required Output Metadata

The output should include:

- session title or working title
- normalized session duration
- optional system and tone labels if provided

### Required Core Sections

The tool should generate these eight sections based on the Lazy GM / Return of the Lazy Dungeon Master structure:

1. Characters
2. Strong Start
3. Scenes
4. Secrets and Clues
5. Fantastic Locations
6. Important NPCs
7. Monsters or Threats
8. Treasure / Rewards

## Detailed Lazy GM Format

This project should use the public eight-step Lazy GM prep structure as its canonical planning format.

Based on Sly Flourish's public articles and template, the working section model is:

- `Characters`
  - Brief reminders about the player characters
  - Relevant hooks, goals, tensions, or spotlight notes
  - This section is mainly used to anchor the rest of the prep around the party
  - Existing character definitions from previous sessions should be reused when available
  - Important new details should be added as the campaign continues instead of replacing prior continuity

- `Strong Start`
  - The opening moment, image, problem, confrontation, discovery, or event that kicks off the session
  - Should be immediate and table-usable
  - Should help the GM start the session without hesitation
  - Should include a recap of the previous session when prior-session context is available
  - The recap should usually be written as a couple of short paragraphs suitable for reading aloud at the start of the session
  - For `Corona Eclipsa`, the recap should always begin with `Last we left off, Corona Eclipsa....`

- `Scenes`
  - A list of likely scenes, beats, forks, complications, or encounter opportunities
  - These are potential scenes, not a fixed script
  - They should support improvisation rather than force a sequence
  - Session flow should generally move from scene to scene, with each scene giving the GM something active to play
  - Each prepared scene must include at least one of the following:
    - a meaningful player decision
    - real potential for things to go wrong
    - emotional impact
    - important information delivery
  - Strong scenes often include two or more of those elements
  - Scene prep should include enough likely scenes, forks, and fallback beats to fill the target session length without requiring filler
  - Each prepared scene should include a short read-aloud opener that helps the GM start the scene at the table
  - Each prepared scene should also include a clear hook that invites the players to engage, choose, react, investigate, or act
  - The read-aloud opener should establish the immediate fiction, tone, and pressure without being longer than the table needs
  - The hook should make it obvious why the players should start interacting now rather than waiting for more exposition
  - As a default pacing rule, prep roughly `3` scenes per hour of expected play
  - Common scene types include:
    - exploration
    - conversation
    - the party trying to reach consensus on a divisive choice
    - solving a riddle or puzzle
    - surviving a deadly trap
    - a low-difficulty combat encounter
  - A more difficult combat encounter can consume the space of roughly `2-6` scenes depending on complexity, terrain, enemy count, and table speed
  - For action scenes, use `the round structure`:
    - define what sets the stage for the action
    - include `3-5` possible complications that can emerge as play continues
  - Action scenes can include combat, chase, infiltration, stealth, escapes, or other pressure-driven situations
  - Combat should emerge from scenes and be prepped as an action scene rather than standing apart from the rest of the session
  - Example stage-setters:
    - a street fight
    - a rooftop chase
    - a stealth entry
    - a heist under disguise
  - Example complications:
    - a second boss phase
    - children playing in the street
    - an old friend recognizing a character during the job
    - a disguise that looks out of place

- `Secrets and Clues`
  - Important facts, revelations, clues, rumors, or truths the players may uncover
  - These should be portable and discoverable through multiple paths
  - The generator should avoid tying every secret to only one exact delivery method
  - Secrets and clues may be reused across sessions when they remain relevant

- `Fantastic Locations`
  - Memorable locations with evocative features
  - Locations should be easy for a GM to describe at the table
  - The emphasis is on vivid usable details, not encyclopedic setting text
  - Each location should begin with a quick "rendering" layer: the most noticeable details the GM would mention immediately
  - Each location should then provide deeper optional details to help improvise only if needed

- `Important NPCs`
  - Key NPCs the GM may need in the session
  - Each NPC should include a concise role, motivation, or recognizable trait
  - Each NPC should always include at least one physical or behavioral roleplay trait
  - Example traits include curling a lip, playing with hair, raising eyebrows, grimacing, tapping fingers, fidgeting, or avoiding eye contact

- `Monsters or Threats`
  - Likely foes, hazards, obstacles, clocks, pressures, or complications
  - This section should remain system-flexible
  - For non-combat-heavy games, this can include pressures and dangers beyond literal monsters
  - If literal enemies or combatants are included, each should come with a stat block or a system-appropriate stat-block equivalent

- `Treasure / Rewards`
  - Material rewards, narrative rewards, discoveries, leverage, or advancement hooks
  - Should fit the system and tone
  - Treasure and rewards should stay fairly close to the kinds of rewards available in the base game or core rules of the chosen system unless the user explicitly asks for something more unusual

## Important Format Notes

- The tool should **follow the structure faithfully** but does not need to imitate the source material word-for-word.
- The output should be an **original plan**, not a reproduction of a copyrighted template.
- Section names may stay close to the public eight-step names because those are functional labels, but generated content must be newly created for the user.
- The planner should support non-dungeon and non-fantasy sessions even if the source tradition emerged from fantasy RPG prep.

## Time-Scaling Rules

Session duration must meaningfully affect the output.

### Short Session

For roughly `1-2 hours`:

- fewer scenes
- tighter strong start
- fewer NPCs
- fewer locations
- limited reward complexity
- focus on one clear problem or turn

### Medium Session

For roughly `2.5-4 hours`:

- moderate scene list
- one or two meaningful pivots
- richer secrets and clues
- a few locations and NPCs
- enough material for flexible pacing

### Long Session

For roughly `4+ hours`:

- broader scene possibilities
- multiple pressure points
- more secrets and clues
- more robust location and NPC support
- clearer fallback material in case players move quickly

## Guardrails

### Content Guardrails

- Do not produce content that is needlessly graphic unless the user explicitly asks for horror detail.
- Avoid sexual violence content.
- Avoid hateful or demeaning stereotypes.
- Respect user-specified safety, content, or tone constraints.

### Design Guardrails

- Do not generate a railroaded sequence disguised as flexible prep.
- Do not overproduce lore that the GM cannot use at the table.
- Do not flood the output with too many NPCs, locations, or secrets for the target session length.
- Do not assume combat is always central.
- Do not assume D&D if the user specifies another system.
- Do not lose continuity for returning characters, unresolved clues, or prior session developments when that context is available.
- Do not create treasure that is wildly out of band for the chosen game's baseline unless the user explicitly requests it.
- Do not omit stat blocks for combat-ready enemies.

### UX Guardrails

- If inputs are incomplete, make reasonable assumptions and state them briefly.
- If the session description is vague, still produce a usable plan rather than refusing.
- Prefer a practical answer over a perfect answer.
- If prior session information exists, use it to maintain continuity.

## Domain Definitions

- `session_description`
  - The GM's rough brief for the next game session

- `session_plan`
  - The generated prep artifact for one upcoming play session

- `strong_start`
  - The opening event or situation that immediately engages the table
  - In this project, it should also bridge from the previous session by including recap context when available
  - In this project, the recap portion should normally be two short read-aloud paragraphs rather than a single bullet

- `scene`
  - A likely moment, beat, or situation that may occur, not a guaranteed sequence step

- `secret_or_clue`
  - Information worth discovering that can move the session forward or deepen the fiction

- `fantastic_location`
  - A location with memorable, table-usable descriptive hooks
  - In this project, it includes an immediate first-description rendering plus deeper optional details

- `important_npc`
  - An NPC likely to matter in the session because of influence, conflict, knowledge, or emotional weight
  - In this project, it always includes a roleplay-forward physical or behavioral trait

- `monster_or_threat`
  - A danger, obstacle, foe, faction pressure, or complication
  - In this project, literal enemies should include stat blocks or system-equivalent mechanics

- `treasure_or_reward`
  - Any meaningful payoff including items, money, favors, leverage, knowledge, allies, or progression
  - In this project, rewards should generally stay close to the chosen system's baseline reward structure

## Non-Goals For V1

- full campaign management
- tactical encounter balancing
- map generation
- character sheet management
- initiative or combat tracking
- VTT integration

## Recommended First Output Shape

The initial tool should render markdown like:

```md
# Session Plan: <title>

- Duration: <normalized duration>
- System: <system if provided>
- Tone: <tone if provided>

## Characters
...

## Strong Start
...

## Scenes
...

## Secrets and Clues
...

## Fantastic Locations
...

## Important NPCs
...

## Monsters or Threats
...

## Treasure / Rewards
...
```

## Implementation Guidance

- Prefer structured internal models even if the final output is markdown.
- Keep prompt templates versioned in the repo.
- Keep the format deterministic enough for testing.
- Make the generator system-aware but not system-locked.
- Favor a CLI-first implementation before building a UI.
- Model continuity explicitly so recurring characters, previous recaps, and reusable secrets can persist between sessions.
- Treat the clarifying-question phase as a first-class part of the workflow.

## Open Questions

- Should V1 return markdown directly or structured JSON plus a markdown renderer?
- Should section counts be hard-limited by duration?
- Should the tool support alternate prep styles later while keeping Lazy GM as the default?
- How closely should non-fantasy systems mirror the exact eight-section labels?

## Source Notes

The working eight-step structure and public markdown template are based on Sly Flourish's publicly available material, especially:

- the public eight-step descriptions on Sly Flourish
- the public markdown prep template page
- related articles explaining how the eight steps are used at the table

Use those as inspiration and structural grounding, but keep generated output original and practical.

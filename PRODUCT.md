# Session Planner Product Spec

## Purpose

This document shows how the session planner should work end to end.

It complements:

- [AGENTS.md](/Users/jake/git/ttrpg-tools/AGENTS.md)
- [SCHEMA.md](/Users/jake/git/ttrpg-tools/SCHEMA.md)

## Core User Story

As a GM, I want to provide a rough idea for an upcoming session and a target session length, answer a bounded set of clarifying questions, and receive a practical session plan in the Lazy GM format that matches the rules and reward structure of my chosen game.

## Product Constraints

- the planner must ask `10-20` clarifying questions before final generation
- the planner must stop after asking clarifying questions and wait for the GM's answers before drafting the session plan
- the clarifying step should function like a collaborative writers-room pass, helping the GM shape beats, reveals, pacing, constraints, and desired outcomes before generation
- once clarifying answers are received, the planner should restate the locked-in assumptions it will use for generation
- the planner must keep plans separated by game system
- the planner must load system-specific guidance from the selected game's definition folder
- the planner must not mix rules, monsters, treasure, or assumptions across game systems
- continuity should be reusable within a game line and campaign context

## Project Directory Standard

Plans and definitions should be separated by named game or campaign instance, not just by rules system.

Recommended structure:

```text
/Users/jake/git/ttrpg-tools/
  AGENTS.md
  PRODUCT.md
  SCHEMA.md
  session-planning-tool-plan.md
  games/
    home-game/
      GAME.md
      plans/
      continuity/
      references/
    corona-eclipsa/
      GAME.md
      plans/
      continuity/
      references/
```

## Game Separation Rules

The selected game folder is the source of truth for system behavior.

Rules:

- each generated plan belongs to exactly one game folder
- each game folder must have a `GAME.md`
- the planner must read the selected game's `GAME.md` before generation
- continuity records must remain within the same game folder
- default treasure, enemies, and rules assumptions must come from the selected game's definitions
- folder names represent named games or campaigns, not generic rules systems
- the actual rules system is defined inside `GAME.md`
- the planner must never pull D&D 5e rules into Pathfinder 2e output or vice versa

## Expected `GAME.md` Role

Each game's `GAME.md` should define:

- canonical game name
- system identifier
- style and tone defaults
- rules assumptions
- monster/stat block expectations
- reward and treasure expectations
- terminology conventions
- prohibited cross-system contamination

## Example End-To-End Workflow

### Step 1: Raw Intake

Example user input:

```json
{
  "session_description": "The party returns to the ruined abbey after learning the grave-keeper is secretly working for a local vampire cult. I want the session to focus on investigation, one tense social encounter, and possibly one short fight in the crypts.",
  "session_duration": "3.5 hours",
  "system": "dnd5e",
  "game_id": "home-game",
  "tone": "gothic mystery",
  "party_summary": "A cleric haunted by visions, a skeptical rogue, a young wizard obsessed with forbidden texts, and a ranger protecting the local village.",
  "previous_session_summary": "The party interrogated a smuggler, found a desecrated relic, and learned the abbey catacombs connect to old noble burial tunnels.",
  "session_goal": "Reveal the cult's immediate plan and set up a confrontation with the grave-keeper.",
  "constraints": [
    "Keep combat brief",
    "Give each character at least one spotlight moment"
  ],
  "must_include": [
    "the grave-keeper",
    "the abbey crypts",
    "a clue about the cult's next target"
  ],
  "must_avoid": [
    "large dungeon crawl"
  ],
  "prep_style": "standard",
  "existing_characters": [],
  "existing_secrets_and_clues": []
}
```

### Step 2: Clarifying Questions

Example question set:

1. What level is the party?
2. Is this session meant to end with a cliffhanger or a resolution?
3. How competent should the grave-keeper seem at first meeting?
4. Do you want the cult to feel subtle or openly threatening?
5. What kind of spotlight would best suit the cleric?
6. Should the crypt fight be undead, cultists, or environmental danger?
7. How lethal should the session feel?
8. Do you want any divine or prophetic imagery in the strong start?
9. Is the vampire cult already known to the players by name?
10. What kind of reward feels appropriate for this session?
11. Should the village feel safe, paranoid, or already compromised?
12. Do you want the noble burial tunnels to be a likely scene or a future hook?

This is valid because it stays within the required `10-20` range.

The planner should end this step by waiting for the GM's answers. It should not generate a draft session plan, outline, or partial scene list until those answers are provided or explicitly skipped.

### Step 3: Normalized Request

Example normalized values:

- duration: `210 minutes`
- duration bucket: `medium`
- system: `dnd5e`
- game id: `home-game`
- assumptions:
  - cult remains mostly covert
  - reward should be modest and rules-normal for the game
  - one combat encounter max

These assumptions should be presented back to the GM in a concise locked-in summary before or alongside final generation so the workflow feels collaborative rather than unilateral.

### Step 4: Structured Output

The planner should internally produce a structured `SessionPlan`.

### Step 5: Rendered Markdown

The final markdown should look like a table-usable prep sheet with the standard eight sections.

## Example Rendered Output Shape

```md
# Session Plan: Shadows Beneath the Abbey

- Game: D&D 5e
- Duration: 3 hours 30 minutes
- Tone: gothic mystery

## Characters
- Cleric: Haunted by visions tied to the desecrated relic. Spotlight: interpret a warning tied to the abbey dead.
- Rogue: Suspicious of the grave-keeper's story. Spotlight: notice a lie in the grave records.
- Wizard: Drawn to forbidden burial inscriptions. Spotlight: decode a hidden clue in the catacombs.
- Ranger: Focused on protecting the village. Spotlight: recognize signs that the cult has already marked another target.

## Strong Start
- Recap: The party interrogated a smuggler, found a desecrated relic, and learned the abbey catacombs connect to old noble burial tunnels.
- Opening: As dusk settles over the ruined abbey, the chapel bell rings once on its own and a freshly dug grave lies open beside a trail of wet soil leading toward the crypt door.

## Scenes
- Question the grave-keeper while he tries to appear helpful.
- Search the records chamber for burial inconsistencies.
- Descend into the crypts to confirm the cult's movements.
- Discover evidence naming the cult's next target.
- Brief confrontation with a crypt guardian or cult lookout.

## Secrets and Clues
- The cult is preparing to profane a noble tomb to recover a blood-bound relic.
- The grave-keeper is afraid of the cult and not fully loyal to them.
- The next intended victim is tied to the village's oldest family.

## Fantastic Locations
- Abbey Courtyard
  - Rendering: leaning saints, broken headstones, damp moss, and a grave pit still leaking black water.
  - Deeper details: fresh shovel marks, boot prints hidden under funeral wreaths, a cracked angel statue pointed toward the crypt stair.

## Important NPCs
- Edrin Voss, grave-keeper
  - Role: frightened accomplice
  - Motivation: survive without angering the cult
  - Trait: keeps curling his lip before answering difficult questions

## Monsters or Threats
- Crypt Ghoul
  - Stat block: use a ghoul from the base game with reduced numbers for a short encounter

## Treasure / Rewards
- A silver reliquary worth modest gold in the local market
- Burial records naming the cult's next target
- Favor from the village priest if the relic is recovered intact
```

## Game Folder Contract

Every supported game should have:

- `GAME.md`
- `plans/`
- `continuity/`
- `references/`

### `plans/`

Stores generated session plans for that game.

Suggested format:

```text
games/home-game/plans/2026-03-13-shadows-beneath-the-abbey.md
```

### `continuity/`

Stores reusable continuity data for the game and campaign.

Suggested files:

- `characters.json`
- `secrets-and-clues.json`
- `campaign-state.md`
- `previous-session.md`

### `references/`

Stores local notes or system references used by the planner.

## Game Selection Behavior

The planner should:

1. require a game selection or infer one carefully
2. load the matching named game's `GAME.md`
3. read the actual rules system from that file
4. reject or flag conflicting cross-system inputs
5. write the output only into that game's `plans/` area

## Cross-System Safety Rules

Examples of invalid mixing:

- using Pathfinder 2e treasure assumptions in D&D 5e
- using D&D 5e monster stat formatting in Pathfinder 2e
- mixing spell, action, or difficulty terminology between systems without user intent

If conflicting signals exist:

- ask clarifying questions
- do not silently blend systems

## Recommended V1 Persistence Pattern

Per game, store:

- current plans in `plans/`
- continuity state in `continuity/`
- system definitions in `GAME.md`

This is enough for continuity-aware planning without building a full campaign manager yet.

## Recommended Next Step

Implement the game definition format next so the planner knows how to behave differently for:

- `home-game`
- `corona-eclipsa`

# Game Definition: Daggerheart

## System Identifier

- `system_id`: `daggerheart`
- `display_name`: `Daggerheart`
- `game_id`: `daggerheart`
- `game_name`: `Daggerheart`

## Purpose

This file defines the assumptions the planner should use when generating session plans for the named game `daggerheart`.

The goal for this folder is to preserve the same prep discipline used for `Corona Eclipsa` while shifting the game assumptions to Daggerheart:

- practical Lazy GM eight-step prep
- scene-first session design
- continuity-aware campaign organization
- a strong `5 Room Dungeon` story spine for each session when it fits

## Campaign Frame

- campaign type: original campaign
- planning model: Lazy GM / Return of the Lazy Dungeon Master eight-step structure
- scene model: prep should flow from scene to scene with flexible forks, not a rigid script
- session spine: use the `5 Room Dungeon` story structure as the default driver for session shape when practical
- continuity model: preserve durable canon in `continuity/` and keep session-specific material in `plans/`

## Source And Canon Rules

When working in this folder, use this source priority:

1. the GM's explicit instructions and current request
2. files in `continuity/` for established table canon
3. files in `plans/` for session-facing prep history
4. files in `references/` for supporting lore, brainstorms, and prep-adjacent material
5. general Daggerheart assumptions grounded in official materials

Important handling rules:

- keep anything world-specific, lore-specific, or campaign-specific out of `GAME.md`
- use this file for reusable planning principles, Daggerheart-facing assumptions, and campaign-agnostic prep guidance
- when campaign canon hardens, move it into `continuity/`
- when an idea is interesting but not yet true, keep it in `references/`

## Canonical System Assumptions

For this game, the planner should assume:

- Daggerheart is the rules system
- uncertain outcomes are framed through the fiction first, then resolved with Daggerheart's core `Hope` / `Fear` dynamic
- session prep should give the GM strong opportunities to make soft and hard consequences matter
- scenes should encourage character-forward choices, emotional stakes, and changing momentum rather than static tactical slogs
- threats, rewards, fallout, and revelations should feel like they belong in Daggerheart rather than Pathfinder or D&D

## Session Planning Rules

- always begin session-planning work with a clarifying phase
- ask at least 10 clarifying questions and no more than 20 before drafting a session plan
- do not outline or draft the session plan until the GM has had a chance to answer those questions
- if some answers are missing, proceed with reasonable assumptions and state them briefly
- when notes exist in this game folder, use them to maintain continuity between sessions
- default pacing target is roughly 3 prepared scenes per hour of expected play, adjusted for heavy conflict or slower table pacing
- each prepared scene should include a short read-aloud opener and a clear player-facing hook
- action scenes should include a stage-setter and 3-5 likely complications when helpful
- every session should try to support multiple valid approaches rather than a single expected solution

## 5 Room Dungeon Driver

Use the `5 Room Dungeon` structure as the default session backbone whenever possible, even when the session is not a literal dungeon.

Treat the five rooms as story beats:

1. `Entrance and Guardian`
2. `Puzzle or Roleplaying Challenge`
3. `Trick or Setback`
4. `Climax, Big Battle, or Conflict`
5. `Reward, Revelation, or Plot Twist`

Guidance:

- these are pacing and pressure beats, not mandatory physical rooms
- a room can be a conversation, chase, travel obstacle, social gauntlet, dream, mystery breakthrough, heist layer, or battle
- a single room may contain more than one scene, and a large action scene may consume the space of multiple rooms
- if the fiction genuinely wants a different shape, bend the model rather than forcing it
- session prep should still make the five-beat arc visible when possible so the GM always has a usable dramatic spine

## Lazy GM Structure Requirement

Session plans should still use the repo's canonical eight sections:

1. `Characters`
2. `Strong Start`
3. `Scenes`
4. `Secrets and Clues`
5. `Fantastic Locations`
6. `Important NPCs`
7. `Monsters or Threats`
8. `Treasure / Rewards`

The `Scenes` section should usually show how the likely scenes map onto the `5 Room Dungeon` spine.

## Daggerheart Prep Bias

- prep for emotional momentum, not exhaustive simulation
- build situations that can swing on `Hope` and `Fear`
- give every major scene a concrete pressure, cost, temptation, or complication
- favor bold story movement over overbuilt lore dumps
- keep prep easy to scan at the table
- preserve room for collaborative story turns and surprising player authorship

## Terminology

Prefer terms like:

- `Hope`
- `Fear`
- `Stress`
- `HP`
- `Difficulty`
- `Thresholds`
- `Experience`
- `spotlight`
- `GM move`
- `soft move`
- `hard move`
- `adversary`

Avoid importing Pathfinder 2e or D&D 5e terminology unless the GM explicitly asks for conversion.

## Threat And Stat Expectations

- combat-ready enemies should have Daggerheart-usable adversary stats or clear base-game-equivalent references
- when possible, present adversaries in a Daggerheart-friendly format with role, motives or tactics, `Difficulty`, `Thresholds`, `HP`, `Stress`, attacks, and notable features
- threats may also include hazards, clocks, collapsing situations, social pressure, dangerous bargains, corruption, unstable magic, pursuit, or environmental danger
- do not assume every threat becomes a fight
- when conflict is likely, prep should make it easy for the GM to escalate with `Fear`, spotlight shifts, and fiction-first consequences

## Reward Expectations

- rewards should feel plausible for Daggerheart's tone and progression
- prefer rewards such as meaningful items, allies, sanctuary, leverage, revelations, map access, favors, domain-relevant opportunities, or lasting changes in the fiction
- keep material rewards grounded in the campaign's scale instead of importing Pathfinder-style wealth expectations
- the reward at the end of a session may also be a twist, cost, or new burden, especially when that makes the story stronger

## Scene Design Rules

Each prepared scene must include at least one of the following:

- a meaningful player decision
- real potential for things to go wrong
- emotional impact
- important information delivery

Strong scenes usually include two or more.

Each prepared scene should also include:

- a short read-aloud opener
- a clear hook that invites immediate action
- visible pressure or uncertainty
- at least one way the outcome could produce `Hope`, `Fear`, or a strong GM move

## Strong Start Guidance

- begin with a situation already in motion
- start near pressure, discovery, danger, or difficult choice
- when prior-session context exists, include a brief recap suitable for reading aloud
- keep the opening concrete enough that the GM can begin play without hesitation

## Secrets And Clues Guidance

- keep secrets portable
- do not lock essential revelations behind one exact scene or one exact roll
- let clues travel through NPCs, locations, consequences, journals, dreams, enemy behavior, rumors, or aftermath
- prefer revelations that change choices, stakes, or understanding at the table

## Important NPC Guidance

- each important NPC should include role, motivation, and at least one physical or behavioral roleplay trait
- NPCs should be easy to improvise in one glance
- when useful, note what they want right now, what they fear, and how they apply pressure

## Fantastic Location Guidance

- locations should be vivid, brief, and playable
- each location should begin with an immediate rendering layer
- follow with optional deeper details the GM can pull from if the scene lingers
- locations should support scene action, not just atmosphere

## File Usage Guidance

- use `continuity/` for table canon, durable NPCs, factions, locations, party state, and lasting truths
- use `plans/` for session prep documents and `session-arc-history.md`
- use `references/` for worldbuilding notes, loose ideas, imported inspiration, lore fragments, and material not yet promoted into canon

## Output Style

- practical prep first
- concise bullets over paragraphs
- skimmable at the table
- original wording, not reproduced templates
- continuity-aware
- system-aware without becoming rules-bloated

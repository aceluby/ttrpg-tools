# Spearhead Next.js App Plan

- Status: Draft for review
- Game: `Warhammer Age of Sigmar: Spearhead`
- App type: local-first `Next.js` game runner
- Repo target: `games/spearhead/web`

## Goal

Build a Next.js app that lets a user:

1. Select two `Spearhead` armies.
2. Press `Run Game`.
3. Enter the required setup and turn-order inputs.
4. Step through pre-battle setup, battle round start, both player turns, scoring, and end-of-game across all 4 battle rounds.
5. Click any selected unit to see its rules quickly during play.

The app should feel like a referee console: one screen, clear progression, easy correction, and no guessing about what comes next.

## Rules Basis

This plan is based on the official `Warhammer Age of Sigmar` downloads page and the official `Spearhead Reference` PDF the user supplied:

- [Warhammer Age of Sigmar Downloads](https://www.warhammer-community.com/en-gb/downloads/warhammer-age-of-sigmar/)
- [Spearhead Reference PDF](https://assets.warhammer-community.com/ageofsigmar_corerules%26keydownloads_spearheadreferece_eng_24.09-jrpbcnzwuu.pdf)

The reference PDF confirms key flow elements the app should model:

- pre-battle sequence with attacker/defender decisions
- deployment flow
- battle round start sequence
- battle tactic card draw rules
- priority / going first handling
- victory point scoring at end of turn
- 4-round Spearhead structure
- core turn phases: start of turn, hero, movement, shooting, charge, combat, end of turn

## Product Shape

V1 should be a guided game runner, not a full army builder, not a VTT, and not a rules replacement.

V1 supported Spearheads:

- `Stormcast Eternals: Vigilant Brotherhood`
- `Skaven: Gnawfeast Clawpack`
- `Maggotkin of Nurgle: Bleak Host`
- `Soulblight Gravelords: Bloodcrave Hunt`
- `Sons of Behemat: Wallsmasher Stomp`

The app should:

- provide the exact game checklist in app order
- track round, turn, initiative, underdog, twist, battle tactics, reinforcements, and score
- show selected army summaries and unit drilldowns
- surface the rules needed for the current step
- preserve game state locally so a game can be resumed

The app should not try to:

- measure distances
- enforce line of sight
- calculate every attack roll automatically
- recreate official PDFs wholesale
- support every AoS format outside `Spearhead`

## User Experience

### Primary Flow

1. Open app.
2. Choose `Army A` and `Army B`.
3. Review both Spearhead force summaries.
4. Click `Run Game`.
5. Complete pre-battle prompts in order.
6. Enter round-by-round decisions and outcomes.
7. Use the current phase checklist to run the game.
8. Click units, abilities, or reference chips to inspect rules.
9. Finish round 4 and view winner, score log, and battle summary.

### Core Screens

### 1. Home / Match Setup

- army picker for both players
- quick army summaries
- validation that both armies are selected
- `Run Game` CTA

### 2. Game Runner

Single primary workspace with:

- header: armies, current round, active player, score
- left rail: round/turn timeline
- center: current checklist and action controls
- right rail: selected unit, rule reference, twist/tactic context

### 3. Army / Unit Reference

- searchable unit list for each chosen army
- warscroll summary cards
- phase-tagged abilities
- quick links to official source PDFs

### 4. Post-Game Summary

- final VP totals
- round-by-round scoring breakdown
- who went first each round
- completed battle tactics
- reinforcements used

## Recommended Information Architecture

### App Sections

- `Setup`
- `Game`
- `Reference`
- `History`

### URL Model

- `/` setup screen
- `/game/[matchId]` active game runner
- `/reference/[armySlug]` army reference
- `/reference/[armySlug]/[unitSlug]` unit details

### Game Runner Design

The runner should be driven by an explicit state machine instead of loose page state.

Top-level game states:

- `setup`
- `preBattle`
- `deployment`
- `battleRoundStart`
- `playerTurn`
- `roundScoring`
- `gameOver`

Nested turn phases:

- `startOfTurn`
- `hero`
- `movement`
- `shooting`
- `charge`
- `combat`
- `endOfTurn`

This gives the app a reliable way to:

- show only the current checklist
- permit backtracking when a mistake is corrected
- keep score and card flow in sync
- support resume-after-refresh

## Exact Gameplay Flow To Model

### Pre-Battle

The app should guide the user through these items in order:

1. Roll off.
2. Mark `attacker` and `defender`.
3. Record regiment ability and enhancement choices.
4. Record defender battlefield side choice.
5. Record defender deployment map choice and territory choice.
6. Place defender terrain pieces.
7. Place attacker terrain pieces.
8. Deploy attacker army.
9. Deploy defender army.
10. Start battle round 1.

Each step should have:

- a short instruction
- fields or toggles for the decision
- a `Complete Step` button
- an expandable `Why this matters` rules note when useful

### Start Of Battle Round

For each round, the app should walk through:

1. Determine who takes first turn.
   Round 1: attacker chooses.
   Later rounds: priority roll.
2. Determine underdog.
3. Draw or reveal twist card.
4. Manage battle tactic cards.
5. Resolve start-of-battle-round abilities.

The app should log these as durable round metadata.

### Each Player Turn

For each player turn, the app should present a phase checklist with exact order:

1. Start of Turn
2. Hero Phase
3. Movement Phase
4. Shooting Phase
5. Charge Phase
6. Combat Phase
7. End of Turn

Each phase panel should contain:

- the phase purpose in one sentence
- the common core actions available in that phase
- selected-army abilities tagged for that phase
- a place to mark actions done
- a note area for outcomes

### End Of Turn Scoring

At the end of each turn, the app should prompt for and calculate:

- controls at least 1 objective
- controls 2 or more objectives
- controls more objectives than opponent
- completed battle tactics this turn

The scoring UI should show both:

- raw inputs
- computed VP gain for the turn

### End Of Game

After round 4:

- stop progression automatically
- show final score
- show winner
- preserve a match log

## Phase-Level UX Details

### Start Of Turn

Show:

- active player
- current score
- current twist
- current battle tactics in hand
- reminder chips for phase-start abilities

### Hero Phase

Show:

- army-specific hero abilities available now
- once-per-turn reminders
- selected unit detail panel

### Movement Phase

Show:

- `Normal Move`
- `Run`
- `Retreat`
- `Call for Reinforcements`
- army movement abilities tagged to this phase

The app should let the user mark which unit used reinforcements and prevent a second use for that reinforcement slot.

### Shooting Phase

Show:

- eligible friendly units
- weapon summaries
- weapon ability callouts such as critical effects or `Shoot in Combat`

### Charge Phase

Show:

- eligible chargers
- charge reminders
- reactions / triggered abilities if they exist in chosen armies

### Combat Phase

Show:

- units in combat or that charged
- fight order notes
- pile-in reminder
- quick jump to melee profiles

### End Of Turn

Show:

- score prompt
- unresolved end-of-turn abilities
- turn summary notes
- `End Turn` confirmation

## Rules And Data Strategy

### Guiding Principle

Store structured metadata and full local warscroll text for the five supported V1 Spearheads so the app can function as a table-side reference for personal local use.

### Data Sources

V1 should pull from curated local data files derived from official downloads:

- Spearhead reference flow data
- army pack metadata
- warscroll/unit metadata
- full warscroll text for supported units
- links to official faction PDFs and updates

Recommended local content types:

- `armies.json`
- `units/*.json`
- `abilities/*.json`
- `rules/phase-checklists.ts`
- `rules/battle-round.ts`

### Army Data Model

Each army should include:

- `id`
- `name`
- `faction`
- `sourcePdfUrl`
- `versionLabel`
- `units`
- `enhancements`
- `regimentAbilities`
- `battleTraits`

### Unit Data Model

Each unit should include:

- `id`
- `name`
- `keywords`
- `move`
- `health`
- `save`
- `control`
- `weapons`
- `abilities`
- `phaseTags`
- `reinforcementEligible`
- `sourcePdfUrl`
- `sourcePage`

### Match State Model

Each match should track:

- selected armies
- current round
- active player
- attacker / defender
- first player by round
- underdog by round
- twist by round
- battle tactic hand by player and round
- completed tactics
- reinforcements used
- score log
- notes log

## Technical Plan

### Stack

Use the same baseline as the existing repo web app:

- `Next.js 16`
- `React 19`
- `TypeScript`
- App Router
- Tailwind 4

### App Structure

Suggested folders:

- `src/app/`
- `src/components/game-runner/`
- `src/components/reference/`
- `src/lib/spearhead-data/`
- `src/lib/game-state/`
- `src/lib/rules/`
- `src/app/api/` for optional import/export later

### State Management

Recommended approach:

- server components for initial data load
- client state machine for active match flow
- `localStorage` persistence in V1
- optional export/import JSON for match saves in V1.1

Good candidates:

- reducer + typed events, or
- `xstate` if we want stricter transition guarantees

For this app, a typed reducer is likely enough unless we expect heavy branching soon.

### Key Components

- `ArmySelector`
- `MatchSummaryCard`
- `RunGameButton`
- `GameRunnerShell`
- `RoundTimeline`
- `PhaseChecklist`
- `StepActionCard`
- `ScoreTracker`
- `BattleTacticHand`
- `TwistCardPanel`
- `UnitDrawer`
- `RulesReferencePanel`

### Accessibility And Table Use

The app should be optimized for laptop and tablet use at the table:

- large hit targets
- strong contrast
- sticky current-step panel
- keyboard-friendly step navigation
- print-friendly match summary

## Implementation Phases

### Phase 1: Foundation

- scaffold `games/spearhead/web`
- add app shell and visual theme
- add army selection screen
- define TypeScript data models
- create sample data for 2 armies

### Phase 2: Rules Runner

- implement pre-battle sequence
- implement round and turn state machine
- implement phase checklist UI
- implement scoring engine
- implement round 1 through round 4 flow

### Phase 3: Reference Layer

- add unit drawer and searchable unit list
- add phase-tagged ability display
- add source PDF links
- add reinforcement and tactic helpers

### Phase 4: Polish

- save and resume matches
- add post-game summary
- improve mobile/tablet layout
- add validation and guardrails for missed steps

## Risks And Decisions To Confirm

- storing full warscroll text locally is a deliberate V1 choice for personal-use lookup convenience, so we should keep the source/version metadata explicit for each imported rules file
- army pack updates and errata will change over time, so data files need a version field and easy refresh workflow
- battle tactics and twist handling will be manual because the user has the physical decks, so the app should focus on prompts, logging, and reminders rather than deck simulation

## Recommendation

Ship V1 with:

- 5 supported Spearhead armies
- full 4-round guided game flow
- score tracking
- reinforcements tracking
- full warscroll drilldown for supported units
- manual twist and battle tactic logging
- source links to official rules and update packs

Then expand army coverage after the runner UX is proven.

## Suggested First Build Backlog

1. Scaffold `games/spearhead/web` using the repo’s existing Next.js conventions.
2. Create structured data for the five chosen Spearheads.
3. Build the pre-battle and battle-round state machine.
4. Build the per-turn phase checklist runner.
5. Add scoring, manual tactics/twist logging, and reinforcement tracking.
6. Add searchable unit reference panels with full warscroll text.
7. Add save/resume and post-game summary.

## Confirmed Product Decisions

- V1 supports these five Spearheads only:
  `Stormcast Eternals: Vigilant Brotherhood`, `Skaven: Gnawfeast Clawpack`, `Maggotkin of Nurgle: Bleak Host`, `Soulblight Gravelords: Bloodcrave Hunt`, and `Sons of Behemat: Wallsmasher Stomp`
- Unit reference should include full local warscroll text for supported armies
- Battle tactic and twist handling should be manual because physical decks are used at the table

## Implementation Backlog

This backlog turns the plan into an execution sequence with milestones, concrete deliverables, and first tasks.

## Milestone 0: Project Setup

Goal: create the app shell and lock in repo conventions before feature work starts.

Deliverables:

- `games/spearhead/web` exists as a Next.js app
- base TypeScript, ESLint, Tailwind, and App Router setup is working
- the app starts locally and renders a branded placeholder home screen
- a local `AGENTS.md` exists for app-specific working rules if needed

Tasks:

- scaffold a new Next.js app in `games/spearhead/web`
- align package versions and config style with `games/corona-eclipsa/web`
- add a basic app layout, global styles, and page shell
- choose a visual direction appropriate for `Spearhead`
- add a short `README.md` for local run instructions

Acceptance criteria:

- `npm run lint` passes
- `npm run build` passes
- the home page renders with a stable app shell

## Milestone 1: Rules Data Foundation

Goal: define the data model and get the first supported rules content into the repo in a structured way.

Deliverables:

- TypeScript types for armies, units, weapons, abilities, and match state
- structured data for all five supported Spearheads
- source metadata captured for each imported rules file
- a small rules utility layer for phase and scoring logic

Tasks:

- define `ArmyDefinition`, `UnitDefinition`, `WeaponProfile`, `AbilityDefinition`, and `MatchState` types
- create local data files for:
  - `Stormcast Eternals: Vigilant Brotherhood`
  - `Skaven: Gnawfeast Clawpack`
  - `Maggotkin of Nurgle: Bleak Host`
  - `Soulblight Gravelords: Bloodcrave Hunt`
  - `Sons of Behemat: Wallsmasher Stomp`
- store full warscroll text with version labels and source links
- add a normalized phase-tag system for abilities
- encode Spearhead round flow, end-of-turn scoring, and reinforcement rules in reusable helpers

Acceptance criteria:

- app can load all five armies from local data
- each unit has searchable name, rules text, and source metadata
- core scoring helpers have tests

## Milestone 2: Army Selection And Match Creation

Goal: let a user start a real game with two supported armies.

Deliverables:

- home screen with two army selectors
- matchup summary view
- `Run Game` action that creates a new match record
- match persistence bootstrap

Tasks:

- build `ArmySelector`
- build `MatchSummaryCard`
- validate army selection before allowing start
- generate `matchId`
- initialize default match state in local storage
- route to `/game/[matchId]`

Acceptance criteria:

- user can select any two of the five supported Spearheads
- clicking `Run Game` creates a resumable match
- refresh does not lose the initialized match

## Milestone 3: Pre-Battle Runner

Goal: guide the user through setup without missing required Spearhead steps.

Deliverables:

- pre-battle checklist UI
- attacker/defender flow
- terrain and deployment tracking
- round 1 handoff into the game runner

Tasks:

- build `GameRunnerShell`
- build `StepActionCard`
- build pre-battle step list from structured rules data
- add controls for roll-off outcome, attacker/defender assignment, territory choice, and deployment map selection
- add fields for regiment ability and enhancement selection
- add completion tracking and step locking

Acceptance criteria:

- user can complete setup in order
- state persists across refresh
- app transitions into battle round 1 cleanly

## Milestone 4: Battle Round Engine

Goal: model the 4-round Spearhead flow accurately and transparently.

Deliverables:

- round start workflow
- turn order handling
- underdog and initiative tracking
- manual twist and battle tactic logging

Tasks:

- implement round state transitions
- add round 1 first-player selection
- add later-round priority roll entry
- add underdog calculation helper
- add manual twist logging UI
- add manual battle tactic hand and completion logging UI
- record round metadata in a durable match log

Acceptance criteria:

- app supports full progression from round 1 through round 4
- turn order for each round is visible in the timeline
- twist and battle tactic state are logged manually without simulating decks

## Milestone 5: Turn Phase Runner

Goal: make every player turn usable at the table with a clear phase-by-phase checklist.

Deliverables:

- phase runner for:
  - start of turn
  - hero phase
  - movement phase
  - shooting phase
  - charge phase
  - combat phase
  - end of turn
- current phase highlighting
- notes and completion tracking inside each phase

Tasks:

- build `RoundTimeline`
- build `PhaseChecklist`
- build phase-specific reminder blocks
- attach phase-tagged army and unit abilities to each phase view
- allow quick switching to selected unit details from any phase
- add `End Turn` and `Next Phase` transitions with safe confirmation where needed

Acceptance criteria:

- a player can run a full turn from start to end in the app
- phase transitions are explicit and reversible
- currently relevant abilities are visible in context

## Milestone 6: Scoring, Reinforcements, And Match Log

Goal: handle the table-side bookkeeping that is easiest to forget during play.

Deliverables:

- end-of-turn scoring calculator
- reinforcement usage tracking
- per-turn and per-round log
- final game result computation

Tasks:

- build `ScoreTracker`
- add toggles for objective-control scoring inputs
- add battle tactic completion scoring input
- compute and persist VP gains
- add reinforcement-eligible unit tracking
- prevent replacement of the same reinforcement slot twice
- add a compact event log for important decisions and score changes

Acceptance criteria:

- scores update correctly at each end of turn
- reinforcements cannot be marked twice for the same slot
- final winner is shown after round 4

## Milestone 7: Rules Reference Experience

Goal: make unit lookups fast enough to support play without leaving the app.

Deliverables:

- searchable army reference pages
- unit drawer/panel inside the game runner
- full warscroll text display
- weapon and ability breakdown UI

Tasks:

- build `RulesReferencePanel`
- build `UnitDrawer`
- build army reference routes
- add search and filtering by army and unit name
- show full warscroll text with source labels and page references where available
- highlight phase-relevant abilities when opened from the runner

Acceptance criteria:

- user can click any supported unit and see its rules quickly
- full warscroll text is available locally
- reference views work both in-match and standalone

## Milestone 8: Save/Resume And Post-Game Summary

Goal: make the app resilient for real table use over multiple sittings.

Deliverables:

- save/resume experience
- active and completed match list
- post-game summary screen
- exportable match history in JSON later if desired

Tasks:

- build local match index storage
- add resume entry point on home screen
- build `PostGameSummary`
- show score breakdown by round and turn
- show first-player history, twists logged, tactics logged, and reinforcements used

Acceptance criteria:

- a previously started match can be resumed from the home screen
- completed matches remain viewable
- post-game summary provides enough detail to reconstruct what happened

## First Coding Pass

If we start implementation next, the first pass should focus on the smallest vertical slice that proves the architecture:

1. Scaffold `games/spearhead/web`.
2. Add the shared app shell and home screen.
3. Add structured army data for two armies first, then expand to all five.
4. Implement match creation and local persistence.
5. Implement the pre-battle runner.
6. Implement round 1 start and one full player turn with phase navigation.
7. Add unit lookup drawer for the selected armies.

That slice would prove:

- the data model
- the reducer/state machine
- the core UI shell
- the rules reference pattern
- local persistence

## Suggested File Layout

```text
games/spearhead/web/
  package.json
  README.md
  src/
    app/
      layout.tsx
      page.tsx
      game/[matchId]/page.tsx
      reference/[armySlug]/page.tsx
      reference/[armySlug]/[unitSlug]/page.tsx
    components/
      army-selector.tsx
      match-summary-card.tsx
      game-runner-shell.tsx
      round-timeline.tsx
      phase-checklist.tsx
      step-action-card.tsx
      score-tracker.tsx
      battle-tactic-panel.tsx
      twist-panel.tsx
      rules-reference-panel.tsx
      unit-drawer.tsx
      post-game-summary.tsx
    lib/
      spearhead-data/
        armies.ts
        stormcast-vigilant-brotherhood.ts
        skaven-gnawfeast-clawpack.ts
        maggotkin-bleak-host.ts
        soulblight-bloodcrave-hunt.ts
        sons-wallsmasher-stomp.ts
      game-state/
        match-reducer.ts
        match-types.ts
        match-storage.ts
      rules/
        phase-checklists.ts
        scoring.ts
        rounds.ts
```

## Task Breakdown For The Very First Session

If we want a clean first implementation session, the best initial task list is:

1. Scaffold the new Next.js app in `games/spearhead/web`.
2. Copy over and adapt baseline config from `games/corona-eclipsa/web` where helpful.
3. Create shared types for armies, units, and matches.
4. Enter one complete army data file end-to-end.
5. Build the home page with two selectors and a disabled `Run Game` button.
6. Add local match creation and route into `/game/[matchId]`.
7. Render a placeholder runner page that shows selected armies and empty round state.

## Open Build Choices

These do not block implementation, but we should settle them while building:

- whether to use a reducer only or move straight to `xstate`
- whether match history lives only in `localStorage` or also in flat files later
- whether to support notes per phase only, or also per unit
- whether to add printable reference sheets in V1 or defer them

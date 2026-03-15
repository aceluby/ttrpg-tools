# Corona Eclipsa Campaign Canon Solidification Plan

Last updated: 2026-03-13

## Goal

Build a reusable campaign canon pack for `Corona Eclipsa` so future session planning, recap generation, and continuity tracking can rely on stable source files instead of scattered chat memory.

## Current State

Already captured:

- party continuity
- future character hooks
- first-pass campaign knowledge

Still missing or incomplete:

- full NPC and faction canon
- arc-level session history across roughly 30 sessions
- setting lore details beyond the current high-level summary
- custom rules and table procedures
- named locations, organizations, and magic concepts
- unresolved thread tracking by priority

## Output Files To Build

Create or expand these files under `games/corona-eclipsa/continuity/`:

- `campaign-knowledge.md`
  - high-level premise, regions, politics, antagonists, world truths
- `party-dossier.md`
  - stable PC continuity
- `future-hooks.md`
  - reveals, pressure points, and likely scene payoffs
- `npc-faction-dossier.md`
  - recurring NPCs, factions, loyalties, secrets, and roleplay hooks
- `session-arc-history.md`
  - compressed campaign timeline grouped into major arcs rather than 30 isolated session summaries
- `world-lore-dossier.md`
  - weave, beast magic, elderlings, dragons, hollowed, religion, geography, prejudice, prophecy
- `custom-rules-and-procedures.md`
  - house rules, exploration procedures, stealth changes, magic assumptions, death expectations
- `open-questions.md`
  - unresolved lore, uncertain names, contradictions, and items to confirm later

Optional structured mirrors if later tooling needs them:

- `npc-faction.snapshot.json`
- `session-arcs.snapshot.json`
- `world-lore.snapshot.json`
- `custom-rules.snapshot.json`

## Recommended Capture Order

### Phase 1: NPCs And Factions

Purpose:

- lock down the people and groups that drive play right now

Topics to capture:

- `Rhaegar`
- `Dorian`
- `the king`
- `the Zephandor princess`
- `the head magician`
- `the Corterie`
- `Cerres`
- `Wyll`
- any recurring villains, advisors, nobles, teachers, or commanders

For each NPC or faction, capture:

- role in the story
- public face
- true motive
- alliance structure
- what the party believes about them
- what is secretly true
- current status
- likely future use

### Phase 2: Session Arc History

Purpose:

- compress 30 sessions into a usable campaign history without drowning in detail

Method:

- break the campaign into 5-8 major arcs
- for each arc record:
  - arc title
  - start and end point
  - central conflict
  - key locations
  - key NPCs
  - major revelations
  - major losses or victories
  - unresolved consequences

Do not try to reconstruct every session equally.
Prefer major turning points and continuity-critical events.

### Phase 3: World Lore

Purpose:

- establish stable setting truths that future plans can rely on

Topics to capture:

- the `weave`
- beast magic
- elderlings
- dragons
- hollowed
- prophecy
- magic institutions
- regional culture
- class and political structure
- slavery in `Theaxios`
- beliefs and prejudices in `the Wild`

For each lore topic, capture:

- what common people believe
- what educated people believe
- what is actually true
- what remains unknown
- why it matters in play

### Phase 4: Custom Rules And Table Procedures

Purpose:

- preserve table-specific mechanics that affect prep and encounter design

Topics to capture:

- stealth and surprise procedure
- dungeon turn assumptions
- custom magic rules
- beast magic handling
- death and resurrection assumptions
- rarity or treatment of prophecy
- any homebrew ancestry, dragonblood, or elderling handling
- any important rulings that differ from baseline PF2e

For each rule, capture:

- rule name
- baseline expectation
- table modification
- why it exists
- what kinds of scenes it changes

### Phase 5: Open Questions And Canon Risks

Purpose:

- prevent uncertain details from being accidentally treated as fixed canon

Track:

- forgotten names
- partially remembered plot details
- intentional mysteries
- possible contradictions
- future reveals that should not be surfaced casually

## Interview Workflow

Use short question batches, preferably 2 questions at a time.

Recommended order for live capture:

1. NPCs and factions
2. session arcs
3. world lore
4. custom rules
5. open questions and cleanup

## Quality Bar

The canon pack should be:

- specific enough for future session prep
- brief enough to skim
- explicit about uncertainty
- separated into stable fact versus hidden truth
- written for reuse, not for prose elegance

## Rules For Future Updates

- update canon files after major revelations, deaths, betrayals, or political shifts
- preserve unknowns as unknowns rather than filling gaps with guesses
- prefer adding short bullet updates over rewriting entire files
- when a secret becomes public, update both the secret state and the public understanding section
- if a fact is inspired by source material but changed in play, record the campaign version only

## Immediate Next Step

Start Phase 1 by building `npc-faction-dossier.md` through a short interview in 2-question batches.

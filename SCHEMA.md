# Session Planner Schema

## Purpose

This document defines the implementation-facing schema for the TTRPG session planning tool.

It translates the project guide in [AGENTS.md](/Users/jake/git/ttrpg-tools/AGENTS.md) into concrete data contracts for:

- intake
- clarifying questions
- continuity memory
- normalized planning requests
- generated session plans

## Design Goals

- support a mandatory question phase before plan generation
- support continuity across sessions
- produce deterministic, testable section structures
- allow markdown rendering from structured data
- remain system-aware without hardcoding one game system

## Workflow Model

The planner should move through these stages:

1. raw intake
2. clarifying questions
3. normalized planning request
4. generated structured plan
5. markdown rendering
6. continuity updates for reuse in later sessions

## Top-Level Types

- `SessionPlanningIntake`
- `ClarifyingQuestion`
- `ClarifyingQuestionSet`
- `ClarifyingAnswers`
- `NormalizedSessionRequest`
- `SessionPlan`
- `ContinuitySnapshot`
- `ContinuityUpdate`

## Intake Schema

### `SessionPlanningIntake`

Raw user-provided request before questions are asked.

```json
{
  "session_description": "string",
  "session_duration": "string",
  "system": "string | null",
  "tone": "string | null",
  "party_summary": "string | null",
  "previous_session_summary": "string | null",
  "session_goal": "string | null",
  "campaign_context": "string | null",
  "constraints": ["string"],
  "must_include": ["string"],
  "must_avoid": ["string"],
  "prep_style": "minimal | standard | rich | null",
  "existing_characters": ["CharacterRecord"],
  "existing_secrets_and_clues": ["SecretClueRecord"]
}
```

### Field Notes

- `session_description`
  - required
  - freeform seed description for the planned session

- `session_duration`
  - required
  - raw user-entered duration string that will later be normalized

- `prep_style`
  - optional hint for output density
  - defaults to `standard`

## Clarifying Question Schema

The question phase is mandatory.

Rules:

- minimum `10` questions
- maximum `20` questions
- the tool should aim for the fewest questions that materially improve output quality

### `ClarifyingQuestion`

```json
{
  "id": "string",
  "category": "table | party | continuity | pacing | system | tone | content | structure | reward | encounter",
  "question": "string",
  "reason": "string",
  "required": "boolean",
  "priority": "high | medium | low"
}
```

### `ClarifyingQuestionSet`

```json
{
  "questions": ["ClarifyingQuestion"],
  "question_count": "number"
}
```

Constraints:

- `question_count >= 10`
- `question_count <= 20`

### `ClarifyingAnswers`

```json
{
  "answers": {
    "question_id": "string"
  },
  "unanswered_question_ids": ["string"],
  "assumptions_allowed": "boolean"
}
```

Implementation note:

- unanswered questions should not block generation
- unanswered areas should be represented in assumptions

## Normalized Request Schema

### `NormalizedDuration`

```json
{
  "raw_input": "string",
  "minutes": "number",
  "display": "string",
  "bucket": "short | medium | long"
}
```

Suggested bucket rules:

- `short`: `60-120` minutes
- `medium`: `150-240` minutes
- `long`: `241+` minutes

### `AssumptionRecord`

```json
{
  "topic": "string",
  "assumption": "string",
  "source": "default | inferred | unanswered_question"
}
```

### `NormalizedSessionRequest`

This is the main generation input after questions are processed.

```json
{
  "session_description": "string",
  "normalized_duration": "NormalizedDuration",
  "system": "string",
  "tone": "string | null",
  "party_summary": "string | null",
  "previous_session_summary": "string | null",
  "session_goal": "string | null",
  "campaign_context": "string | null",
  "constraints": ["string"],
  "must_include": ["string"],
  "must_avoid": ["string"],
  "prep_style": "minimal | standard | rich",
  "existing_characters": ["CharacterRecord"],
  "existing_secrets_and_clues": ["SecretClueRecord"],
  "clarifying_answers": {
    "question_id": "string"
  },
  "assumptions": ["AssumptionRecord"]
}
```

Normalization rules:

- `system` should default only when necessary
- defaults must be explicit in `assumptions`
- `prep_style` defaults to `standard`

## Continuity Schema

These records support reuse across sessions.

### `CharacterRecord`

```json
{
  "id": "string",
  "name": "string",
  "kind": "player_character | recurring_npc | faction_representative | other",
  "summary": "string",
  "goals": ["string"],
  "hooks": ["string"],
  "tensions": ["string"],
  "recent_changes": ["string"],
  "continuity_notes": ["string"]
}
```

### `SecretClueRecord`

```json
{
  "id": "string",
  "text": "string",
  "status": "unrevealed | partially_revealed | revealed | obsolete",
  "related_to": ["string"],
  "reuse_priority": "high | medium | low"
}
```

### `ContinuitySnapshot`

```json
{
  "characters": ["CharacterRecord"],
  "secrets_and_clues": ["SecretClueRecord"],
  "previous_session_summary": "string | null",
  "campaign_state_notes": ["string"]
}
```

### `ContinuityUpdate`

Produced after generating a session plan so continuity can be persisted.

```json
{
  "character_updates": ["CharacterRecord"],
  "secret_updates": ["SecretClueRecord"],
  "new_recap_seed": "string | null",
  "campaign_state_updates": ["string"]
}
```

## Session Plan Schema

### `SessionPlan`

```json
{
  "title": "string",
  "system": "string",
  "tone": "string | null",
  "duration": "NormalizedDuration",
  "assumptions": ["AssumptionRecord"],
  "characters": ["CharacterPlanEntry"],
  "strong_start": "StrongStartSection",
  "scenes": ["SceneEntry"],
  "secrets_and_clues": ["SecretCluePlanEntry"],
  "fantastic_locations": ["LocationEntry"],
  "important_npcs": ["NpcEntry"],
  "monsters_or_threats": ["ThreatEntry"],
  "treasure_rewards": ["RewardEntry"]
}
```

## Section Schemas

### `CharacterPlanEntry`

```json
{
  "name": "string",
  "kind": "player_character | recurring_npc | faction_representative | other",
  "summary": "string",
  "current_hook": "string | null",
  "spotlight_note": "string | null",
  "updated_details": ["string"]
}
```

Rules:

- reuse existing character definitions when available
- add new details in `updated_details`
- do not silently discard old continuity

### `StrongStartSection`

```json
{
  "previous_session_recap": {
    "paragraphs": ["string"]
  },
  "opening_situation": "string",
  "immediate_pressure": "string | null",
  "why_it_grabs_attention": "string | null"
}
```

Rules:

- include `previous_session_recap` when prior-session context exists
- `previous_session_recap.paragraphs` should usually contain `2` short paragraphs suitable for reading aloud
- `opening_situation` should be actionable and table-usable

### `SceneEntry`

```json
{
  "name": "string",
  "purpose": "string",
  "likely_trigger": "string | null",
  "complication": "string | null",
  "pacing_weight": "light | medium | heavy",
  "required": "boolean"
}
```

Rules:

- scenes are flexible possibilities, not a fixed script
- count should scale with session duration

### `SecretCluePlanEntry`

```json
{
  "text": "string",
  "delivery_paths": ["string"],
  "reused_from_continuity": "boolean",
  "importance": "high | medium | low"
}
```

Rules:

- each clue should support multiple delivery paths when possible
- previously known unresolved clues can be reused

### `LocationEntry`

```json
{
  "name": "string",
  "purpose": "string",
  "rendering": ["string"],
  "deeper_details": ["string"],
  "interactive_features": ["string"]
}
```

Rules:

- `rendering` is the immediate sensory description layer
- `deeper_details` is optional follow-up material for improvisation
- `rendering` should be short and memorable

### `NpcEntry`

```json
{
  "name": "string",
  "role": "string",
  "motivation": "string",
  "physical_or_behavioral_trait": "string",
  "voice_or_manner_note": "string | null",
  "connection_to_session": "string"
}
```

Rules:

- every NPC must have `physical_or_behavioral_trait`
- the trait should be roleplay-usable at the table

### `ThreatEntry`

```json
{
  "name": "string",
  "kind": "monster | humanoid_enemy | hazard | faction_pressure | clock | other",
  "summary": "string",
  "used_in_combat": "boolean",
  "stat_block": "StatBlock | null",
  "noncombat_pressure": "string | null"
}
```

Rules:

- literal enemies should have `used_in_combat = true`
- if `used_in_combat = true`, `stat_block` is required
- noncombat threats can omit stat blocks

### `StatBlock`

System-neutral first-pass structure.

```json
{
  "system": "string",
  "name": "string",
  "level_or_cr": "string | null",
  "armor_or_defense": "string | null",
  "hit_points_or_stress": "string | null",
  "speed": "string | null",
  "core_stats": {
    "key": "string"
  },
  "attacks_or_moves": ["string"],
  "special_abilities": ["string"],
  "notes": ["string"]
}
```

Implementation note:

- later versions may introduce system-specific stat block subtypes
- V1 can use a shared schema plus system-specific rendering rules

### `RewardEntry`

```json
{
  "name": "string",
  "kind": "treasure | item | currency | information | favor | ally | advancement | other",
  "summary": "string",
  "system_baseline_alignment": "standard | slightly_above_standard | custom",
  "why_it_fits": "string | null"
}
```

Rules:

- `system_baseline_alignment` should usually be `standard`
- custom rewards should only appear when requested or clearly justified

## Duration Scaling Guidance

These are suggested target ranges for V1 output density.

### Short

- scenes: `3-5`
- locations: `1-3`
- important NPCs: `2-4`
- secrets and clues: `4-6`
- threats: `1-3`
- rewards: `1-3`

### Medium

- scenes: `4-7`
- locations: `2-4`
- important NPCs: `3-6`
- secrets and clues: `6-10`
- threats: `2-4`
- rewards: `1-4`

### Long

- scenes: `6-10`
- locations: `3-6`
- important NPCs: `4-8`
- secrets and clues: `8-12`
- threats: `2-6`
- rewards: `2-5`

These are guidance ranges, not hard laws.

## Rendering Contract

The CLI or UI should be able to render a `SessionPlan` into markdown with:

- metadata at the top
- the eight standard sections in order
- bullets preferred over prose
- stat blocks rendered under the relevant threat entries
- assumptions shown only when helpful

## Persistence Guidance

The tool should eventually persist:

- character continuity
- reusable clues
- previous session recap seeds
- generated plans

V1 does not need full campaign management, but it should preserve enough information to support continuity-aware next-session planning.

## Suggested Validation Rules

- reject empty `session_description`
- reject unparseable `session_duration`
- reject question sets with fewer than `10` or more than `20` questions
- require `physical_or_behavioral_trait` for every NPC
- require `stat_block` for combat-ready enemies
- require `rendering` for every location
- require at least one `opening_situation` in strong start

## Recommended Next Implementation Step

Implement these in order:

1. duration parser
2. question generator using the question schema
3. normalized request builder
4. structured `SessionPlan` generator
5. markdown renderer
6. continuity save/load layer

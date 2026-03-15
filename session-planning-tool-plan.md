# TTRPG Tools Plan

## Project Goal

Build a set of AI-assisted tools for tabletop RPG play. The first tool will be a session planning tool that takes:

- a description of the upcoming session
- a target session length

and produces a session plan in the Sly Flourish Lazy GM format.

## First Tool Goal

Create a usable workflow where a GM can provide a short session brief and expected play time, and receive a practical session-prep document structured around Lazy GM planning sections.

## Desired Outcome For V1

The first version should:

- accept freeform session input
- accept a session duration such as `2 hours`, `3.5 hours`, or `210 minutes`
- generate a clean session plan in a consistent Lazy GM-style structure
- scale the amount of material to the available table time
- produce output that is readable, editable, and easy to reuse before a game

## Assumptions

- this project will start as a local tool-first project
- AI generation will be a core part of the workflow
- the first interface can be simple
- exact Sly Flourish section naming and formatting should be treated carefully during implementation

## Recommended Initial Scope

Focus the first milestone on one strong workflow instead of a broad tool suite.

V1 should support:

- a single-session planning flow
- one output format
- one primary model/provider path
- basic editing and regeneration

V1 should not yet include:

- campaign memory
- player-specific recaps
- encounter balancing
- map generation
- image generation
- cross-session continuity management

## Work Phases

### Phase 1: Product Definition

Define the exact shape of the session planner.

Tasks:

- decide the canonical input fields
- define the exact output template for the session plan
- decide how strongly the generator should adhere to Lazy GM structure
- define what "scaled to session length" means in practical terms
- identify the minimum useful output quality bar

Deliverable:

- a short product spec with sample input and sample output

### Phase 2: Architecture And Tech Choice

Choose the implementation approach for the first usable version.

Tasks:

- decide whether V1 is CLI-first, local web app, or both
- choose the core runtime and framework
- decide how prompts and templates will be stored
- define how the AI provider will be abstracted
- decide whether generation should be deterministic or support multiple tones/styles later

Deliverable:

- architecture notes and project skeleton

### Phase 3: Domain Model

Create the core planning model for a session plan.

Tasks:

- define the session request model
- define the session plan output model
- model time-budgeting rules for short, medium, and long sessions
- define validation rules for input length and duration parsing
- define section-level generation expectations

Deliverable:

- typed request/output structures and validation rules

### Phase 4: Prompt And Template Design

Build the generation layer for the planner.

Tasks:

- write the base system prompt for session planning
- write the user prompt template
- define the target Lazy GM-style sections
- add timing-aware guidance so output scales to session duration
- create at least 5 representative sample prompts for testing

Deliverable:

- prompt templates stored in the repo and ready for iteration

### Phase 5: Core Generation Engine

Implement the first end-to-end generator.

Tasks:

- accept user input
- parse and normalize duration
- assemble the prompt payload
- call the configured model/provider
- parse and structure the result
- render the final plan in markdown

Deliverable:

- working session-planning generation flow

### Phase 6: Interface

Create the first user-facing interface.

Recommended first path:

- start with a CLI

Tasks:

- add command input options for session description and length
- support stdin or file input for longer session briefs
- write generated plans to stdout and optionally to a markdown file
- provide clear validation and error messages

Possible follow-up:

- add a small local web UI after the CLI is stable

Deliverable:

- usable local interface for generating plans

### Phase 7: Quality And Evaluation

Make the output reliably useful.

Tasks:

- create golden examples for short, medium, and long sessions
- test multiple genres and campaign styles
- evaluate whether the plan is actionable at the table
- refine prompts to reduce fluff and improve practical prep value
- verify the planner does not overproduce content for short sessions

Deliverable:

- evaluation notes and improved prompts

### Phase 8: Packaging And Reuse

Prepare the tool for repeated use.

Tasks:

- document setup and usage
- add example input files
- add example generated outputs
- add configuration for model/provider selection
- define the next planned tools in the suite

Deliverable:

- documented V1 repository ready for continued development

## Key Product Questions To Resolve During Execution

- which exact Lazy GM sections should be included in V1
- whether output should be strictly structured or lightly stylized
- whether the model should return markdown directly or structured JSON first
- whether a local model is sufficient for quality or whether API-backed generation should be supported early
- whether the first version should store prior sessions for continuity

## Suggested V1 Output Shape

The generated plan should likely include:

- session summary
- strong start
- likely scenes or beats
- important secrets or clues
- notable NPCs
- locations
- monsters or threats
- treasure, rewards, or discoveries
- pacing notes based on session length

This should be validated against the actual Lazy GM structure before implementation.

## Risks

- reproducing a branded or authored format too rigidly may require careful handling
- AI output may become too verbose or too generic without strong prompt constraints
- session-length scaling can easily become hand-wavy unless rules are explicit
- local models may be weaker than hosted models for structured GM prep output

## Recommended First Execution Slice

Build the smallest useful version in this order:

1. define the output schema and prompt contract
2. build a CLI that accepts session description and duration
3. generate markdown output
4. evaluate with 5 sample sessions
5. refine prompt and timing heuristics

## Immediate Next Tasks

- create the initial repo scaffold
- choose the runtime/framework
- write the product spec for the session planner
- define the V1 output schema
- implement the first CLI flow

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Corona Eclipsa Web Rules

This app is a local-first markdown browser and editor for `games/corona-eclipsa`.

## Content model

- the app only exposes these playable roots:
  - `GAME.md`
  - `continuity/`
  - `plans/`
  - `references/`
- `GAME.md` is the `Overview` section in the UI
- `continuity/` is the canonical source of truth
- `plans/` are session-forward working docs
- `plans/` also includes `session-arc-history.md`, which should appear with the other session-facing material
- `references/` are support docs and handout-like material

## Navigation assumptions

- the first `#` heading becomes the document title shown in the UI
- headings drive sidebar tree nodes and anchor navigation
- changing a heading can break saved or linked section targets
- document and section navigation should work even if the target document is not already open

## Search and inline lookup rules

- inline backticked terms become clickable lookup chips
- only backtick text that is worth searching for repeatedly
- names, factions, places, items, magical concepts, and unique setting terms are good lookup targets
- numbers, DCs, damage strings, generic PF2e terms, and long phrases should usually not be backticked
- optimize for useful search results over decorative code styling

## Presentation rules

- preserve attractive web rendering without making the raw markdown unpleasant to edit
- prefer short sections, tables, and clean bullets over oversized paragraphs
- avoid noisy code-style formatting for text that is not code or a lookup target
- keep the left nav stable during navigation and avoid interactions that feel like full reloads

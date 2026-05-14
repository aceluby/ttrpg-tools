# Soundboard Overlay Plan

## Goal

Add a **local sound effect and ambience layer** on top of the existing Spotify music controls in the Corona Eclipsa web app.

The intended table flow is:

- Spotify handles the main musical mood
- the app handles ambient loops and one-shot effects
- both come out of the same laptop audio output / Bluetooth speaker

This avoids trying to make Spotify do layered playback it is not well suited for.

## Product Shape

Build the first pass inside the existing `Music Director` tool rather than as a separate top-level app.

The music tool will have three coordinated layers:

1. `Spotify Scene Music`
2. `Ambient Loops`
3. `One-Shot Effects`

## First-Pass Features

### Spotify layer

Keep the current Spotify functionality:

- connect Spotify
- choose a scene
- play a playlist
- skip to next song

### Ambient loop layer

Add local loop playback for:

- tavern crowd
- rain
- fire crackling
- battle ambience

Each loop should support:

- play / stop
- independent volume
- loop playback
- persistence of its preferred volume between sessions

### One-shot effect layer

Add one-tap stingers for:

- thunder
- hoof beats
- horror hit
- electricity
- explosion
- combat clash

Each should:

- play immediately
- allow repeated triggering
- not interrupt Spotify

### Atmosphere presets

Add quick presets that coordinate Spotify and local ambience.

Examples:

- `Tavern`: select tavern-like Spotify scene, suggest tavern crowd + fire
- `Storm`: select eerie or tense Spotify scene, suggest rain + thunder
- `Battle`: select combat Spotify scene, suggest battle ambience
- `Campfire`: keep current Spotify scene but bring up fire crackling

For the first pass, presets should:

- select a recommended Spotify scene in the UI
- start / stop ambient loops defined by the preset
- not force Spotify playback automatically unless the GM explicitly presses play

## Architecture

### Audio model

Use browser-side audio playback so it can layer over desktop Spotify:

- `HTMLAudioElement` for loop playback and stingers
- React state for active loops, volumes, and error/status messages
- a ref-based audio registry in the `MusicPanel`

Why this approach first:

- simple to implement
- works with local files in `public/audio`
- no server route needed for playback
- easy to upgrade later to Web Audio API if we want ducking, crossfades, or richer mixing

### Asset registry

Create a structured local registry for sound assets with:

- id
- label
- kind (`ambient` or `stinger`)
- category
- description
- local public path
- default volume
- candidate source URL
- source name
- license note

This lets the app be asset-driven instead of hard-coded around specific buttons.

### Local file layout

Expected local file paths:

```text
web/public/audio/ambient/tavern-crowd.mp3
web/public/audio/ambient/rain-loop.mp3
web/public/audio/ambient/fire-crackling.mp3
web/public/audio/ambient/battlefield-noise.mp3
web/public/audio/stingers/thunder-hit.mp3
web/public/audio/stingers/hoof-beats.mp3
web/public/audio/stingers/horror-hit.mp3
web/public/audio/stingers/electricity-zap.mp3
web/public/audio/stingers/explosion-hit.mp3
web/public/audio/stingers/combat-clash.mp3
```

The app should gracefully handle missing files and tell the GM what is not installed yet.

## UX Plan

### Section 1: Scene Music

Keep the existing Spotify status and scene controls.

### Section 2: Atmosphere Presets

Show preset cards with:

- label
- short description
- recommended Spotify scene
- which ambient loops will be toggled

### Section 3: Ambient Mixer

Show a card per loop with:

- loop name
- description
- play/stop button
- volume slider
- missing-file / ready indicator

### Section 4: Quick Effects

Show larger one-shot buttons for:

- thunder
- horror hit
- electricity
- explosion
- hoof beats
- combat clash

### Section 5: Asset Setup

Show a practical setup table with:

- sound label
- expected local filename
- source site
- source link
- license summary

This makes it easy to populate the first-pass board even before we add file upload tooling.

## Persistence

Persist in browser storage:

- selected Spotify scene
- ambient loop volume preferences
- last selected atmosphere preset

Do not attempt to persist active playback state across refresh in the first pass.

## Recommended First Download Set

These are the current recommended sources for the first batch. The current import pass uses Mixkit preview MP3s, which are easy to fetch directly and fall under the [Mixkit License](https://mixkit.co/license/).

Source:

- [Mixkit License](https://mixkit.co/license/)

### Ambient downloads

- `tavern-crowd.mp3`
  - source: `Mixkit Very crowded pub or party loop`
  - file: `https://assets.mixkit.co/active_storage/sfx/360/360-preview.mp3`
  - note: good social-noise bed for tavern scenes
- `rain-loop.mp3`
  - source: `Mixkit Rain long loop`
  - file: `https://assets.mixkit.co/active_storage/sfx/2394/2394-preview.mp3`
  - note: better continuous rain bed than the thunder-heavier storm variants
- `fire-crackling.mp3`
  - source: `Mixkit Campfire burning crackles`
  - file: `https://assets.mixkit.co/active_storage/sfx/1329/1329-preview.mp3`
  - note: strong hearth / campfire support layer
- `battlefield-noise.mp3`
  - source: `Mixkit Big army crowd marching`
  - file: `https://assets.mixkit.co/active_storage/sfx/461/461-preview.mp3`
  - note: acceptable first pass, but still likely the first ambience to replace later

### Stinger downloads

- `thunder-hit.mp3`
  - source: `Mixkit Nature ambience with lightning strike and thunder`
  - file: `https://assets.mixkit.co/active_storage/sfx/3093/3093-preview.mp3`
- `hoof-beats.mp3`
  - source: `Mixkit Horse fast gallop in the dirt`
  - file: `https://assets.mixkit.co/active_storage/sfx/77/77-preview.mp3`
- `horror-hit.mp3`
  - source: `Mixkit Hard horror hit drum`
  - file: `https://assets.mixkit.co/active_storage/sfx/565/565-preview.mp3`
- `electricity-zap.mp3`
  - source: `Mixkit Electricity lightning blast`
  - file: `https://assets.mixkit.co/active_storage/sfx/2601/2601-preview.mp3`
- `explosion-hit.mp3`
  - source: `Mixkit Explosion hit`
  - file: `https://assets.mixkit.co/active_storage/sfx/1704/1704-preview.mp3`
- `combat-clash.mp3`
  - source: `Mixkit Sword strikes armor`
  - file: `https://assets.mixkit.co/active_storage/sfx/2765/2765-preview.mp3`

### Quality notes

- The current first pass now has exact imported files for every planned slot.
- `battlefield-noise.mp3` is the weakest thematic fit and the most likely first replacement.
- Longer-term, ambience loops would benefit from editing for cleaner loop points and steadier loudness.

## Implementation Steps

### Completed

1. Add a structured sound asset registry and atmosphere preset registry.
2. Extend `MusicPanel` with local audio playback support.
3. Add ambient loop cards, stinger buttons, and preset controls.
4. Add setup guidance for expected local asset files.
5. Verify playback UX and persistence behavior.
6. Curate and add locally stored sound files for the first batch.
7. Add direct in-app MP3 replacement for soundboard assets.

### Next

1. Add quick preview / stop controls in the asset table for faster auditioning.
2. Add waveform / duration metadata so long ambience files are easier to compare.
3. Add loop-safe editing or trimming helpers for ambience beds.
4. Add optional music ducking for loud stingers.

## Later Enhancements

- audio ducking for large stingers
- randomized stinger variants
- file upload directly in the app
- trimming / loop point helper
- encounter-linked scene presets
- keyboard shortcuts for high-frequency effects
- crossfade between ambient states

# Vice Light Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/RaynaldyRyan/vice-light-cover-studio-r3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/RaynaldyRyan/vice-light-cover-studio-r3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline, single-page web app that turns your photos and a caption into
GTA 6-style multi-panel cover art — no network, no uploads, no build step.
Open `app/index.html` from any static server and it just works.

## What it does

- **Your photos, your panels** — upload photos (file picker or drag-and-drop),
  assign a different photo to each panel, or fill several panels with one photo
  at different crops. Drag inside a panel to reposition, use the Zoom slider
  to frame.
- **Multi-panel covers** — Hero + Three (one tall hero panel, three stacked)
  or a 2×2 grid, with clean white panel borders, film grain and a vignette.
- **Three themes** — Sunset Heist (warm orange/pink sunset grade), Neon Nights
  (magenta/cyan neon night) and Rooftop Dawn (soft blue/peach dawn skyline).
  Each theme changes the colour grade, panel borders and title colours.
- **Live caption** — editable title and subtitle, rendered as bold condensed
  gradient lettering with a glowing italic subtitle.
- **Real export sizes** — 1080×1080, 1080×1350 and 1920×1080, rendered at
  full resolution on canvas and downloaded as a PNG.
- **Zero-upload sample scenes** — four procedural scenes drawn at runtime on
  canvas (sunset beach boulevard, neon night street, rooftop dawn skyline,
  coastal cruise), so the app makes covers with no photos at all.

## Layout

- `app/index.html` — the editor page
- `app/style.css` — editor styling
- `app/app.js` — cover renderer, sample-scene painters, editor UI, PNG export
- `screenshots/` — four renders of the app (see `shots.json`)
- `main.ts` — entry program: copies `app/` and `screenshots/` to the output
  directory and writes `dossier.json`

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
bounty on make.fun. All artwork is original and drawn in code — no Rockstar
Games logo, artwork or font is used anywhere.

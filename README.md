# Moodful

A premium, single-page mood-based experience that bends typography, color, particles, and ambient sound to whatever mood you pick — plus a built-in **Mood Link Network** so anyone can scan your QR code and drop their mood on your page.

Live: **https://softtech6395-source.github.io/Moodful/** (after first deploy)

## Stack

- **React 18 + TypeScript**
- **Vite 6** (fast dev, tiny bundle, builds to static)
- **Tailwind CSS** + plain CSS variables for the live mood theming
- **Framer Motion** for entrance / exit / spring transitions
- **qrcode** for the canvas-based share QR
- **Web Audio API** for procedural ambient pads (no audio files)
- **localStorage** for the mood-link demo (swap for a backend later)

## Features

### Mood landing
- 5 moods (happy / sad / stressed / calm / motivated)
- Each one transforms: gradient bg, animated orbs, canvas particles, font family, weight, accent, ambient pad, tempo line
- Click ripple, kbd shortcuts (`1`–`5`, `S` toggles audio, `Esc` closes drawer)
- Reduced-motion + mobile-responsive

### Mood Link Network
- Auto-generated short slug — your shareable URL is `…/?m=<slug>`
- Drawer with: editable visitor prompt, copy-link, downloadable QR, live feed, reactions (❤️ 🤝 🌧 🔥), pulse stats (total / dominant / week)
- Visitor view: same atmosphere, with a compose row + anonymous send + thank-you card
- Cross-tab sync via the `storage` event so opening the visitor link in another tab updates the owner's badge

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build

```bash
npm run build
npm run preview      # preview the production build
```

## Deploy to GitHub Pages

The `.github/workflows/deploy.yml` workflow builds and deploys on every push to `main`.

**One-time setup in the GitHub repo settings:**
1. Settings → Pages → **Build and deployment** → Source: **GitHub Actions**
2. Push to `main`. The workflow will build and publish to `https://softtech6395-source.github.io/Moodful/`.

`vite.config.ts` uses `base: './'` so the bundle works at any subpath — you don't need to change anything per-repo.

## Project layout

```
src/
├── App.tsx                    # top-level: routing, state, theme apply
├── main.tsx
├── index.css                  # tailwind + CSS variables + keyframes
├── lib/
│   ├── moods.ts               # 5 mood presets (palette/font/audio/particles)
│   └── store.ts               # localStorage layer + slug + timeAgo
├── hooks/
│   ├── useAudio.ts            # Web Audio engine
│   └── useToast.ts
└── components/
    ├── ParticleCanvas.tsx     # canvas particle engine
    ├── Orbs.tsx               # blurred drifting orbs
    ├── Nav.tsx
    ├── Hero.tsx               # eyebrow / icon / quote / sub w/ Framer transitions
    ├── MoodSelector.tsx
    ├── Compose.tsx            # visitor compose row
    ├── SentCard.tsx
    ├── Meta.tsx               # bottom strip: mood / tempo / palette
    ├── MoodDrawer.tsx         # right-side panel: link, QR, feed, reactions, stats
    ├── VisitorBanner.tsx
    └── Toast.tsx
```

## Notes on the demo loop

The Mood Link Network stores all data in `localStorage`, which means:
- Submissions made in one browser only appear to that browser's owner.
- To see the loop end-to-end on one machine, open the share link in a second tab — the `storage` event will sync the owner's badge.

Wiring it to a backend later is a one-file change: replace the read/write calls in `src/lib/store.ts` with `fetch` calls.

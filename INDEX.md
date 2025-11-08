# Project Index

_Last updated: 2025-11-08 (UTC)_

## Snapshot
- `demo-game/` contains the Hollow Knight-inspired pygame-ce platformer with sprint/dash, dust FX, parallax art, and asynchronous pygbag loop. Story/tuning values now load from `demo-game/game_config.json`.
- `landing-page/` is the Next.js 14 marketing site + Madlib lab. It embeds the pygbag build (copied into `landing-page/public/demo-game/`) so visitors can play the Python demo inside the site.
- Root docs (`README.md`, `notes.txt`, this index) describe how the Python game and Next.js site work together; `requirements.txt` pins pygame-ce + pygbag.
- Generated folders (`demo-game/build/web-cache`, `demo-game/__pycache__`, `landing-page/.next/`) are safe to delete/regenerate.

## Directory Tree
```
HackKentucky-KYX/
├── demo-game/
│   ├── game_config.json
│   ├── main.py
│   └── build/
│       ├── version.txt
│       ├── web/
│       │   ├── favicon.png
│       │   ├── demo-game.apk
│       │   └── index.html
│       └── web-cache/
│           └── hashed *.data/*.head/*.tmpl chunks from pygbag
├── landing-page/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── lab/page.tsx
│   │   └── api/madlib/route.ts
│   ├── lib/schemas.ts
│   ├── public/demo-game/  # copy of demo-game/build/web
│   └── … (components, configs, package.json, etc.)
├── index.html             # legacy Bottle Episodes tool
├── example_mod.json
├── requirements.txt
├── README.md
├── notes.txt
├── .gitignore
└── .git/
```

## File Details

### Gameplay Code (`demo-game/`)
- `main.py` – Asynchronous pygame-ce loop with Hollow Knight-inspired palette, parallax backgrounds, sprint/dash player controller, dust particles, horned sprite rendering, health orbs, and smarter enemies. Loads story/tuning from `game_config.json` so the Madlib lab can drive copy + difficulty.
- `game_config.json` – Mergeable config (story title, lead/rival names, goal text, difficulty, player/enemy tuning). Missing fields fallback to defaults inside `main.py`.
- `build/` – Output of `pygbag main.py`. `web/` holds the distributable bundle copied into the Next.js public folder; `web-cache/` caches pygbag chunks; `version.txt` tracks pygbag version.

### Website & Builder (`landing-page/`)
- `app/page.tsx` – Marketing copy, engine pipeline explanation, iframe pointing to `/demo-game/index.html`, stats/workflow sections.
- `app/lab/page.tsx` – Madlib-style UI generalized to “lead/rival/hub”, emitting payloads defined in `lib/schemas.ts`.
- `app/api/madlib/route.ts` – Validates payloads (Zod), emits server response consumed by the UI.
- `lib/schemas.ts` – Shared schema/types for the Madlib form, API, and documentation (kept in Git by `.gitignore` exception).
- `public/demo-game/` – Static copy of the latest pygbag bundle (overwrite after each `pygbag` run).
- `.eslintrc.json`, `tsconfig.json`, `package.json`, etc. – Next.js tooling (Strict ESLint preset).

### Legacy Web Tool
- `index.html` + `example_mod.json` – Bottle Episodes mod creator reference UI/sample payload (vanilla JS). Not tied to the Next.js site but kept for historical context.

### Documentation & Config
- `README.md` – Explains both halves of the project, controls, pygbag workflow, and how to refresh the website embed.
- `notes.txt` – Development log covering combat, AI, visual pass, dash/dust systems, and site integration.
- `requirements.txt` – Python dependency pins (`pygame-ce>=2.3.0`, `pygbag>=0.6.0`) with reminder to uninstall vanilla pygame.
- `.gitignore` – Ignores common Python/Node artifacts plus pygbag output while whitelisting `landing-page/lib/`.
- `tools/build_game.py` – CLI helper that writes `game_config.json`, runs `pygbag`, and copies the bundle into `dist/<slug>/`.

## Quick Reference
- Install Python deps: `pip install -r requirements.txt` (after `pip uninstall pygame` if necessary)
- Run game locally: `cd demo-game && python main.py`
- Build for web: `cd demo-game && pygbag main.py`
- Update website embed: copy `demo-game/build/web/*` → `landing-page/public/demo-game/`
- Run website: `cd landing-page && npm install && npm run dev`
- Lint/build website: `npm run lint && npm run build`

Use this index as a quick map before editing gameplay code, tweaking the Next.js site, or regenerating pygbag assets.

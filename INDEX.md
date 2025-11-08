# Project Index

_Last updated: 2025-11-08 (UTC)_

## Snapshot
- Core gameplay lives in `main.py` (492 lines): a pygame-ce multi-room platformer with async game loop, platform/enemy classes, wraparound room transitions, and pygbag compatibility.
- `index.html` (821 lines) is a Bottle Episodes mod-creator UI with a dark gradient layout, live JSON builder, validation, and download helpers for the sample `example_mod.json`.
- `build/` holds the pygbag export pipeline (version `0.9.2`), including the generated web bundle plus an Android APK and accompanying cache blobs.
- Documentation (`README.md`, `INDEX.md`) and dependency pinning (`requirements.txt`) live at the repo root alongside `.gitignore` rules.
- Generated folders (`build/web-cache`, `__pycache__/`) are safe to delete before rebuilding or committing.

## Directory Tree
```
HackKentucky-KYX/
├── main.py
├── index.html
├── example_mod.json
├── requirements.txt
├── README.md
├── INDEX.md
├── .gitignore
├── build/
│   ├── version.txt
│   ├── web/
│   │   ├── favicon.png
│   │   ├── hackkentucky-kyx.apk
│   │   └── index.html
│   └── web-cache/
│       └── hashed *.data / *.head / *.tmpl chunks from pygbag
├── __pycache__/
│   └── main.cpython-312.pyc
└── .git/
```

## File Details

### Gameplay Code
- `main.py` – Async `asyncio.run(main())` entry point that sets up the pygame window, `Room`/`Platform` layout definitions (5 rooms), and `Player` plus simple patrolling `Enemy` AI. Supports WASD/arrow movement, variable jump heights, friction, stomp/bounce logic, HUD text, and looping room transitions for both desktop and web builds.

### Web & Modding Tools
- `index.html` – Single-page tool for creating Bottle Episodes mods. Includes CSS for a frosted-glass dark UI, form sections for game settings, characters, environment, and items, a live JSON preview pane, copy/download buttons, and color pickers. Runs fully client-side (vanilla JS).
- `example_mod.json` – Sample “Shadow Runner Mod” payload showing the JSON schema produced by the web tool (metadata, stats, environment, inventory, hazards, and crafting flags).

### Build Outputs
- `build/version.txt` – Tracks the current pygbag export version (`0.9.2`) for the produced assets.
- `build/web/` – The distributable bundle created by `pygbag main.py`, containing the WASM-ready HTML shell plus an `hackkentucky-kyx.apk` mobile package and favicon.
- `build/web-cache/` – Hashed `.data`, `.head`, and `.tmpl` chunks written by pygbag’s caching layer; regenerate by rerunning the build.

### Documentation & Configuration
- `README.md` (123 lines) – Primary setup and usage guide: highlights pygame-ce requirements, install steps, local/web run commands, control scheme, and customization knobs.
- `INDEX.md` – This living document that inventories every file/folder for quick onboarding.
- `requirements.txt` – Python dependency pins (`pygame-ce>=2.3.0`, `pygbag>=0.6.0`) plus reminders to remove vanilla pygame to avoid conflicts.
- `.gitignore` – Filters out Python caches, virtualenvs, editor junk, OS files, and pygbag artifacts (`build/`, `web/`, `*.wasm`, `*.data`).

### Generated Artifacts
- `build/web-cache/` – Recreated whenever pygbag stages assets; safe to clean if space is needed.
- `__pycache__/main.cpython-312.pyc` – CPython bytecode from the most recent local run.
- `.git/` – Local repository metadata (logs, refs, hooks).

## Quick Reference
- Run the platformer locally: `python main.py`
- Build for the web (outputs to `build/`): `pygbag main.py`
- Launch the mod creator: open `index.html` in any modern browser
- Install dependencies: `pip install -r requirements.txt` (after uninstalling vanilla `pygame` if present)

---

Use this index as the jumping-off point before editing gameplay code, tweaking the web tool, or pruning build artifacts.


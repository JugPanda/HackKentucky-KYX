#!/usr/bin/env python3
"""Automate the KYX pygbag build pipeline.

Usage:
    python tools/build_game.py --config ./payload.json --slug sample-build

This will:
1. Validate the provided JSON.
2. Write it to demo-game/game_config.json.
3. Run `pygbag main.py` inside demo-game/ (unless --skip-build is passed).
4. Copy demo-game/build/web into dist/<slug>/ so the bundle can be uploaded or embedded.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEMO_DIR = REPO_ROOT / "demo-game"
CONFIG_DEST = DEMO_DIR / "game_config.json"
BUILD_SRC = DEMO_DIR / "build" / "web"
DEFAULT_DIST = REPO_ROOT / "dist"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a KYX pygbag bundle from a config file.")
    parser.add_argument(
        "--config",
        required=True,
        type=Path,
        help="Path to the JSON payload (typically exported from the Madlib lab).",
    )
    parser.add_argument(
        "--slug",
        type=str,
        default=None,
        help="Name for the output folder. Defaults to a timestamp.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_DIST,
        help=f"Where to copy the generated bundle (default: {DEFAULT_DIST})",
    )
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Write the config but skip running pygbag (useful for dry runs).",
    )
    return parser.parse_args()


def load_payload(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with path.open("r", encoding="utf-8") as src:
        return json.load(src)


def write_config(data: dict) -> None:
    CONFIG_DEST.parent.mkdir(parents=True, exist_ok=True)
    with CONFIG_DEST.open("w", encoding="utf-8") as dest:
        json.dump(data, dest, ensure_ascii=False, indent=2)


def run_pygbag() -> None:
    subprocess.run(
        ["pygbag", "main.py"],
        cwd=DEMO_DIR,
        check=True,
    )


def main() -> None:
    args = parse_args()
    payload = load_payload(args.config)
    write_config(payload)

    if not args.skip_build:
        print("Running pygbag build...")
        run_pygbag()
    else:
        print("Skipping pygbag build as requested.")

    slug = args.slug or str(int(time.time()))
    if not BUILD_SRC.exists():
        raise FileNotFoundError(
            f"Expected pygbag output in {BUILD_SRC}. Run the build step first."
        )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    dest_dir = args.output_dir / slug
    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    shutil.copytree(BUILD_SRC, dest_dir)
    print(f"Bundle copied to {dest_dir}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"[build_game] Error: {exc}", file=sys.stderr)
        sys.exit(1)

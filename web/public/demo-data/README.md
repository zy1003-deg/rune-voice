# Demo data

This directory contains a **small synthetic dataset** used to demonstrate
the Rune Voice frontend's core capabilities without referencing any
third-party intellectual property.

## Contents

| File | Purpose |
| ---- | ------- |
| `champions.json` | 5 synthetic champions (Alpha Warrior, Beta Mage, Gamma Ranger, Delta Sentinel, Echo Bard) |
| `quotes/<name>.json` | 3–5 synthetic quote records per champion |
| `search_index.json` | Aggregated index for the in-browser search box |
| `featured_quotes.json` | Small pool powering the "Surprise me" action |

## Notes

- All champion names, voice line texts, and audio paths are **fictional**.
- Audio files referenced in the JSON records (`demo_*.mp3`) are **not
  shipped**. The player will gracefully show "audio unavailable" because
  the file does not exist. The frontend, search, navigation, and player
  UI all still work.
- This dataset is the default for fresh clones (`VITE_API_BASE` defaults
  to `/demo-data`). For production deployment, point `VITE_API_BASE` at
  the operator's own dataset hosted on object storage.

See `README.md` and `docs/PROJECT_ARCHITECTURE.md` for the full data strategy.

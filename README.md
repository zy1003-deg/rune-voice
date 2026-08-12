# Rune Voice · 符文之声

> An open-source voice-content indexing and exploration platform.
> A fan project — not affiliated with any game publisher.

Rune Voice is an open-source platform for **indexing, searching, browsing
and playing voice content** through structured metadata and a modern web
interface. Its engineering focus is on the **data processing pipeline** —
fetching, normalizing, indexing, and serving voice metadata — rather than
on shipping a large content archive. The repository contains a small
synthetic demo dataset and a fully working frontend; production-grade
content is hosted by the operator outside this repository.

---

## Online demo

A reference deployment that runs this project against a
League of Legends fan-content dataset is currently online at
<https://lol.zyyeah.asia>. It is the maintainer's own instance, not the
canonical project host; if you fork this project, configure
`VITE_SITE_URL` to point at your own deployment.

---

## Features

- **Champion / entity grid** — browse every entry with role, count, and
  detail view.
- **Event-grouped browsing** — voice lines organized by skin and event
  (Select, Attack, Joke, Taunt, Move, …).
- **Audio player** — single, queue-aware `<audio>` engine with progress,
  volume, prev/next, and prefetched neighbouring clips.
- **Full-text search** — debounced client-side search over a bundled
  index file.
- **Role filter** — pill tabs to narrow by role.
- **Theme toggle** — light / dark mode persisted to `localStorage`.
- **Hash routing** — `#/<name>` URLs for shareable deep links.
- **Static-site deployable** — no application server required at runtime;
  the dataset lives wherever `VITE_API_BASE` points.

---

## Screenshots

> A curated screenshot set will live in [`docs/images/`](docs/images/).
> Screenshots will be added in a follow-up release without redistributing
> any third-party IP.

---

## Architecture

```
  Source-of-truth dataset (operator-hosted)
                │
                ▼
  Python async crawler (core/, main.py)
                │
                ▼
  Local audio tree (./data/audio/<entity>/<skin>/<quote>.mp3)
                │
                ▼
  Data-prep scripts (web/generate_data.py and friends)
                │
                ▼
  Static JSON dataset   ──► hosted outside this repo
                │
                ▼
  React 19 + Vite SPA (web/src/)
                │
                ├── /demo-data  (default; synthetic dataset in repo)
                │
                └── VITE_API_BASE  (overrides default for production)
                          │
                          ▼
                  External CDN / object storage
                          │
                          ▼
                        User
```

The crawler and the data-prep scripts are **offline**. They turn the
operator's source-of-truth data into the static JSON that the SPA
consumes at runtime. The frontend never depends on those scripts at
runtime — only on the JSON they produced.

---

## Tech stack

| Layer        | Technology                                                   |
| ------------ | ------------------------------------------------------------ |
| Frontend     | React 19 · Vite 6 · Tailwind v4 · framer-motion 12 · Vercel Analytics |
| Build / CDN  | Vite (static SPA) · Vercel or any static host · any S3-compatible bucket |
| Crawler      | Python 3.10+ · `asyncio` · `httpx` · `aiofiles`               |
| Audio decode | `vgmstream-cli` + `ffmpeg` (optional, only for raw `.wem`)   |
| Tests        | `pytest` (Python) · `vitest` (JS)                             |
| Lint         | `ruff` (Python)                                              |

---

## Repository vs Production data

This repository is the **code, schema, pipeline, and a small synthetic
demo**. It is intentionally not the data archive.

### The repository contains

- Original source code (Python crawler, React/Vite frontend).
- Data-processing pipeline (crawler, normalizers, JSON emitters).
- JSON schemas (see [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md)).
- A small synthetic demo dataset under `web/public/demo-data/` (5
  fictional entities, ~20 synthetic quote records).
- Tests, CI configuration, and documentation.

### The repository does NOT contain

- Riot-owned game audio (`.wem` / `.mp3` / etc.).
- Riot-owned champion portraits / skin art / splash art.
- A production voice archive.
- A complete per-entity transcript dataset.
- A production search index or featured-quotes pool.

Production deployments host their own dataset on object storage and
point `VITE_API_BASE` at its public URL. See the *Getting Started* and
*Data / asset setup* sections for details.

---

## Getting started

### Prerequisites

- **Node.js 20+** and **npm 10+** for the frontend.
- **Python 3.10+** for the crawler and offline data pipeline (optional —
  you only need this if you want to refresh a dataset from a source).
- **ffmpeg** on `PATH` if you want to convert `.wem` files to `.mp3`
  (`brew install ffmpeg` / `apt install ffmpeg` / Windows installer).
- **vgmstream-cli** on `PATH` for the same conversion
  (download from <https://github.com/vgmstream/vgmstream/releases>).

### 1. Clone and install

```bash
git clone https://github.com/zy1003-deg/rune-voice.git
cd rune-voice
pip install -r requirements.txt            # Python crawler (optional)
cd web && npm install && cd ..             # Frontend
```

### 2. (Optional) Configure environment

Defaults are sensible. To override, copy the example files:

```bash
cp .env.example .env                       # Python crawler (env vars)
cp web/.env.example web/.env.development   # Vite dev server
```

See the comments inside each file for the full list of variables. None
of the defaults require any real secrets.

### 3. Run the demo frontend

```bash
cd web
npm run dev
# → open http://localhost:5173
```

With no environment overrides, the SPA loads the **synthetic demo
dataset** under `web/public/demo-data/`. You will see 5 fictional
entities, a working search box, role tabs, the champion detail view,
and the player UI. Audio playback will show "audio unavailable"
because the demo dataset intentionally ships without audio files.

### 4. Point at your own dataset

For a production-style deployment:

```bash
# 1. Host your own JSON + audio on object storage (S3, R2, COS, ...).
# 2. Configure web/.env.production to point at it.
echo "VITE_API_BASE=https://your-cdn.example.com/data" > web/.env.production
# 3. Build.
cd web && npm run build
# 4. Deploy web/dist/ to any static host.
```

### 5. (Optional) Refresh a dataset

If you have access to a source of truth and want to regenerate JSON:

```bash
# Configure the upstream API endpoints
echo "LOL_VOICE_API_BASE=https://your-source.example.com" >> .env
echo "LOL_VOICE_CDN_BASE=https://your-source.example.com" >> .env
# Run the crawler
python main.py --mode search              # list entities
python main.py --mode full                # crawl everything
# Process the local audio tree into JSON
python web/generate_data.py
python web/add_roles.py
python web/update_events.py
python web/generate_search_index.py
python web/generate_sitemap.py
```

---

## Data / asset setup

### What the demo ships with

```
web/public/demo-data/
├── README.md              ← explains the synthetic dataset
└── data/
    ├── champions.json     ← 5 fictional entities
    ├── quotes/*.json      ← 3–5 synthetic records per entity
    ├── search_index.json  ← aggregated search index
    └── featured_quotes.json
```

All names, transcripts, and audio paths are **fictional** placeholder
content. The demo is suitable for showcasing the UI, the search, and
the player without referencing any third-party intellectual property.

### Producing your own dataset

The pipeline expects an external source-of-truth (an API you have
permission to use, your own archives, …). The crawler in
`core/crawler.py` + the data-prep scripts in `web/` translate that
source into:

- `champions.json` — array of `{name, alias, quoteCount, skins, file, role}`.
- `quotes/<name>.json` — array of `{skin, event, text, file, dir}`.
- `search_index.json` — flat array of `{text, champion, event, skin}`.
- `featured_quotes.json` — array of `{text, champion, dir, file, skin, event, featured}`.

See [docs/PROJECT_ARCHITECTURE.md §4](docs/PROJECT_ARCHITECTURE.md) for
the full schema.

### Avatars

This repository **does not** ship entity portraits. Two options:

1. Place portraits at `web/public/champion/{alias}.png` (Vite serves
   them as static assets).
2. Set `VITE_AVATAR_BASE` to your own CDN; the SPA will use
   `${VITE_AVATAR_BASE}/${alias}.png`.

If you do not supply avatars, the SPA simply hides the broken image
gracefully (the `ChampionCard` already handles this with an `onError`
fallback). A short alphabetic initial is shown as a CSS placeholder so
the demo still renders cleanly with no avatars present.

### Audio

The SPA builds audio URLs as `${VITE_API_BASE}/${dir}/${file}`. The
production host (CDN / bucket) is expected to serve the matching MP3
files. The player surfaces failures via the standard `<audio>`
`onerror` path.

---

## Contributing

We welcome bug reports, fixes, and feature proposals. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or PR.
Highlights:

- **Do not commit third-party game assets** — voice audio, splash art,
  portraits, etc. belong to their respective rights holders and must
  not be redistributed in this repository.
- Use feature branches (`feature/...`, `fix/...`, `chore/...`).
- Python tests: `pytest tests/`.
- Frontend tests: `cd web && npm test`.
- Frontend build: `cd web && npm run build`.

---

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

---

## Non-endorsement notice

Rune Voice is an unofficial fan project. It is **not endorsed by or
affiliated with** Riot Games, Garena, Tencent, or any other game
publisher, nor with anyone officially involved in producing or
managing League of Legends or any other game.

League of Legends and any associated game name, logo, voice line,
champion portrait, skin artwork, music, trademark, or other
intellectual property is the property of Riot Games, Inc. and its
respective owners. Rune Voice is a generic voice-content indexing
and exploration platform; its open-source license covers only the
original source code of this repository.

Riot-owned intellectual property is subject to Riot Games' applicable
policies and applicable law. Riot-owned materials are not covered by
this repository's open-source license. The maintainers make no claim
about the permitted use of third-party materials in any deployment;
that determination is the responsibility of each operator of the
platform.

---

## License

Source code: MIT — see [LICENSE](LICENSE).

Notice file with explicit scope clarifications: [NOTICE.md](NOTICE.md).

Operator-supplied data and assets: subject to that operator's own
rights and licenses.

---

## Further reading

- [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md) — full
  technical architecture for reviewers and contributors.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — development workflow.
- [`SECURITY.md`](SECURITY.md) — how to report vulnerabilities.
- [`NOTICE.md`](NOTICE.md) — license scope clarifications.

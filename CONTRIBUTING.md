# Contributing to Rune Voice

Thanks for your interest in improving Rune Voice! This document covers how
to file issues, prepare a change, run the tests, and submit a pull request.

---

## Code of conduct

Be respectful. Disagree on substance, not on people. Assume good faith
from other contributors.

---

## Filing issues

- **Bug reports** — please use the *Bug report* template and include:
  - Reproduction steps (command, browser, expected vs actual).
  - Champion name and skin (or URL fragment) involved.
  - For audio issues: the full URL the player tried to fetch.
- **Feature requests** — please use the *Feature request* template and
  describe the user value, not just the implementation.
- **Security issues** — please **do not** file a public issue. See
  [SECURITY.md](SECURITY.md).

---

## Development setup

### Prerequisites

- Node.js 20+ and npm 10+
- Python 3.10+
- ffmpeg and vgmstream-cli (only needed if you'll be processing raw
  `.wem` files; not required for typical frontend-only changes)

### Install

```bash
git clone https://github.com/zy1003-deg/rune-voice.git
cd rune-voice

# Python deps (crawler + tests)
pip install -r requirements.txt
pip install -e .[test]   # adds pytest, pytest-asyncio
pip install -e .[lint]   # adds ruff

# Frontend deps
cd web
npm install
```

### Run the SPA

```bash
cd web
npm run dev
# → http://localhost:5173
```

### Run tests

```bash
# Python
pytest tests/

# Frontend
cd web && npm test
```

### Lint

```bash
# Python
ruff check .

# Frontend — not configured yet; please use your editor's formatter.
```

---

## Branch & commit workflow

- Branch from `main` (the project's default branch).
- Branch naming:
  - `feature/<short-topic>` — new functionality
  - `fix/<short-topic>` — bug fix
  - `chore/<short-topic>` — tooling, docs, refactors
- Commit messages: short imperative summary, optionally a body explaining
  *why*. Reference the issue number when applicable (`Refs #123`).
- Keep commits focused; one logical change per commit.

---

## Pull request checklist

Before opening a PR, confirm:

- [ ] Tests pass locally (`pytest tests/` and `cd web && npm test`).
- [ ] Frontend builds (`cd web && npm run build`).
- [ ] No new secrets, credentials, or `.env` values are added to tracked
      files. Only `.env.example` may receive new placeholders.
- [ ] **No third-party game assets are added** (voice audio, splash art,
      champion portraits, transcripts, etc. belong to their respective
      rights holders and must not be redistributed in this repository).
- [ ] **No production voice-archive dataset is added.** The repository
      only ships the synthetic demo dataset under
      `web/public/demo-data/`. Production data lives outside this repo.
- [ ] Docs updated when behavior changes — at minimum the affected
      README and `docs/PROJECT_ARCHITECTURE.md`.
- [ ] If your change affects configuration, both `.env.example` (root)
      and `web/.env.example` are updated to match.
- [ ] The PR description explains the *why* (not just the *what*) and
      references the relevant issue.

---

## Adding new entities / metadata

The pipeline (`web/generate_*.py`) takes an operator's local audio tree
and emits JSON. The default output directory is no longer
`web/public/data/` (that path is gitignored as production data); it is
the operator's responsibility to point the scripts at the right
output directory and upload the result to their CDN.

The synthetic demo dataset under `web/public/demo-data/` is the only
dataset that ships in this repository, and it is intentionally
fictional. To extend the demo, edit files under
`web/public/demo-data/data/`; do **not** add any third-party IP.

If you are documenting how to refresh a production dataset, the
canonical sequence is:

```bash
# After the crawler has produced audio for a new entity
python web/generate_data.py --output <your-output-dir>
python web/add_roles.py --output <your-output-dir>
python web/update_events.py --output <your-output-dir>
python web/download_avatars.py             # if new entity portrait
python web/generate_search_index.py --input <your-output-dir>
python web/generate_sitemap.py --input <your-output-dir>

# Then upload <your-output-dir>/ to your CDN and set VITE_API_BASE.
```
`web/public/data/quotes/*.json` before committing. Do **not** commit any
binary audio files.

---

## Coding conventions

### Python

- Target Python 3.10+. Use `from __future__ import annotations` if you
  need forward references in type hints.
- Prefer `pathlib.Path` over string paths.
- Async I/O uses `httpx` and `aiofiles`. Never block the event loop with
  synchronous file or HTTP calls.
- Avoid pulling in heavyweight dependencies; the runtime surface is
  intentionally small (`httpx` + `aiofiles` only).

### JavaScript / React

- JSX, no TypeScript (the project is intentionally JS-only for now).
- Functional components, hooks for state and side effects.
- Tailwind utilities for layout; reusable vanilla CSS classes live in
  `web/src/index.css` and follow the existing BEM-ish naming
  (`.quote-row`, `.skin-tab`, etc.).
- Audio / URL helpers belong in `web/src/utils/` so they can be unit
  tested (see `web/src/utils/__tests__/`).

---

## Don'ts

- **Do not** commit voice audio (`.mp3`/`.wav`/`.wem`/`.ogg`/`.flac`) or
  champion portraits (`web/public/champion/*.png`). These are excluded by
  `.gitignore`.
- **Do not** add a backend server. The runtime is a static SPA; the
  crawler pipeline runs offline.
- **Do not** upgrade major framework versions (React, Vite, Tailwind) in
  the same PR that introduces a feature — open a dedicated PR.
- **Do not** fabricate project activity (fake issues, releases,
  contributors, stars).

---

## Release process

The maintainer cuts releases from `main`. Tags follow `v<major>.<minor>.<patch>`.
After the first tagged release a `CHANGELOG.md` is added.

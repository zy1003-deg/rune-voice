# NOTICE

This NOTICE supplements the [LICENSE](LICENSE) (MIT) by clarifying the
**scope** of what is and is not covered by the open-source license of
this repository. It is informational and does not change the license
terms.

## Covered by the MIT License

The MIT License covers the **original source code** and **project-
authored material** in this repository, including:

- Python source under `core/`, `store/`, `utils/`, and at the project
  root (`config.py`, `main.py`).
- React / JavaScript source under `web/src/`.
- Build, packaging, and test configuration (`pyproject.toml`,
  `requirements.txt`, `web/package.json`, `web/package-lock.json`,
  `web/vite.config.js`, `web/vitest.config.js`, `web/vercel.json`).
- Repository metadata (`.gitignore`, `.env.example`, `web/.env.example`,
  GitHub workflow files, `LICENSE`, this `NOTICE.md`, the `docs/`
  folder, the `README` files).
- The **synthetic demo dataset** under `web/public/demo-data/` —
  every name, transcript, and audio path is fictional and was authored
  specifically for this project.

## NOT covered by the MIT License

The MIT License does **not** grant rights to any of the following:

- **Trademarks, game names, or logos** of any third party —
  including but not limited to "League of Legends", "Riot Games",
  Garena, Tencent, and any other game publisher. Trademarks remain
  the property of their respective owners.
- **Game assets** of any kind — voice lines, audio, music, champion
  portraits, skin artwork, splash art, spell icons, or any other
  intellectual property of any game publisher (including Riot Games
  and its licensors).
- **Operator-supplied datasets** — when an operator deploys this
  platform against their own dataset, that dataset is theirs and is
  subject to whatever rights and licenses the operator obtained it
  under. This repository does not redistribute, sublicense, or
  otherwise grant rights to any operator's dataset.
- **Third-party APIs or services** — responses from upstream voice
  metadata APIs and any other third-party service remain the property
  of those providers.

## Non-endorsement

This project is a fan project. It is **not** endorsed by or affiliated
with any game publisher, nor with anyone officially involved in
producing or managing any game referenced by this project.

Riot-owned trademarks, game assets, audio, images, transcripts, and
other third-party materials are not covered by this repository's
open-source license unless explicitly stated otherwise.

The maintainers make no claim about the permitted use of third-party
materials in any deployment; that determination is the responsibility
of each operator of the platform.

## Third-party components

This repository depends on third-party components whose own licenses
apply, including:

- React, Vite, Vitest, framer-motion, Tailwind CSS (MIT).
- httpx (BSD-3-Clause) and aiofiles (Apache-2.0) for the crawler.
- Ruff (MIT) for linting.

See each upstream project's published license for the authoritative
terms.

## Operator responsibility

Anyone who deploys this platform is responsible for:

1. The dataset they choose to use — its legality, its provenance,
   and its license.
2. The audio they host — its licensing and the rights of any rights
   holders.
3. The portrait art they reference — its licensing.
4. Compliance with applicable law and with the policies of any
   upstream data source or rights holder.

The maintainers of this repository make no warranty about the
legality of any specific deployment and disclaim all liability to the
extent permitted by applicable law.

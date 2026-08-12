# Security policy

Thanks for taking the time to disclose security issues responsibly. This
project is a static SPA + an offline Python crawler; there is **no
authentication, no admin panel, no user database, and no server-side state**.
The realistic threat surface is small, but we still want to hear about
real problems.

---

## Supported versions

| Version       | Supported |
| ------------- | --------- |
| `main` branch | ✅        |
| Tagged release | ✅ for the latest minor; older minors receive best-effort |
| Anything else | ❌        |

The current release line is `0.1.x`. As long as the project is on `0.x`,
treat all `0.x.y` tags as supported.

---

## How to report a vulnerability

**Please do not file a public GitHub issue for suspected vulnerabilities.**

Use one of:

1. **GitHub private vulnerability reporting** (preferred if the repo is
   already public on GitHub): *Security → Advisories → New draft security
   advisory*.
2. **A maintainer-only channel** listed on the GitHub organization
   profile, if one exists at the time of disclosure.
3. If neither is available, please open a GitHub Discussion tagged
   `security-question` describing that you have a private report, and the
   maintainer will reply with a contact channel.

> We do **not** publish a dedicated security email address in this
> repository to avoid address-harvesting. Use the channels above.

---

## What to include in a report

- A clear description of the issue and its impact.
- Reproduction steps, including any URLs or local commands.
- For dependency CVEs: the affected version range and a reference (e.g.
  GitHub Advisory URL).
- Your name / handle for the public acknowledgement, or "anonymous" if
  you prefer.

---

## Scope

In scope:

- **Crawler** (`core/`, `store/`, `utils/`, `config.py`, `main.py`):
  SSRF against the operator-supplied voice metadata host, path traversal
  in downloaded audio filenames, dependency CVEs in `httpx`/`aiofiles`.
- **Local dev server** (`web/serve.py`): path traversal when serving
  audio out of `AUDIO_ROOT`/`DATA_ROOT`, permissive CORS in development.
- **Frontend SPA** (`web/src/`): XSS via the JSON metadata, prototype
  pollution via malformed `search_index.json`, CSP bypass.
- **Build / deploy**: `vercel.json` header regressions that loosen
  security defaults.

Out of scope (file upstream instead):

- Vulnerabilities in `vgmstream-cli` or `ffmpeg`.
- Vulnerabilities in the operator-supplied third-party voice metadata API.
- Riot Games' game assets and their licensing.

---

## Response targets

- **Acknowledgement**: within 5 working days.
- **Triage & fix plan**: within 15 working days for confirmed issues.
- **Disclosure timeline**: coordinated with the reporter; we aim for ≤ 90
  days from acknowledgement to public fix.

---

## Past advisories

None published yet.

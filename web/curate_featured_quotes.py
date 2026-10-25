"""Match reviewed community recommendations to operator audio metadata.

Run without arguments to inspect matches; --write verifies audio with HEAD
and writes the reviewed pool. No search results or AI summaries are scraped.
"""

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
CACHE = ROOT.parent / "output" / "featured-review" / "metadata"
PLAN = json.loads((ROOT / "featured_selection.json").read_text(encoding="utf-8"))


def api_base():
    value = os.environ.get("VITE_API_BASE")
    if not value:
        for line in (ROOT / ".env.production").read_text(encoding="utf-8").splitlines():
            if line.startswith("VITE_API_BASE="):
                value = line.split("=", 1)[1].strip()
                break
    if not value or not value.startswith("https://"):
        raise ValueError("Set the operator HTTPS VITE_API_BASE before curating")
    return value.rstrip("/")


def read_metadata(base, relative):
    local = CACHE / relative
    if local.is_file():
        return json.loads(local.read_text(encoding="utf-8-sig"))
    request = Request(
        base + "/data/" + quote(relative, safe="/"), headers={"User-Agent": "RuneVoice/1.0"}
    )
    with urlopen(request, timeout=25) as response:
        raw = response.read()
    value = json.loads(raw.decode("utf-8-sig"))
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_bytes(raw)
    return value


def normalized(text):
    return re.sub(r"[^\w]", "", text).lower()


def fingerprint(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def extend_pool(community, manifest, champions, metadata):
    """Resolve the explicitly reviewed additions; never select substitutes silently."""
    pool = list(community)
    seen = {normalized(row["text"]) for row in pool}
    for selection in manifest["selections"]:
        champion = champions.get(selection["alias"])
        match = next(
            (
                row
                for row in metadata.get(selection["alias"], [])
                if row.get("text")
                and row.get("dir")
                and row.get("file")
                and fingerprint(row["text"]) == selection["text_sha256"]
                and fingerprint(row["dir"] + "/" + row["file"]) == selection["audio_path_sha256"]
            ),
            None,
        )
        if champion is None or match is None:
            raise ValueError(f"Reviewed recording could not be resolved: {selection['alias']}")
        identity = normalized(match["text"])
        if identity in seen:
            raise ValueError(f"Duplicate recommendation: {match['text']}")
        seen.add(identity)
        pool.append(
            {
                **match,
                "champion": champion["name"],
                "featured": True,
                "sources": [],
                "selection_reason": selection["reason"],
            }
        )
    if len(pool) != manifest["target_count"]:
        raise ValueError(f"Expected {manifest['target_count']} recommendations, got {len(pool)}")
    return pool


def verify_audio(base, row):
    url = base + "/" + quote(row["dir"], safe="/") + "/" + quote(row["file"], safe="")
    try:
        with urlopen(Request(url, method="HEAD"), timeout=20) as response:
            length = int(response.headers.get("Content-Length", "0"))
            mime = response.headers.get("Content-Type", "").split(";", 1)[0]
            valid = (
                response.status == 200
                and length > 0
                and (mime.startswith("audio/") or mime == "application/octet-stream")
            )
            return {
                "url": url,
                "status": response.status,
                "bytes": length,
                "mime": mime,
                "valid": valid,
            }
    except Exception as error:
        return {"url": url, "valid": False, "error": str(error)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    editorial_path = ROOT / "featured_editorial_selection.json"
    editorial = (
        json.loads(editorial_path.read_text(encoding="utf-8")) if editorial_path.is_file() else None
    )
    base = api_base()
    champions = {c["alias"]: c for c in read_metadata(base, "champions.json")}
    aliases = {s["alias"] for s in PLAN["selections"]}
    if editorial:
        aliases.update(s["alias"] for s in editorial["selections"])
    aliases = sorted(aliases)

    def load(alias):
        champion = champions.get(alias)
        return alias, read_metadata(base, "quotes/" + champion["file"]) if champion else []

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        metadata = dict(executor.map(load, aliases))
    accepted, excluded, seen = [], [], set()
    for selection in PLAN["selections"]:
        champion = champions.get(selection["alias"])
        matches = [
            q
            for q in metadata[selection["alias"]]
            if q.get("text")
            and q.get("dir")
            and q.get("file")
            and all(normalized(part) in normalized(q["text"]) for part in selection["contains"])
            and selection.get("skin_contains", "") in q.get("skin", "")
        ]
        if not matches:
            excluded.append(
                {**selection, "reason": "No matching transcript and skin with playable metadata"}
            )
            print("MISSING", selection["alias"], " / ".join(selection["contains"]))
            continue
        # Prefer a base-skin recording; never rewrite the operator transcript.
        matches.sort(
            key=lambda q: (
                q.get("skin") not in ("默认皮肤", champion["name"] + " 默认皮肤"),
                len(q["text"]),
            )
        )
        selected = matches[0]
        identity = normalized(selected["text"])
        if identity in seen:
            continue
        seen.add(identity)
        row = {
            **selected,
            "champion": champion["name"],
            "featured": True,
            "sources": [PLAN["sources"][source] for source in selection["sources"]],
        }
        if selection.get("transcript_note"):
            row["transcript_note"] = selection["transcript_note"]
        accepted.append(row)
        print("MATCH", selection["alias"], selected.get("skin"), selected["text"])

    community_count = len(accepted)
    if editorial:
        accepted = extend_pool(accepted, editorial, champions, metadata)
        print("Resolved", len(accepted) - community_count, "reviewed additions")

    if args.write:
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            checks = list(executor.map(lambda q: verify_audio(base, q), accepted))
        verified = []
        for row, check in zip(accepted, checks, strict=True):
            if check["valid"]:
                verified.append(row)
            else:
                excluded.append(
                    {
                        "champion": row["champion"],
                        "text": row["text"],
                        "reason": "Audio verification failed",
                        "check": check,
                    }
                )
        audit = {
            "reviewed_on": editorial["reviewed_on"] if editorial else PLAN["reviewed_on"],
            "sources": PLAN["sources"],
            "pool_count": len(verified),
            "champion_count": len({q["champion"] for q in verified}),
            "excluded": excluded,
            "audio_checks": checks,
            "preserved_community_count": community_count,
            "reviewed_addition_count": len(accepted) - community_count,
        }
        folder = "featured-expansion" if editorial else "featured-review"
        path = ROOT.parent / "output" / folder / "audit.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        target = editorial["target_count"] if editorial else len(accepted)
        if len(verified) != target or target < 12:
            raise RuntimeError(
                f"Only {len(verified)}/{target} audio addresses verified; pool was not overwritten. "
                f"Inspect {path} for failed requests."
            )
        destination = ROOT / "public" / "data" / "curated_quotes.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        staging = destination.with_suffix(".json.tmp")
        staging.write_text(
            json.dumps(verified, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        staging.replace(destination)
        print("WROTE", len(verified), "verified quotes to", destination)
    print("Matched:", len(accepted), "Excluded:", len(excluded))


if __name__ == "__main__":
    main()

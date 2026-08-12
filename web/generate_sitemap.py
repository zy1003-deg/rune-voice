# -*- coding: utf-8 -*-
"""Generate a sitemap.xml from a champions.json file.

The base URL is configurable:
- CLI:     python web/generate_sitemap.py --base-url https://example.com
- Env:     LOL_VOICE_SITE_BASE_URL=https://example.com
- Default: https://example.com  (placeholder, NOT a real production host)

Usage:
  python web/generate_sitemap.py
  python web/generate_sitemap.py --base-url https://your-site.example.com
"""
import argparse
import json
import os
import xml.sax.saxutils as saxutils
from urllib.parse import quote

# Safe placeholder default; operators MUST override for real deployment.
DEFAULT_BASE_URL = "https://example.com"

WEB_PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
DEFAULT_CHAMPIONS_FILE = os.path.join(WEB_PUBLIC, "data", "champions.json")
DEFAULT_OUT_FILE = os.path.join(WEB_PUBLIC, "sitemap.xml")


def parse_args():
    parser = argparse.ArgumentParser(description="Generate sitemap.xml from champions.json")
    parser.add_argument(
        "--base-url",
        type=str,
        default=os.environ.get("LOL_VOICE_SITE_BASE_URL", DEFAULT_BASE_URL),
        help=(
            "Base URL for sitemap entries. "
            "Defaults to env LOL_VOICE_SITE_BASE_URL or https://example.com."
        ),
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        default=os.environ.get("LOL_VOICE_CHAMPIONS_FILE", DEFAULT_CHAMPIONS_FILE),
        help="Path to champions.json (default: bundled demo or operator output).",
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=os.environ.get("LOL_VOICE_SITEMAP_OUT", DEFAULT_OUT_FILE),
        help="Where to write sitemap.xml.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    base_url = args.base_url.rstrip("/")

    if base_url == DEFAULT_BASE_URL:
        print(
            "WARNING: --base-url is the placeholder default "
            f"({DEFAULT_BASE_URL}). Override via --base-url or "
            "LOL_VOICE_SITE_BASE_URL for any real deployment."
        )

    if not os.path.isfile(args.input):
        print(f"champions.json not found at {args.input}; nothing to do.")
        return

    with open(args.input, encoding="utf-8") as f:
        champions = json.load(f)

    urls = [(base_url + "/", 1.0)]
    for c in champions:
        name = c.get("name", "")
        if not name:
            continue
        loc = f"{base_url}/#/champion/{quote(name)}"
        urls.append((loc, 0.8))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for loc, prio in urls:
        lines.append("  <url>")
        lines.append(f"    <loc>{saxutils.escape(loc)}</loc>")
        lines.append(f"    <priority>{prio}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")

    with open(args.output, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"sitemap.xml: {len(urls)} urls -> {args.output}")


if __name__ == "__main__":
    main()

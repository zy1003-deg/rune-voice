# -*- coding: utf-8 -*-
"""
Rune Voice crawler entry point.

Usage:
  python main.py                          # crawl everything
  python main.py --mode search            # list entities only
  python main.py --champions Ahri,Yasuo   # specify entities
  python main.py --output ./data/audio    # specify audio output path
"""

import argparse
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def parse_args():
    parser = argparse.ArgumentParser(description="Rune Voice crawler")
    parser.add_argument(
        "--mode", "-m",
        choices=["search", "full"],
        default="full",
        help="Mode: search=list entities only, full=download everything (default: full)"
    )
    parser.add_argument(
        "--champions", "-c",
        type=str, default="",
        help="Filter entities by alias (comma-separated), e.g. Ahri,Yasuo"
    )
    parser.add_argument(
        "--output", "-o",
        type=str, default="",
        help=(
            "Audio output directory. Default reads LOL_VOICE_AUDIO_STORE_PATH "
            "from env, otherwise ./data/audio."
        ),
    )
    return parser.parse_args()


def main():
    args = parse_args()

    import config
    from core.crawler import LolVoiceCrawler

    if args.champions:
        config.CHAMPION_ID_LIST = [c.strip() for c in args.champions.split(",") if c.strip()]
    if args.output:
        config.AUDIO_STORE_PATH = args.output

    crawler = LolVoiceCrawler()
    asyncio.run(crawler.start(mode=args.mode))


if __name__ == "__main__":
    main()

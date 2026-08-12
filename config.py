# -*- coding: utf-8 -*-
"""
Rune Voice crawler configuration.

All values can be overridden by environment variables. See `.env.example` at
the repository root for the full list and defaults.
"""
import os


def _env_str(name: str, default: str) -> str:
    value = os.environ.get(name)
    return value if value not in (None, "") else default


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_list(name: str, default: list) -> list:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return list(default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ========== 爬取目标 ==========
# 指定英雄ID列表（使用英文别名），空列表 = 全部英雄
CHAMPION_ID_LIST = _env_list("LOL_VOICE_CHAMPION_ID_LIST", [])

# ========== 音频下载 ==========
# 音频存储根目录（按英雄/皮肤自动分类）。
# Default points at a portable relative path so fresh clones work on any
# platform. Operators can override via the env var below.
AUDIO_STORE_PATH = _env_str("LOL_VOICE_AUDIO_STORE_PATH", "./data/audio")

# ========== 并发配置 ==========
# 最大并发下载数
MAX_CONCURRENCY = _env_int("LOL_VOICE_MAX_CONCURRENCY", 5)

# ========== API / CDN 地址 ==========
# Both must be supplied by the operator. We deliberately do NOT ship a real
# default URL — point these at whichever third-party voice metadata host you
# have permission to use (e.g. an officially published data source for your
# game of interest). See `.env.example` for placeholders.
API_BASE = _env_str("LOL_VOICE_API_BASE", "")
CDN_BASE = _env_str("LOL_VOICE_CDN_BASE", "")

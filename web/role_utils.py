# -*- coding: utf-8 -*-
"""英雄职业（role）抓取与映射的共享工具。

generate_data.py 与 add_roles.py 共用此模块，避免两套不一致的抓取逻辑。
"""
import json
import os
import urllib.request

# API endpoint is operator-supplied — no real default URL is shipped.
# See `.env.example` (LOL_VOICE_API_BASE).
API_BASE = os.environ.get("LOL_VOICE_API_BASE", "").rstrip("/")

# 中文职业 -> 英文 key（与前端 RoleTabs.jsx 的 ROLES 一致）
ROLE_MAP = {
    "刺客": "assassin",
    "战士": "fighter",
    "法师": "mage",
    "射手": "marksman",
    "辅助": "support",
    "坦克": "tank",
}


def _normalize_role(raw):
    """把 API 返回的原始职业字段统一成英文 key。"""
    if not raw:
        return ""
    if isinstance(raw, list):
        raw = raw[0] if raw else ""
    if not isinstance(raw, str):
        return ""
    raw = raw.strip()
    # 已是英文 key
    if raw.lower() in ROLE_MAP.values():
        return raw.lower()
    # 中文 -> 英文
    if raw in ROLE_MAP:
        return ROLE_MAP[raw]
    # 兜底：直接小写（API 偶尔返回大小写不一的英文）
    return raw.lower()


def fetch_champion_roles():
    """从 API 拉取英雄列表，返回 {英雄名: 英文 role key}。"""
    return {name: info["role"] for name, info in fetch_champion_meta().items()}


def fetch_champion_meta():
    """从 API 拉取英雄列表，返回 {英雄名: {alias, role}}。"""
    url = f"{API_BASE}/lol-champions/v1/champions"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read())
    if isinstance(body, dict) and body.get("code") == 0:
        body = body["body"]

    result = {}
    for c in body:
        name = c.get("name", "")
        if not name:
            continue
        raw = c.get("roles") or c.get("tags") or ""
        result[name] = {
            "alias": c.get("alias", ""),
            "role": _normalize_role(raw),
        }
    return result


if __name__ == "__main__":
    roles = fetch_champion_roles()
    print(f"Fetched {len(roles)} champions")
    for n, r in list(roles.items())[:5]:
        print(f"  {n}: {r}")

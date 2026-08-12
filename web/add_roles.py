# -*- coding: utf-8 -*-
"""从 API 获取每个英雄的职业，更新 champions.json 中的 role 字段。
用法: python web/add_roles.py

依赖 role_utils.fetch_champion_roles()，与 generate_data.py 共用同一套抓取逻辑。
"""
import json
import os

from role_utils import fetch_champion_roles

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "data")
CHAMPIONS_FILE = os.path.join(DATA_DIR, "champions.json")


def main():
    print("Fetching roles from API...")
    role_map = fetch_champion_roles()
    print(f"Fetched {len(role_map)} champions")

    with open(CHAMPIONS_FILE, "r", encoding="utf-8") as f:
        champions = json.load(f)

    updated_count = 0
    for champ in champions:
        name = champ["name"]
        role = role_map.get(name, "")
        champ["role"] = role
        if role:
            updated_count += 1

    with open(CHAMPIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(champions, f, ensure_ascii=False, indent=2)

    print(f"Updated {updated_count} out of {len(champions)} champions with roles.")


if __name__ == "__main__":
    main()

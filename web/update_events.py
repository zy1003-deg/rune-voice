"""
从 API 获取每个英雄每个皮肤的事件分类，更新 quotes/*.json 中的 event 字段。
用法: python web/update_events.py
"""
import asyncio
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import config
from core.client import LolVoiceClient

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "data")
QUOTES_DIR = os.path.join(DATA_DIR, "quotes")


async def main():
    client = LolVoiceClient(api_base=config.API_BASE, cdn_base=config.CDN_BASE)

    print("正在获取英雄列表...")
    champions = await client.get_champion_list()
    if not champions:
        print("获取英雄列表失败")
        return

    print(f"共 {len(champions)} 个英雄")

    # 加载 champions.json
    with open(os.path.join(DATA_DIR, "champions.json"), encoding="utf-8") as f:
        index = json.load(f)
    # name_to_champ is intentionally loaded for future use; suppress lint
    _ = {c["name"]: c for c in index}

    total = len(champions)
    updated_count = 0

    for idx, champ in enumerate(champions, 1):
        cid = str(champ.get("id", ""))
        cname = champ.get("name", "")

        # 检查是否有对应的 quote 文件
        quote_file = os.path.join(QUOTES_DIR, f"{cname}.json")
        if not os.path.exists(quote_file):
            continue

        # 加载现有台词数据
        with open(quote_file, encoding="utf-8") as f:
            quotes = json.load(f)

        # 建立 text -> event 映射
        text_to_event = {}

        # 1. 获取语音概况（选人/禁用）
        try:
            info = await client.get_champion_voice_info(cid)
        except Exception as e:
            print(f"[{idx}/{total}] {cname}: 获取语音信息失败 - {e}")
            continue

        if not info:
            continue

        versions = info.get("version", [])
        skins = info.get("skins", [])
        version = versions[0] if versions else "latest"

        # 选人/禁用
        select = info.get("select", {})
        choose_text = select.get("choose", "")
        ban_text = select.get("ban", "")
        if choose_text:
            text_to_event[choose_text] = "选人"
        if ban_text:
            text_to_event[ban_text] = "禁用"

        # 2. 获取皮肤名映射
        try:
            skins_data = await client.get_skins_info(cid)
        except Exception:
            skins_data = {}
        if not isinstance(skins_data, dict):
            skins_data = {}

        # 3. 遍历皮肤获取事件分类
        for skin_id in skins:
            skin_info = skins_data.get(skin_id, {})
            skin_name = skin_info.get("name", skin_id)
            if skin_info.get("isBase"):
                skin_name += " 默认皮肤"

            try:
                data = await client.get_skin_voice_data(cid, skin_id, version)
            except Exception:
                continue

            if not data or not data.get("events"):
                continue

            events = data.get("events", {})
            transcript = data.get("transcript", {})

            for event in events.values():
                event_name = event.get("name", "")
                # 提取主分类（第一个冒号前）
                main_cat = event_name.split(":")[0] if ":" in event_name else event_name
                for voice_id in event.get("voices", []):
                    text = transcript.get(voice_id, {}).get("text", "")
                    if text:
                        text_to_event[text] = main_cat

        # 4. 更新 quotes 中的 event 字段
        changed = 0
        for q in quotes:
            text = q.get("text", "")
            # 精确匹配
            if text in text_to_event:
                new_event = text_to_event[text]
                if q.get("event") != new_event:
                    q["event"] = new_event
                    changed += 1
            else:
                # 去掉 _N 后缀再匹配（爬虫去重时添加的）
                base_text = re.sub(r'_\d+$', '', text)
                if base_text in text_to_event:
                    new_event = text_to_event[base_text]
                    if q.get("event") != new_event:
                        q["event"] = new_event
                        changed += 1

        if changed > 0:
            with open(quote_file, "w", encoding="utf-8") as f:
                json.dump(quotes, f, ensure_ascii=False)
            updated_count += 1
            print(f"[{idx}/{total}] {cname}: 更新了 {changed} 条台词的事件分类")
        else:
            print(f"[{idx}/{total}] {cname}: 无需更新")

    await client.close()
    print(f"\n完成! 更新了 {updated_count} 个英雄的事件分类")


if __name__ == "__main__":
    asyncio.run(main())

"""
生成轻量级搜索索引：只保留台词文本、英雄名、事件，用于全局搜索。
用法: python web/generate_search_index.py
"""
import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "data")
QUOTES_DIR = os.path.join(DATA_DIR, "quotes")


def main():
    index = []
    for f in sorted(os.listdir(QUOTES_DIR)):
        if not f.endswith(".json"):
            continue
        champ_name = f[:-5]
        with open(os.path.join(QUOTES_DIR, f), encoding="utf-8") as fh:
            quotes = json.load(fh)
        for q in quotes:
            index.append({
                "text": q.get("text", ""),
                "champion": champ_name,
                "event": q.get("event", ""),
                "skin": q.get("skin", ""),
            })

    out_path = os.path.join(DATA_DIR, "search_index.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False)

    size_mb = os.path.getsize(out_path) / 1024 / 1024
    print(f"搜索索引: {len(index)} 条台词, {size_mb:.1f} MB")


if __name__ == "__main__":
    main()

"""
Scan the local audio tree and emit per-entity JSON metadata.

Paths are env-driven (LOL_VOICE_AUDIO_STORE_PATH) so the script works
on any platform without hardcoded developer paths.
"""
import json
import os

from role_utils import fetch_champion_meta

# Audio tree root. Default: <repo>/data/audio (relative, portable).
# Override via env: LOL_VOICE_AUDIO_STORE_PATH=/path/to/audio
AUDIO_ROOT = os.environ.get("LOL_VOICE_AUDIO_STORE_PATH", "./data/audio")

# Output directory. Default: ./data/output (operator-uploads to CDN).
# Override via env: LOL_VOICE_OUTPUT_PATH=/path/to/output
DEFAULT_OUTPUT_DIR = "./data/output"
DATA_DIR = os.environ.get("LOL_VOICE_OUTPUT_PATH", DEFAULT_OUTPUT_DIR)
QUOTES_DIR = os.path.join(DATA_DIR, "quotes")


def extract_text_from_filename(filename):
    """从文件名提取台词文本：去掉 .mp3 后缀，去掉事件前缀"""
    name = filename[:-4] if filename.endswith(".mp3") else filename
    # 去掉 禁用_ / 选人_ 前缀
    for prefix in ("禁用_", "选人_"):
        if name.startswith(prefix):
            name = name[len(prefix):]
    return name


def scan_champion(champ_name):
    """扫描一个英雄目录，返回 quotes 列表和 skins 列表"""
    champ_path = os.path.join(AUDIO_ROOT, champ_name)
    if not os.path.isdir(champ_path):
        return [], []

    quotes = []
    skins = []

    items = os.listdir(champ_path)

    # 1. 顶层 MP3：选人/禁用语音
    for f in sorted(items):
        if f.endswith(".mp3"):
            event = ""
            if f.startswith("禁用_"):
                event = "禁用"
            elif f.startswith("选人_"):
                event = "选人"
            quotes.append({
                "skin": "默认皮肤",
                "event": event,
                "text": extract_text_from_filename(f),
                "file": f,
                "dir": champ_name,
            })

    # 2. 皮肤子目录
    for skin_dir in sorted(items):
        skin_path = os.path.join(champ_path, skin_dir)
        if not os.path.isdir(skin_path):
            continue
        skins.append(skin_dir)
        for f in sorted(os.listdir(skin_path)):
            if f.endswith(".mp3"):
                quotes.append({
                    "skin": skin_dir,
                    "event": "",
                    "text": extract_text_from_filename(f),
                    "file": f,
                    "dir": f"{champ_name}/{skin_dir}",
                })

    return quotes, skins


def main():
    print("正在从 API 获取英雄列表...")
    champ_info = fetch_champion_meta()
    print(f"API 返回 {len(champ_info)} 个英雄")

    os.makedirs(QUOTES_DIR, exist_ok=True)

    # 扫描音频目录
    if not os.path.isdir(AUDIO_ROOT):
        print(f"音频目录不存在: {AUDIO_ROOT}")
        print("请通过 LOL_VOICE_AUDIO_STORE_PATH 指定本地音频树。")
        return

    champ_names = sorted([
        d for d in os.listdir(AUDIO_ROOT)
        if os.path.isdir(os.path.join(AUDIO_ROOT, d)) and not d.startswith("_")
    ])
    print(f"音频目录有 {len(champ_names)} 个英雄")

    champions_index = []
    total_quotes = 0

    for champ_name in champ_names:
        quotes, skins = scan_champion(champ_name)

        # 获取英文别名和角色
        info = champ_info.get(champ_name, {})
        alias = info.get("alias", "")
        role = info.get("role", "")

        # 写入单个英雄的台词文件
        quote_file = f"{champ_name}.json"
        with open(os.path.join(QUOTES_DIR, quote_file), "w", encoding="utf-8") as f:
            json.dump(quotes, f, ensure_ascii=False)

        champions_index.append({
            "name": champ_name,
            "alias": alias,
            "role": role,
            "quoteCount": len(quotes),
            "skins": skins,
            "file": quote_file,
        })
        total_quotes += len(quotes)

    # 写入 champions.json
    with open(os.path.join(DATA_DIR, "champions.json"), "w", encoding="utf-8") as f:
        json.dump(champions_index, f, ensure_ascii=False, indent=2)

    print("\n完成!")
    print(f"  英雄数: {len(champions_index)}")
    print(f"  总台词: {total_quotes}")
    print(f"  输出: {DATA_DIR}")


if __name__ == "__main__":
    main()

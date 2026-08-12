# -*- coding: utf-8 -*-
import asyncio
import hashlib

import config
from core.client import LolVoiceClient
from store.audio_store import AudioStore
from utils.help import build_ban_url, build_choose_url, build_voice_url
from utils.logger import logger


class LolVoiceCrawler:
    """LOL 英雄联盟语音爬虫 — API 并发下载方案"""

    def __init__(self):
        self.client = LolVoiceClient(api_base=config.API_BASE, cdn_base=config.CDN_BASE)
        self.audio_store = AudioStore(config.AUDIO_STORE_PATH, enable_wem_conversion=True)
        self._semaphore = asyncio.Semaphore(config.MAX_CONCURRENCY)
        self._download_count = 0
        self._skip_count = 0
        self._error_count = 0

    async def start(self, mode: str = "full"):
        logger.info("=" * 60)
        logger.info("LOL 英雄联盟语音爬虫启动（API 方案）")
        logger.info(f"存储路径: {config.AUDIO_STORE_PATH}")
        if config.CHAMPION_ID_LIST:
            logger.info(f"指定英雄: {config.CHAMPION_ID_LIST}")
        else:
            logger.info("目标: 全部英雄")
        logger.info("=" * 60)

        try:
            champions = await self.client.get_champion_list()
            if not champions:
                logger.error("获取英雄列表失败")
                return

            if config.CHAMPION_ID_LIST:
                target = {c.lower() for c in config.CHAMPION_ID_LIST}
                champions = [c for c in champions if c.get("alias", "").lower() in target]
                logger.info(f"筛选后: {len(champions)} 个英雄")

            if mode == "search":
                for c in champions:
                    logger.info(f"  {c.get('name')} ({c.get('alias')}) id={c.get('id')}")
                return

            total = len(champions)
            for idx, champ in enumerate(champions, 1):
                cname = champ.get("name", "")
                calias = champ.get("alias", "")
                logger.info(f"[{idx}/{total}] {cname} ({calias})")
                try:
                    await self._crawl_champion(champ)
                except Exception as e:
                    logger.error(f"  {cname} 异常: {e}", exc_info=True)
                    self._error_count += 1

        except KeyboardInterrupt:
            logger.info("用户中断")
        except Exception as e:
            logger.error(f"爬虫异常: {e}", exc_info=True)
        finally:
            await self.client.close()
            logger.info(f"完成！下载 {self._download_count}，跳过 {self._skip_count}，失败 {self._error_count}")

    async def _crawl_champion(self, champion: dict):
        cid = str(champion.get("id", ""))
        cname = champion.get("name", "")

        # 1. 获取语音概况
        info = await self.client.get_champion_voice_info(cid)
        if not info:
            logger.warning(f"  {cname}: 获取语音信息失败")
            return

        versions = info.get("version", [])
        skins = info.get("skins", [])
        version = versions[0] if versions else "latest"

        # 2. 获取皮肤名映射
        skins_data = await self.client.get_skins_info(cid)
        if not isinstance(skins_data, dict):
            skins_data = {}

        # 3. 选人/禁用语音（MP3，存英雄根目录）
        select = info.get("select", {})
        choose_text = select.get("choose", "")
        ban_text = select.get("ban", "")

        if choose_text:
            url = build_choose_url(config.CDN_BASE, version, cid)
            await self._download_audio(url, cname, "", f"选人_{choose_text}.mp3", is_wem=False, is_root=True)
        if ban_text:
            url = build_ban_url(config.CDN_BASE, version, cid)
            await self._download_audio(url, cname, "", f"禁用_{ban_text}.mp3", is_wem=False, is_root=True)

        # 4. 遍历有语音的皮肤
        for skin_id in skins:
            skin_info = skins_data.get(skin_id, {})
            skin_name = skin_info.get("name", skin_id)
            if skin_info.get("isBase"):
                skin_name += " 默认皮肤"
            data = await self.client.get_skin_voice_data(cid, skin_id, version)
            if not data or not data.get("events"):
                continue

            events = data.get("events", {})
            transcript = data.get("transcript", {})
            voice_count = sum(len(e.get("voices", [])) for e in events.values())
            logger.info(f"  [{skin_name}] {len(events)} 事件, {voice_count} 条语音")

            # 收集该皮肤所有下载任务
            tasks = []
            seen_codes = set()
            used_filenames = {}  # filename -> count, 用于去重
            for event in events.values():
                for code in event.get("voices", []):
                    if code in seen_codes:
                        continue
                    seen_codes.add(code)
                    text = transcript.get(code, {}).get("text", code)
                    safe_text = self._safe_filename(text)
                    filename = f"{safe_text}.mp3"
                    # 处理同名文件：追加序号
                    if filename in used_filenames:
                        used_filenames[filename] += 1
                        filename = f"{safe_text}_{used_filenames[filename]}.mp3"
                    else:
                        used_filenames[filename] = 1
                    url = build_voice_url(config.CDN_BASE, version, skin_id, code)
                    tasks.append(self._download_audio(url, cname, skin_name, filename, is_wem=True))

            if tasks:
                await asyncio.gather(*tasks)

    async def _download_audio(self, url: str, champion_name: str, skin_name: str, filename: str, is_wem: bool, is_root: bool = False):
        """下载单个音频文件（带并发控制和去重）"""
        async with self._semaphore:
            # 检查目标文件是否已存在
            if is_root:
                save_path = self.audio_store.base_path / champion_name / filename
            else:
                save_path = self.audio_store.base_path / champion_name / skin_name / filename
            if save_path.exists():
                self._skip_count += 1
                return

            content = await self.client.download_audio(url)
            if content is None:
                self._error_count += 1
                return

            success = await self.audio_store.save_audio(
                champion_name=champion_name,
                skin_name=skin_name,
                filename=filename,
                content=content,
                is_wem=is_wem,
                is_root=is_root,
            )
            if success:
                self._download_count += 1
                if self._download_count % 50 == 0:
                    logger.info(f"  [进度] 已下载 {self._download_count} 个文件")
            else:
                self._error_count += 1

    @staticmethod
    def _safe_filename(text: str) -> str:
        """清理文件名中的非法字符并截断长度，避免超长台词撞 Windows 260 路径上限。"""
        illegal = r'<>:"/\|?*'
        for ch in illegal:
            text = text.replace(ch, "_")
        text = text.strip()
        # 截断到 120 字符，再用文本哈希后缀保证唯一性，避免同前缀冲突
        if len(text) > 120:
            digest = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
            text = f"{text[:120]}_{digest}"
        return text

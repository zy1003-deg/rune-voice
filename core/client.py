# -*- coding: utf-8 -*-
import asyncio
from typing import Optional

import httpx

from utils.help import get_skin_suffix
from utils.logger import logger


class LolVoiceClient:
    """LOL 语音 API 客户端，纯 HTTP 请求，带重试"""

    def __init__(self, api_base: str, cdn_base: str, timeout: int = 30, max_retries: int = 3):
        self._api_base = api_base
        self._cdn_base = cdn_base
        self._timeout = timeout
        self._max_retries = max_retries
        self._client = httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
        )

    async def close(self):
        await self._client.aclose()

    async def _request(self, method: str, url: str, **kwargs) -> dict:
        for attempt in range(1, self._max_retries + 1):
            try:
                resp = await self._client.request(method, url, **kwargs)
                if resp.status_code == 200:
                    data = resp.json()
                    return data
                elif resp.status_code in (403, 429):
                    logger.warning(f"[Client] 请求被拦截 (HTTP {resp.status_code}): {url}")
                    if attempt < self._max_retries:
                        wait = attempt * 2
                        logger.info(f"[Client] {wait}秒后重试 (第{attempt}次)...")
                        await asyncio.sleep(wait)
                        continue
                logger.error(f"[Client] HTTP {resp.status_code}: {url}")
                return {}
            except httpx.TimeoutException:
                logger.warning(f"[Client] 请求超时 (第{attempt}次): {url}")
                if attempt < self._max_retries:
                    await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"[Client] 请求异常: {e}")
                return {}
        return {}

    # ========== 公开 API 方法 ==========

    async def get_champion_list(self) -> list:
        """获取全部英雄列表"""
        data = await self._request("GET", f"{self._api_base}/lol-champions/v1/champions")
        if isinstance(data, dict) and data.get("code") == 0:
            return data.get("body", [])
        return data if isinstance(data, list) else []

    async def get_champion_voice_info(self, champion_id: str) -> dict:
        """获取英雄的语音信息（可用版本、皮肤列表）"""
        data = await self._request("GET", f"{self._api_base}/lol-voice/v1/champions/{champion_id}")
        if isinstance(data, dict) and data.get("code") == 0:
            return data.get("body", {})
        return data if isinstance(data, dict) else {}

    async def get_skin_voice_data(self, champion_id: str, skin_id: str, version: str) -> dict:
        """获取某皮肤的全部语音事件"""
        skin_suffix = get_skin_suffix(skin_id)
        url = f"{self._api_base}/lol-voice/v1/champions/{champion_id}/{skin_suffix}"
        data = await self._request("GET", url, params={"GameVersion": version})
        if isinstance(data, dict) and data.get("code") == 0:
            return data.get("body", {})
        return {}

    async def get_skins_info(self, champion_id: str) -> dict:
        """获取英雄的皮肤列表"""
        data = await self._request("GET", f"{self._api_base}/lol-skins/v1/champions/{champion_id}")
        if isinstance(data, dict) and data.get("code") == 0:
            return data.get("body", {})
        return data if isinstance(data, dict) else {}

    async def download_audio(self, url: str) -> Optional[bytes]:
        """从 CDN 下载音频文件，返回原始字节"""
        for attempt in range(1, self._max_retries + 1):
            try:
                resp = await self._client.get(url)
                if resp.status_code == 200:
                    return resp.content
                elif resp.status_code == 404:
                    logger.warning(f"[下载] 文件不存在: {url}")
                    return None
                else:
                    logger.warning(f"[下载] HTTP {resp.status_code}: {url}")
                    if attempt < self._max_retries:
                        await asyncio.sleep(1)
            except httpx.TimeoutException:
                logger.warning(f"[下载] 超时 (第{attempt}次): {url}")
                if attempt < self._max_retries:
                    await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"[下载] 异常: {e}")
                return None
        return None

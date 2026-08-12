# -*- coding: utf-8 -*-
import asyncio
import json
import pathlib
from typing import List

import aiofiles


class DataStore:
    """元数据存储，支持 JSON / JSONL / CSV 格式"""

    def __init__(self, save_path: str, fmt: str = "jsonl"):
        self.save_path = pathlib.Path(save_path)
        self.fmt = fmt.lower()
        self._lock = asyncio.Lock()
        self.save_path.mkdir(parents=True, exist_ok=True)

    async def save_champion(self, champion: dict):
        """保存单个英雄元数据"""
        async with self._lock:
            file_path = self.save_path / f"champions.{self.fmt}"
            await self._append(file_path, champion)

    async def save_voice_events(self, events: List[dict]):
        """批量保存语音事件"""
        if not events:
            return
        async with self._lock:
            file_path = self.save_path / f"voice_events.{self.fmt}"
            for event in events:
                await self._append(file_path, event)

    async def save_voice_event(self, event: dict):
        """保存单条语音事件"""
        async with self._lock:
            file_path = self.save_path / f"voice_events.{self.fmt}"
            await self._append(file_path, event)

    async def _append(self, file_path: pathlib.Path, item: dict):
        if self.fmt == "jsonl":
            await self._write_jsonl(file_path, item)
        elif self.fmt == "json":
            await self._write_json(file_path, item)
        elif self.fmt == "csv":
            await self._write_csv(file_path, item)

    async def _write_jsonl(self, file_path: pathlib.Path, item: dict):
        line = json.dumps(item, ensure_ascii=False) + "\n"
        async with aiofiles.open(file_path, "a", encoding="utf-8") as f:
            await f.write(line)

    async def _write_json(self, file_path: pathlib.Path, item: dict):
        items = []
        if file_path.exists():
            try:
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    content = await f.read()
                    if content.strip():
                        items = json.loads(content)
            except (json.JSONDecodeError, Exception):
                items = []
        items.append(item)
        async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
            await f.write(json.dumps(items, ensure_ascii=False, indent=2))

    async def _write_csv(self, file_path: pathlib.Path, item: dict):
        write_header = not file_path.exists() or file_path.stat().st_size == 0
        async with aiofiles.open(file_path, "a", encoding="utf-8", newline="") as f:
            if write_header:
                await f.write(",".join(item.keys()) + "\n")
            await f.write(",".join(str(v).replace(",", "，") for v in item.values()) + "\n")

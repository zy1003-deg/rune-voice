# -*- coding: utf-8 -*-
import pathlib

import aiofiles

from utils.help import convert_wem_to_mp3
from utils.logger import logger


class AudioStore:
    """音频文件存储，负责下载后的文件写入和 WEM→MP3 转换"""

    def __init__(self, base_path: str, enable_wem_conversion: bool = True):
        self.base_path = pathlib.Path(base_path)
        self.enable_wem_conversion = enable_wem_conversion

    def _make_path(self, champion_name: str, skin_name: str, filename: str) -> pathlib.Path:
        return self.base_path / champion_name / skin_name / filename

    def _make_root_path(self, champion_name: str, filename: str) -> pathlib.Path:
        return self.base_path / champion_name / filename

    async def save_audio(
        self,
        champion_name: str,
        skin_name: str,
        filename: str,
        content: bytes,
        is_wem: bool = False,
        is_root: bool = False,
    ) -> bool:
        """
        保存音频文件。
        is_root=True: 保存到 {champion_name}/ 根目录（选人/禁用/SFX）
        is_root=False: 保存到 {champion_name}/{skin_name}/ 子目录（游戏内语音）
        """
        if is_root:
            save_path = self._make_root_path(champion_name, filename)
        else:
            save_path = self._make_path(champion_name, skin_name, filename)

        # 去重：如果目标 MP3 已存在则跳过
        if save_path.suffix == ".mp3" and save_path.exists():
            logger.info(f"[存储] 已存在，跳过: {save_path.name}")
            return True

        # 写入文件
        save_path.parent.mkdir(parents=True, exist_ok=True)

        if is_wem and self.enable_wem_conversion:
            # 先写 WEM 临时文件，再转换为 MP3
            wem_path = save_path.with_suffix(".wem")
            async with aiofiles.open(wem_path, "wb") as f:
                await f.write(content)
            logger.info(f"[存储] WEM 已下载: {wem_path.name}")

            mp3_path = save_path.with_suffix(".mp3")
            if mp3_path.exists():
                wem_path.unlink(missing_ok=True)
                return True

            success = await convert_wem_to_mp3(str(wem_path), str(mp3_path))
            if success:
                wem_path.unlink(missing_ok=True)
                logger.info(f"[转换] WEM→MP3 成功: {mp3_path.name}")
                return True
            else:
                logger.warning(f"[转换] WEM 保留原始格式: {wem_path.name}")
                return True
        else:
            async with aiofiles.open(save_path, "wb") as f:
                await f.write(content)
            logger.info(f"[存储] 已保存: {save_path.name}")
            return True

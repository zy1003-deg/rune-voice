# -*- coding: utf-8 -*-
import asyncio
import logging
import os
import pathlib
import shutil

logger = logging.getLogger("lol_voice")

# 本地 vgmstream-cli 路径
_VGMSTREAM_DIR = pathlib.Path(__file__).parent.parent / "tools" / "vgmstream"
_VGMSTREAM_EXE = _VGMSTREAM_DIR / "vgmstream-cli.exe"


def get_skin_suffix(skin_id: str) -> str:
    """取皮肤ID后3位，如 '1000' -> '000', '1015' -> '015'"""
    return str(skin_id).zfill(3)[-3:]


def pad_skin_id(skin_id: str) -> str:
    """将皮肤ID补零到6位，如 '1000' -> '001000'"""
    return str(skin_id).zfill(6)


def build_choose_url(cdn_base: str, version: str, champion_id: str) -> str:
    """Build a select-voice MP3 URL for the given upstream layout."""
    return f"{cdn_base}/voice/audios/{version}/vo/zh-CN/champion-choose-vo/{champion_id}.mp3"


def build_ban_url(cdn_base: str, version: str, champion_id: str) -> str:
    """Build a ban-voice MP3 URL for the given upstream layout."""
    return f"{cdn_base}/voice/audios/{version}/vo/zh-CN/champion-ban-vo/{champion_id}.mp3"


def build_sfx_url(cdn_base: str, version: str, champion_id: str) -> str:
    """Build an SFX MP3 URL for the given upstream layout."""
    return f"{cdn_base}/voice/audios/{version}/sfx/champion-sfx-audios/{champion_id}.mp3"


def build_voice_url(cdn_base: str, version: str, skin_id: str, voice_code: str) -> str:
    """Build an in-game voice WEM URL; skin_id is zero-padded to 6 digits."""
    skin_id_6 = pad_skin_id(skin_id)
    return f"{cdn_base}/voice/audios/{version}/vo/zh-CN/champions/{skin_id_6}/{voice_code}.wem"


def normalize_champion_data(raw: dict) -> dict:
    """将原始英雄 API 数据标准化为存储格式"""
    return {
        "champion_id": str(raw.get("id", "")),
        "alias": raw.get("alias", ""),
        "name": raw.get("name", ""),
        "description": raw.get("description", ""),
        "roles": raw.get("roles", []),
        "keywords": raw.get("keywords", ""),
        "instance_id": raw.get("instanceId", ""),
        "square_portrait_path": raw.get("squarePortraitPath", ""),
    }


def normalize_voice_event(
    champion_id: str,
    champion_name: str,
    skin_id: str,
    skin_name: str,
    game_version: str,
    event_name: str,
    voice_code: str,
    transcript: str,
    cdn_base: str,
) -> dict:
    """将单条语音事件标准化为存储格式"""
    audio_url = build_voice_url(cdn_base, game_version, skin_id, voice_code)
    return {
        "champion_id": champion_id,
        "champion_name": champion_name,
        "skin_id": skin_id,
        "skin_name": skin_name,
        "game_version": game_version,
        "event_name": event_name,
        "voice_code": voice_code,
        "transcript": transcript,
        "audio_url": audio_url,
        "audio_type": "ingame_voice",
    }


def _find_vgmstream() -> str:
    """查找 vgmstream-cli 可执行文件，优先本地 tools 目录"""
    if _VGMSTREAM_EXE.exists():
        return str(_VGMSTREAM_EXE)
    system_path = shutil.which("vgmstream-cli")
    if system_path:
        return system_path
    return ""


def _find_ffmpeg() -> str:
    """查找 ffmpeg 可执行文件"""
    return shutil.which("ffmpeg") or ""


def check_vgmstream_available() -> bool:
    """检查 vgmstream-cli 是否可用"""
    return bool(_find_vgmstream())


async def convert_wem_to_mp3(wem_path: str, mp3_path: str) -> bool:
    """
    将 WEM 转换为 MP3。
    流程: WEM -> WAV (vgmstream-cli) -> MP3 (ffmpeg)
    转换成功返回 True，失败返回 False。
    """
    vgmstream = _find_vgmstream()
    ffmpeg = _find_ffmpeg()

    if not vgmstream:
        logger.warning("[WEM转换] vgmstream-cli 未找到")
        logger.warning("[WEM转换] 请从 https://github.com/vgmstream/vgmstream/releases 下载")
        return False

    if not ffmpeg:
        logger.warning("[WEM转换] ffmpeg 未找到，将输出 WAV 格式")
        # 降级为 WAV 输出
        wav_path = os.path.splitext(mp3_path)[0] + ".wav"
        return await _run_vgmstream(vgmstream, wem_path, wav_path)

    # 步骤1: WEM -> WAV
    wav_path = os.path.splitext(wem_path)[0] + ".wav"
    ok = await _run_vgmstream(vgmstream, wem_path, wav_path)
    if not ok:
        return False

    # 步骤2: WAV -> MP3
    ok = await _run_ffmpeg(ffmpeg, wav_path, mp3_path)
    if ok:
        # 清理临时 WAV
        try:
            os.remove(wav_path)
        except OSError:
            pass
        return True
    else:
        # ffmpeg 失败，保留 WAV
        logger.warning(f"[WEM转换] MP3 转换失败，保留 WAV: {wav_path}")
        return False


async def _run_vgmstream(vgmstream: str, wem_path: str, out_path: str) -> bool:
    """运行 vgmstream-cli 解码 WEM -> WAV"""
    try:
        proc = await asyncio.create_subprocess_exec(
            vgmstream, "-o", out_path, wem_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
        if proc.returncode == 0:
            return True
        logger.warning(f"[vgmstream] 失败 (code={proc.returncode}): {stderr.decode(errors='replace')[:200]}")
        return False
    except asyncio.TimeoutError:
        logger.warning(f"[vgmstream] 超时: {wem_path}")
        return False
    except Exception as e:
        logger.warning(f"[vgmstream] 异常: {e}")
        return False


async def _run_ffmpeg(ffmpeg: str, wav_path: str, mp3_path: str) -> bool:
    """运行 ffmpeg 将 WAV 转换为 MP3"""
    try:
        proc = await asyncio.create_subprocess_exec(
            ffmpeg, "-y", "-i", wav_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
        if proc.returncode == 0:
            return True
        logger.warning(f"[ffmpeg] 失败 (code={proc.returncode}): {stderr.decode(errors='replace')[:200]}")
        return False
    except asyncio.TimeoutError:
        logger.warning(f"[ffmpeg] 超时: {wav_path}")
        return False
    except Exception as e:
        logger.warning(f"[ffmpeg] 异常: {e}")
        return False

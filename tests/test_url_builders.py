"""Tests for the URL builders in utils.help.

Fixtures use synthetic placeholder entities and a non-real CDN URL.
"""
from utils.help import (
    build_ban_url,
    build_choose_url,
    build_sfx_url,
    build_voice_url,
    get_skin_suffix,
    pad_skin_id,
)

CDN = "https://your-voice-api-host.example.com"
VERSION = "1.0.0"


def test_build_choose_url_basic():
    url = build_choose_url(CDN, VERSION, "1")
    assert url == (
        f"{CDN}/voice/audios/{VERSION}/vo/zh-CN/champion-choose-vo/1.mp3"
    )


def test_build_ban_url_basic():
    url = build_ban_url(CDN, VERSION, "1")
    assert url == (
        f"{CDN}/voice/audios/{VERSION}/vo/zh-CN/champion-ban-vo/1.mp3"
    )


def test_build_sfx_url_basic():
    url = build_sfx_url(CDN, VERSION, "1")
    assert url == (
        f"{CDN}/voice/audios/{VERSION}/sfx/champion-sfx-audios/1.mp3"
    )


def test_build_voice_url_pads_skin_id():
    # The voice metadata skin path is 6 digits — pad_skin_id('1000') == '001000'
    url = build_voice_url(CDN, VERSION, "1000", "VO_DEMO_001")
    assert url == (
        f"{CDN}/voice/audios/{VERSION}/vo/zh-CN/champions/001000/VO_DEMO_001.wem"
    )


def test_build_voice_url_with_already_padded_id():
    url = build_voice_url(CDN, VERSION, "001000", "VO_DEMO")
    assert "001000" in url
    assert url.endswith("VO_DEMO.wem")


def test_get_skin_suffix_takes_last_three_digits():
    assert get_skin_suffix("1000") == "000"
    assert get_skin_suffix("1015") == "015"
    assert get_skin_suffix("42") == "042"
    assert get_skin_suffix("0") == "000"


def test_pad_skin_id_zero_pads_to_six():
    assert pad_skin_id("1000") == "001000"
    assert pad_skin_id("42") == "000042"
    assert pad_skin_id("123456") == "123456"

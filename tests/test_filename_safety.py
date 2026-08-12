"""Tests for the crawler's filename sanitization.

Windows does not allow the characters < > : " / \\ | ? * in filenames and has
a 260-character path length cap. The crawler's `_safe_filename` strips the
illegal chars and truncates long names with a hash suffix.

Fixtures are fully synthetic — no third-party game content.
"""
from core.crawler import LolVoiceCrawler


def test_strips_illegal_characters():
    unsafe = 'f<>:"/\\|?*o'
    out = LolVoiceCrawler._safe_filename(unsafe)
    for ch in '<>:"/\\|?*':
        assert ch not in out
    # original letters preserved
    assert "f" in out and "o" in out


def test_handles_synthetic_unicode_characters():
    out = LolVoiceCrawler._safe_filename("这是一条测试语音。")
    assert out == "这是一条测试语音。"


def test_truncates_very_long_names_with_hash_suffix():
    long_name = "x" * 200
    out = LolVoiceCrawler._safe_filename(long_name)
    # Truncated prefix + "_" + 8 hex chars
    assert len(out) < len(long_name) + 10
    assert out.startswith("x" * 120)
    tail = out.rsplit("_", 1)[-1]
    assert len(tail) == 8
    int(tail, 16)  # raises if not hex


def test_short_names_are_not_truncated():
    out = LolVoiceCrawler._safe_filename("demo short text")
    assert out == "demo short text"


def test_collapsing_whitespace_at_edges():
    out = LolVoiceCrawler._safe_filename("  padded  ")
    assert out == "padded"

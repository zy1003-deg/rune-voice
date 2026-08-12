"""Tests for the JSON record normalizers in utils.help.

Fixtures are fully synthetic — no third-party game content.
"""
from utils.help import normalize_champion_data, normalize_voice_event


def test_normalize_champion_data_extracts_expected_fields():
    raw = {
        "id": 1,
        "alias": "demo_alpha",
        "name": "Demo Champion",
        "description": "A demo entity used for unit tests.",
        "roles": ["fighter", "tank"],
        "keywords": "demo,test",
        "instanceId": "1:1",
        "squarePortraitPath": "/demo/path/demo_alpha.png",
        "ignoredField": "should not surface",
    }
    out = normalize_champion_data(raw)
    assert out == {
        "champion_id": "1",
        "alias": "demo_alpha",
        "name": "Demo Champion",
        "description": "A demo entity used for unit tests.",
        "roles": ["fighter", "tank"],
        "keywords": "demo,test",
        "instance_id": "1:1",
        "square_portrait_path": "/demo/path/demo_alpha.png",
    }
    assert "ignoredField" not in out


def test_normalize_champion_data_handles_missing_fields():
    out = normalize_champion_data({})
    assert out["champion_id"] == ""
    assert out["alias"] == ""
    assert out["name"] == ""
    assert out["roles"] == []
    assert out["square_portrait_path"] == ""


def test_normalize_voice_event_builds_embedded_audio_url():
    out = normalize_voice_event(
        champion_id="1",
        champion_name="Demo Champion",
        skin_id="1000",
        skin_name="Demo Skin",
        game_version="1.0.0",
        event_name="Attack",
        voice_code="VO_DEMO_001",
        transcript="This is a demo voice line for tests.",
        cdn_base="https://your-voice-api-host.example.com",
    )
    assert out["champion_id"] == "1"
    assert out["champion_name"] == "Demo Champion"
    assert out["skin_id"] == "1000"
    assert out["skin_name"] == "Demo Skin"
    assert out["game_version"] == "1.0.0"
    assert out["event_name"] == "Attack"
    assert out["voice_code"] == "VO_DEMO_001"
    assert out["transcript"] == "This is a demo voice line for tests."
    assert out["audio_type"] == "ingame_voice"
    assert out["audio_url"] == (
        "https://your-voice-api-host.example.com/voice/audios/1.0.0/vo/zh-CN/champions/001000/VO_DEMO_001.wem"
    )

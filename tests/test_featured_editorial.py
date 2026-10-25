import pytest

from web.curate_featured_quotes import extend_pool, fingerprint


def recording(text="A distinctive line", directory="hero/Default"):
    return {"text": text, "dir": directory, "file": "line.mp3", "skin": "Default"}


def manifest_for(row, target=2):
    return {
        "target_count": target,
        "selections": [
            {
                "alias": "Hero",
                "text_sha256": fingerprint(row["text"]),
                "audio_path_sha256": fingerprint(row["dir"] + "/" + row["file"]),
                "reason": "Reviewed character-specific line",
            }
        ],
    }


def test_extension_preserves_existing_and_resolves_the_reviewed_recording():
    existing = [{"text": "Community recommendation", "sources": [{"url": "https://example.org"}]}]
    chosen = recording()
    other_skin = recording(directory="hero/Other")
    result = extend_pool(
        existing,
        manifest_for(chosen),
        {"Hero": {"name": "Hero Name"}},
        {"Hero": [other_skin, chosen]},
    )
    assert result[0] == existing[0]
    assert result[1]["dir"] == "hero/Default"
    assert result[1]["sources"] == []
    assert len(existing) == 1


def test_extension_refuses_an_unavailable_recording_instead_of_substituting():
    chosen = recording()
    with pytest.raises(ValueError, match="could not be resolved"):
        extend_pool(
            [],
            manifest_for(chosen, target=1),
            {"Hero": {"name": "Hero"}},
            {"Hero": [recording(directory="hero/Different")]},
        )


def test_extension_rejects_duplicates_and_incomplete_pool():
    chosen = recording()
    champions = {"Hero": {"name": "Hero"}}
    metadata = {"Hero": [chosen]}
    with pytest.raises(ValueError, match="Duplicate recommendation"):
        extend_pool([chosen], manifest_for(chosen), champions, metadata)
    with pytest.raises(ValueError, match="Expected 500"):
        extend_pool([], manifest_for(chosen, target=500), champions, metadata)

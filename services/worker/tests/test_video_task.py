import types
import pytest
import services.worker.worker as worker


class DummyResp:
    def __init__(self, content=b"vid"):
        self.content = content
    def raise_for_status(self):
        return None


async def _dummy_generate_video(provider, prompt, video_type, **kwargs):
    return {"video_url": "https://example.com/v.mp4"}


def test_generate_video_success(monkeypatch, patch_boto3, patch_status):
    # Mock async provider
    monkeypatch.setattr("services.api.app.video_providers.generate_video", _dummy_generate_video)
    # Mock HTTP fetch
    monkeypatch.setattr(worker.requests, "get", lambda url: DummyResp(b"video"))

    res = worker.generate_video.run(prompt="scene", job_id=20, tenant_id=0, provider="runway")
    assert res["job_id"] == 20
    assert res["video"]["s3_key"]
    assert any(s[1].value == "processing" for s in patch_status)
    assert any(s[1].value == "completed" for s in patch_status)


def test_generate_video_provider_missing_url(monkeypatch):
    async def bad_provider(**kwargs):
        return {}
    monkeypatch.setattr("services.api.app.video_providers.generate_video", bad_provider)
    with pytest.raises(RuntimeError):
        worker.generate_video.run(prompt="x", job_id=1, tenant_id=0, provider="runway")


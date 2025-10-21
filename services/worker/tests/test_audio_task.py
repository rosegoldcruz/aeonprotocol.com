import types
import pytest
import services.worker.worker as worker


class DummyResp:
    def __init__(self, content=b"aud"):
        self.content = content
    def raise_for_status(self):
        return None


def test_generate_audio_success(monkeypatch, patch_boto3, patch_status):
    # Mock ElevenLabs POST
    def _post(url, json, headers):
        return DummyResp(b"audio")
    monkeypatch.setattr(worker.requests, "post", _post)

    res = worker.generate_audio.run(text="hello", job_id=30, tenant_id=0, voice_id="v1")
    assert res["job_id"] == 30
    assert res["audio"]["s3_key"]
    assert any(s[1].value == "processing" for s in patch_status)
    assert any(s[1].value == "completed" for s in patch_status)


def test_generate_audio_http_error(monkeypatch):
    class BadResp:
        def raise_for_status(self):
            raise RuntimeError("bad")
    monkeypatch.setattr(worker.requests, "post", lambda *a, **k: BadResp())
    with pytest.raises(RuntimeError):
        worker.generate_audio.run(text="x", job_id=31, tenant_id=0)


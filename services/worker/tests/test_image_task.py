import types
import os
import pytest

import services.worker.worker as worker


class DummyResp:
    def __init__(self, content=b"img"):
        self.content = content
    def raise_for_status(self):
        return None


def test_generate_image_success(monkeypatch, fake_task, patch_boto3, patch_status):
    # Mock replicate client
    class DummyReplicate:
        def __init__(self, api_token):
            pass
        def run(self, model, input):
            return ["https://example.com/i1.png", "https://example.com/i2.png"]
    monkeypatch.setattr(worker.replicate, "Client", DummyReplicate)

    # Mock requests.get
    monkeypatch.setattr(worker.requests, "get", lambda url: DummyResp(b"image-bytes"))

    res = worker.generate_image.run(prompt="cat", job_id=123, tenant_id=0)
    assert res["job_id"] == 123
    assert "images" in res
    # status transitions: PROCESSING then COMPLETED
    assert any(s[1].value == "processing" for s in patch_status)
    assert any(s[1].value == "completed" for s in patch_status)
    # S3 writes recorded
    assert len(patch_boto3.puts) == 2


def test_generate_image_http_error_triggers_retry(monkeypatch, fake_task, patch_status):
    # Replicate returns URL but HTTP fetch fails
    class DummyReplicate:
        def __init__(self, api_token): pass
        def run(self, model, input): return ["https://bad/url.png"]
    monkeypatch.setattr(worker.replicate, "Client", DummyReplicate)

    class BadResp:
        def raise_for_status(self):
            raise RuntimeError("fail")
    monkeypatch.setattr(worker.requests, "get", lambda url: BadResp())

    with pytest.raises(RuntimeError):
        worker.generate_image.run(prompt="dog", job_id=5, tenant_id=0)
    # On retry path we don't immediately mark FAILED; since we simulate retry by raising exc, FAILURE may be absent
    assert not any(s[1].value == "failed" for s in patch_status)


def test_generate_image_s3_failure_raises_and_not_completed(monkeypatch, patch_boto3, patch_status):
    # Force S3 failure
    os.environ["TEST_S3_FAIL"] = "1"
    class DummyReplicate:
        def __init__(self, api_token): pass
        def run(self, model, input): return ["https://example.com/i.png"]
    monkeypatch.setattr(worker.replicate, "Client", DummyReplicate)
    monkeypatch.setattr(worker.requests, "get", lambda url: DummyResp())

    with pytest.raises(Exception):
        worker.generate_image.run(prompt="x", job_id=7, tenant_id=0)
    # Should not mark completed on failure path
    assert not any(s[1].value == "completed" for s in patch_status)
    os.environ.pop("TEST_S3_FAIL", None)


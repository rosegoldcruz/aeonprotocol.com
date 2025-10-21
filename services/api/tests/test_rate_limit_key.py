from app.rate_limit import _key


def test_rate_limit_key_format(monkeypatch):
    # Freeze time bucket
    class DummyTime:
        @staticmethod
        def time():
            return 120  # seconds
    monkeypatch.setattr("time.time", DummyTime.time)

    k = _key(prefix="media:jobs", ip="127.0.0.1", sub=None, window=60)
    assert k.startswith("rl:media:jobs:127.0.0.1:")
    # Ensure bucket corresponds to 120 // 60 = 2
    assert k.split(":")[-1] == "2"


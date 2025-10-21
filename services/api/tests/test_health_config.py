def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_health_config(client):
    r = client.get("/health/config")
    assert r.status_code == 200
    body = r.json()
    assert "ok" in body and "missing" in body


def test_health_deps(client):
    r = client.get("/health/deps")
    assert r.status_code == 200
    body = r.json()
    # Keys should exist regardless of actual connectivity
    assert set(["database", "redis"]).issubset(body.keys())


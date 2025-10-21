def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"


def test_health_config_endpoint(client):
    response = client.get("/health/config")
    assert response.status_code == 200
    data = response.json()
    assert "ok" in data
    assert "missing" in data


def test_health_deps_endpoint(client):
    response = client.get("/health/deps")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    assert "redis" in data


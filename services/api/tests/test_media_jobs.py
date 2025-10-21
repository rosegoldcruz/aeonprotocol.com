def test_create_job_requires_auth(client):
    response = client.post("/v1/media/jobs", json={
        "kind": "image",
        "provider": "flux",
        "payload": {"prompt": "test"}
    })
    assert response.status_code in (401, 403)


def test_get_job_requires_auth(client):
    response = client.get("/v1/media/jobs/1")
    assert response.status_code in (401, 403)


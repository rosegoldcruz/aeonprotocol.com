def test_enhance_webspec_requires_auth(client):
    response = client.post("/v1/enhance/webspec", json={"raw": "test"})
    assert response.status_code in (401, 403)


def test_webgen_commit_requires_auth(client):
    response = client.post("/v1/webgen/commit?enhancement_id=test-id")
    assert response.status_code in (401, 403)


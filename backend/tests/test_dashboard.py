def test_dashboard_summary_requires_auth(client):
    assert client.get("/api/dashboard/summary").status_code == 401


def test_dashboard_summary_reflects_data(authed_client):
    zone = authed_client.post("/api/hosted-zones", json={"domain_name": "dash.com", "zone_type": "public"}).json()
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})

    response = authed_client.get("/api/dashboard/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["total_zones"] == 1
    assert body["public_zones"] == 1
    assert body["total_records"] == 1
    assert len(body["recent_activity"]) >= 2
    assert body["recent_activity"][0]["action"] in {"create"}

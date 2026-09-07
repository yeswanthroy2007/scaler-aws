def test_create_hosted_zone(authed_client):
    response = authed_client.post(
        "/api/hosted-zones", json={"domain_name": "example.com", "description": "test zone", "zone_type": "public"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["domain_name"] == "example.com"
    assert len(body["name_servers"]) == 4
    assert body["record_count"] == 0


def test_create_hosted_zone_invalid_domain(authed_client):
    response = authed_client.post("/api/hosted-zones", json={"domain_name": "not a domain", "zone_type": "public"})
    assert response.status_code == 422


def test_create_duplicate_domain_conflicts(authed_client):
    payload = {"domain_name": "dup.com", "zone_type": "public"}
    first = authed_client.post("/api/hosted-zones", json=payload)
    assert first.status_code == 201
    second = authed_client.post("/api/hosted-zones", json=payload)
    assert second.status_code == 409


def test_private_zone_requires_vpc(authed_client):
    response = authed_client.post("/api/hosted-zones", json={"domain_name": "priv.com", "zone_type": "private"})
    assert response.status_code == 422


def test_private_zone_with_vpc_succeeds(authed_client):
    response = authed_client.post(
        "/api/hosted-zones",
        json={"domain_name": "priv2.com", "zone_type": "private", "vpc_id": "vpc-123", "vpc_region": "us-east-1"},
    )
    assert response.status_code == 201


def test_get_nonexistent_zone_404(authed_client):
    response = authed_client.get("/api/hosted-zones/999")
    assert response.status_code == 404


def test_update_hosted_zone(authed_client):
    created = authed_client.post("/api/hosted-zones", json={"domain_name": "update.com", "zone_type": "public"}).json()
    response = authed_client.put(f"/api/hosted-zones/{created['id']}", json={"description": "updated description"})
    assert response.status_code == 200
    assert response.json()["description"] == "updated description"


def test_delete_hosted_zone(authed_client):
    created = authed_client.post("/api/hosted-zones", json={"domain_name": "delete.com", "zone_type": "public"}).json()
    response = authed_client.delete(f"/api/hosted-zones/{created['id']}")
    assert response.status_code == 204
    assert authed_client.get(f"/api/hosted-zones/{created['id']}").status_code == 404


def test_delete_zone_cascades_records(authed_client):
    zone = authed_client.post("/api/hosted-zones", json={"domain_name": "cascade.com", "zone_type": "public"}).json()
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    authed_client.delete(f"/api/hosted-zones/{zone['id']}")
    # Zone (and its records) should be gone; re-creating should not conflict on record uniqueness
    recreated = authed_client.post("/api/hosted-zones", json={"domain_name": "cascade.com", "zone_type": "public"})
    assert recreated.status_code == 201
    assert recreated.json()["record_count"] == 0


def test_search_hosted_zones(authed_client):
    authed_client.post("/api/hosted-zones", json={"domain_name": "findme.com", "zone_type": "public"})
    authed_client.post("/api/hosted-zones", json={"domain_name": "other.com", "zone_type": "public"})
    response = authed_client.get("/api/hosted-zones", params={"search": "findme"})
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["domain_name"] == "findme.com"


def test_filter_by_zone_type(authed_client):
    authed_client.post("/api/hosted-zones", json={"domain_name": "pubfilter.com", "zone_type": "public"})
    authed_client.post(
        "/api/hosted-zones",
        json={"domain_name": "privfilter.com", "zone_type": "private", "vpc_id": "vpc-1", "vpc_region": "us-east-1"},
    )
    response = authed_client.get("/api/hosted-zones", params={"zone_type": "private"})
    body = response.json()
    assert all(z["zone_type"] == "private" for z in body["items"])


def test_pagination(authed_client):
    for i in range(15):
        authed_client.post("/api/hosted-zones", json={"domain_name": f"page{i}.com", "zone_type": "public"})
    page1 = authed_client.get("/api/hosted-zones", params={"page": 1, "page_size": 10}).json()
    page2 = authed_client.get("/api/hosted-zones", params={"page": 2, "page_size": 10}).json()
    assert len(page1["items"]) == 10
    assert page1["meta"]["total"] == 15
    assert page1["meta"]["total_pages"] == 2
    assert len(page2["items"]) == 5


def test_hosted_zones_require_auth(client):
    assert client.get("/api/hosted-zones").status_code == 401

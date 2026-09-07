import pytest


@pytest.fixture()
def zone(authed_client):
    zone = authed_client.post("/api/hosted-zones", json={"domain_name": "searchtest.com", "zone_type": "public"}).json()
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "", "type": "MX", "ttl": 300, "value": "mail.searchtest.com", "priority": 10})
    return zone


def test_search_requires_auth(client):
    assert client.get("/api/search", params={"q": "test"}).status_code == 401


def test_search_empty_query_returns_no_items(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": ""})
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_search_matches_hosted_zone_by_domain(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "searchtest"})
    body = response.json()
    zone_hits = [item for item in body["items"] if item["type"] == "hosted_zone"]
    assert len(zone_hits) == 1
    assert zone_hits[0]["title"] == "searchtest.com"
    assert zone_hits[0]["href"] == f"/route53/hosted-zones/{zone['id']}"


def test_search_matches_dns_record_by_name(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "www"})
    body = response.json()
    record_hits = [item for item in body["items"] if item["type"] == "dns_record"]
    assert len(record_hits) == 1
    assert record_hits[0]["title"] == f"www.searchtest.com"
    assert record_hits[0]["badge"] == "A"
    assert record_hits[0]["href"].startswith(f"/route53/hosted-zones/{zone['id']}?search=")


def test_search_matches_dns_record_by_type(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "MX"})
    body = response.json()
    record_hits = [item for item in body["items"] if item["type"] == "dns_record"]
    assert any(item["badge"] == "MX" for item in record_hits)


def test_search_matches_dns_record_by_value(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "1.2.3.4"})
    body = response.json()
    record_hits = [item for item in body["items"] if item["type"] == "dns_record"]
    assert len(record_hits) == 1


def test_search_matches_route53_section(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "health"})
    body = response.json()
    section_hits = [item for item in body["items"] if item["type"] == "section"]
    assert len(section_hits) == 1
    assert section_hits[0]["href"] == "/route53/health-checks"


def test_search_no_results(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "zzz-nonexistent-zzz"})
    assert response.json()["items"] == []


def test_search_is_case_insensitive(authed_client, zone):
    response = authed_client.get("/api/search", params={"q": "SEARCHTEST"})
    body = response.json()
    zone_hits = [item for item in body["items"] if item["type"] == "hosted_zone"]
    assert len(zone_hits) == 1

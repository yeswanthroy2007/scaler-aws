import pytest


@pytest.fixture()
def zone(authed_client):
    return authed_client.post("/api/hosted-zones", json={"domain_name": "records.com", "zone_type": "public"}).json()


def test_create_a_record(authed_client, zone):
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    assert response.status_code == 201
    assert response.json()["value"] == "1.2.3.4"


def test_create_a_record_invalid_ip(authed_client, zone):
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "999.999.999.999"})
    assert response.status_code == 422


def test_create_mx_record_requires_priority(authed_client, zone):
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "", "type": "MX", "ttl": 300, "value": "mail.records.com"})
    assert response.status_code == 422


def test_create_mx_record_with_priority(authed_client, zone):
    response = authed_client.post(
        f"/api/hosted-zones/{zone['id']}/records", json={"name": "", "type": "MX", "ttl": 300, "value": "mail.records.com", "priority": 10}
    )
    assert response.status_code == 201


def test_create_srv_requires_all_fields(authed_client, zone):
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "_sip._tcp", "type": "SRV", "ttl": 300, "value": "sip.records.com", "priority": 10})
    assert response.status_code == 422


def test_create_caa_requires_valid_tag(authed_client, zone):
    response = authed_client.post(
        f"/api/hosted-zones/{zone['id']}/records",
        json={"name": "", "type": "CAA", "ttl": 300, "value": "letsencrypt.org", "flags": 0, "tag": "bogus"},
    )
    assert response.status_code == 422


def test_cname_cannot_be_apex(authed_client, zone):
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "", "type": "CNAME", "ttl": 300, "value": "target.com"})
    assert response.status_code == 422


def test_cname_conflicts_with_other_record_at_same_name(authed_client, zone):
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "app", "type": "CNAME", "ttl": 300, "value": "target.com"})
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "app", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    assert response.status_code == 422


def test_update_record(authed_client, zone):
    created = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"}).json()
    response = authed_client.put(f"/api/hosted-zones/{zone['id']}/records/{created['id']}", json={"name": "www", "type": "A", "ttl": 600, "value": "5.6.7.8"})
    assert response.status_code == 200
    assert response.json()["ttl"] == 600
    assert response.json()["value"] == "5.6.7.8"


def test_delete_record(authed_client, zone):
    created = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"}).json()
    response = authed_client.delete(f"/api/hosted-zones/{zone['id']}/records/{created['id']}")
    assert response.status_code == 204
    assert authed_client.get(f"/api/hosted-zones/{zone['id']}/records/{created['id']}").status_code == 404


def test_record_not_found_in_wrong_zone(authed_client, zone):
    other_zone = authed_client.post("/api/hosted-zones", json={"domain_name": "otherzone.com", "zone_type": "public"}).json()
    created = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"}).json()
    response = authed_client.get(f"/api/hosted-zones/{other_zone['id']}/records/{created['id']}")
    assert response.status_code == 404


def test_search_records(authed_client, zone):
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "api", "type": "A", "ttl": 300, "value": "5.6.7.8"})
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/records", params={"search": "www"})
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["name"] == "www"


def test_filter_records_by_type(authed_client, zone):
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "txt1", "type": "TXT", "ttl": 300, "value": "hello"})
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/records", params={"type": "TXT"})
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["type"] == "TXT"


def test_bulk_delete_records(authed_client, zone):
    r1 = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "a1", "type": "A", "ttl": 300, "value": "1.1.1.1"}).json()
    r2 = authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "a2", "type": "A", "ttl": 300, "value": "2.2.2.2"}).json()
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/records/bulk-delete", json={"record_ids": [r1["id"], r2["id"]]})
    assert response.status_code == 200
    assert response.json()["deleted"] == 2

import io

import pytest


@pytest.fixture()
def zone(authed_client):
    return authed_client.post("/api/hosted-zones", json={"domain_name": "importexport.com", "zone_type": "public"}).json()


BIND_CONTENT = """; sample zone file
$ORIGIN importexport.com.
$TTL 300
@       300  IN  A      192.0.2.1
www     300  IN  CNAME  importexport.com.
mail    300  IN  A      192.0.2.2
@       3600 IN  MX     10 mail.importexport.com.
@       300  IN  BOGUS  something
"""


def test_import_preview(authed_client, zone):
    files = {"file": ("zone.txt", io.BytesIO(BIND_CONTENT.encode()), "text/plain")}
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/import/preview", files=files)
    assert response.status_code == 200
    body = response.json()
    assert body["valid_count"] == 4
    assert body["invalid_count"] == 1
    assert body["import_token"]


def test_import_confirm_creates_records(authed_client, zone):
    files = {"file": ("zone.txt", io.BytesIO(BIND_CONTENT.encode()), "text/plain")}
    preview = authed_client.post(f"/api/hosted-zones/{zone['id']}/import/preview", files=files).json()
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/import/confirm", json={"import_token": preview["import_token"]})
    assert response.status_code == 200
    summary = response.json()
    assert summary["created"] == 4
    records = authed_client.get(f"/api/hosted-zones/{zone['id']}/records", params={"page_size": 50}).json()
    assert records["meta"]["total"] == 4


def test_import_rejects_empty_file(authed_client, zone):
    files = {"file": ("zone.txt", io.BytesIO(b""), "text/plain")}
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/import/preview", files=files)
    assert response.status_code == 422


def test_import_rejects_bad_extension(authed_client, zone):
    files = {"file": ("zone.exe", io.BytesIO(b"data"), "application/octet-stream")}
    response = authed_client.post(f"/api/hosted-zones/{zone['id']}/import/preview", files=files)
    assert response.status_code == 422


def test_export_json(authed_client, zone):
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/export", params={"format": "json"})
    assert response.status_code == 200
    assert '"domainName": "importexport.com"' in response.text
    assert '"www"' in response.text or "www" in response.text


def test_export_bind(authed_client, zone):
    authed_client.post(f"/api/hosted-zones/{zone['id']}/records", json={"name": "www", "type": "A", "ttl": 300, "value": "1.2.3.4"})
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/export", params={"format": "bind"})
    assert response.status_code == 200
    assert "$ORIGIN importexport.com." in response.text
    assert "www" in response.text


def test_export_invalid_format(authed_client, zone):
    response = authed_client.get(f"/api/hosted-zones/{zone['id']}/export", params={"format": "xml"})
    assert response.status_code == 422

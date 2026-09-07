def test_login_success(client, demo_user):
    response = client.post("/api/auth/login", json={"email": "demo@example.com", "password": "Password123!"})
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "demo@example.com"
    assert "token" in body
    assert "r53_session" in response.cookies


def test_login_wrong_password(client, demo_user):
    response = client.post("/api/auth/login", json={"email": "demo@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "whatever"})
    assert response.status_code == 401


def test_me_requires_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_valid_session(authed_client):
    response = authed_client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "demo@example.com"


def test_logout_clears_cookie(authed_client):
    response = authed_client.post("/api/auth/logout")
    assert response.status_code == 204


def test_bearer_token_auth_works(client, demo_user):
    login = client.post("/api/auth/login", json={"email": "demo@example.com", "password": "Password123!"})
    token = login.json()["token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}, cookies={})
    assert response.status_code == 200

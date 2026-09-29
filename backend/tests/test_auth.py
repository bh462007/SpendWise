def test_register_login_and_current_user(client):
    user = make_user(client)
    response = client.get("/auth/me", headers=auth_headers(user))
    assert response.status_code == 200
    assert response.json()["email"] == user["email"]
    assert "password_hash" not in response.json()


def test_auth_validation_and_protection(client):
    email = "auth@example.com"
    assert client.post("/auth/register", json={"name": "Auth", "email": email, "password": "password123"}).status_code == 200
    assert client.post("/auth/register", json={"name": "Auth", "email": email, "password": "password123"}).status_code == 400
    assert client.post("/auth/register", json={"name": "Auth", "email": "not-an-email", "password": "password123"}).status_code == 422
    assert client.post("/auth/login", json={"email": email, "password": "wrong-password"}).status_code == 401
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer invalid"}).status_code == 401


def test_invalid_register_fields(client):
    response = client.post("/auth/register", json={"name": "", "email": "bad", "password": "short"})
    assert response.status_code == 422


from .conftest import auth_headers, make_user

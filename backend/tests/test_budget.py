from .conftest import auth_headers, make_user


def test_budget_create_update_duplicate_and_isolation(client):
    user_a = make_user(client)
    user_b = make_user(client)
    created = client.post("/budgets", headers=auth_headers(user_a), json={"amount": 5000, "month": "2026-09"})
    assert created.status_code == 201
    budget_id = created.json()["id"]
    assert client.get("/budgets", headers=auth_headers(user_a)).json()[0]["amount"] == 5000
    assert client.post("/budgets", headers=auth_headers(user_a), json={"amount": 6000, "month": "2026-09"}).status_code == 400
    assert client.put(f"/budgets/{budget_id}", headers=auth_headers(user_a), json={"amount": 5500}).status_code == 200
    assert client.put(f"/budgets/{budget_id}", headers=auth_headers(user_b), json={"amount": 100}).status_code == 404
    assert client.post("/budgets", headers=auth_headers(user_b), json={"amount": 8000, "month": "2026-09"}).status_code == 201
    assert client.post("/budgets", headers=auth_headers(user_a), json={"amount": 0, "month": "2026-09"}).status_code == 422

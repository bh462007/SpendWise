from .conftest import auth_headers, create_income, make_user


def test_income_crud_and_isolation(client):
    user_a = make_user(client)
    user_b = make_user(client)
    income = create_income(client, user_a)
    listing = client.get("/income?page=1&limit=10", headers=auth_headers(user_a)).json()
    assert listing["total_items"] == 1
    assert listing["items"][0]["source"] == "Salary"
    assert client.get(f"/income/{income['id']}", headers=auth_headers(user_b)).status_code == 404
    assert client.put(f"/income/{income['id']}", headers=auth_headers(user_b), json={"amount": 1}).status_code == 404
    assert client.delete(f"/income/{income['id']}", headers=auth_headers(user_b)).status_code == 404
    assert client.put(f"/income/{income['id']}", headers=auth_headers(user_a), json={"amount": 12000}).status_code == 200
    assert client.delete(f"/income/{income['id']}", headers=auth_headers(user_a)).status_code == 200


def test_income_validation_and_filters(client):
    user = make_user(client)
    create_income(client, user, "Salary", 10000, "2026-09-01")
    create_income(client, user, "Freelance", 5000, "2026-09-20")
    result = client.get("/income?search=salary&start_date=2026-09-01&end_date=2026-09-10", headers=auth_headers(user)).json()
    assert result["total_items"] == 1
    assert client.post("/income", headers=auth_headers(user), json={"source": "", "amount": 0, "date": "bad"}).status_code == 422

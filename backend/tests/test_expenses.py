from .conftest import auth_headers, create_expense, make_user


def test_expense_crud_and_isolation(client):
    user_a = make_user(client, "Expense A")
    user_b = make_user(client, "Expense B")
    expense = create_expense(client, user_a)

    listing = client.get("/expenses?page=1&limit=10", headers=auth_headers(user_a))
    assert listing.status_code == 200
    assert listing.json()["total_items"] == 1
    assert listing.json()["items"][0]["title"] == "Lunch"

    one = client.get(f"/expenses/{expense['id']}", headers=auth_headers(user_a))
    assert one.status_code == 200
    updated = client.put(f"/expenses/{expense['id']}", headers=auth_headers(user_a), json={"amount": 300})
    assert updated.status_code == 200
    assert updated.json()["amount"] == 300

    assert client.get(f"/expenses/{expense['id']}", headers=auth_headers(user_b)).status_code == 404
    assert client.put(f"/expenses/{expense['id']}", headers=auth_headers(user_b), json={"amount": 900}).status_code == 404
    assert client.delete(f"/expenses/{expense['id']}", headers=auth_headers(user_b)).status_code == 404
    assert client.delete(f"/expenses/{expense['id']}", headers=auth_headers(user_a)).status_code == 200
    assert client.get("/expenses/9999", headers=auth_headers(user_a)).status_code == 404


def test_expense_validation_and_filters(client):
    user = make_user(client)
    create_expense(client, user, "Food one", 200, "Food", "UPI", "2026-09-01")
    create_expense(client, user, "Travel one", 500, "Travel", "Cash", "2026-09-10")
    create_expense(client, user, "Food two", 300, "Food", "UPI", "2026-09-20")
    create_expense(client, user, "Shopping one", 1000, "Shopping", "Debit Card", "2026-09-25")

    food = client.get("/expenses?category=Food&page=1&limit=50", headers=auth_headers(user)).json()
    assert food["total_items"] == 2
    combined = client.get("/expenses?category=Food&payment_method=UPI&page=1&limit=50", headers=auth_headers(user)).json()
    assert combined["total_items"] == 2
    searched = client.get("/expenses?search=food&page=1&limit=50", headers=auth_headers(user)).json()
    assert searched["total_items"] == 2
    date_filtered = client.get("/expenses?start_date=2026-09-05&end_date=2026-09-21&page=1&limit=50", headers=auth_headers(user)).json()
    assert date_filtered["total_items"] == 2
    sorted_items = client.get("/expenses?sort_by=amount&sort_order=desc&page=1&limit=50", headers=auth_headers(user)).json()["items"]
    assert sorted_items[0]["amount"] == 1000
    assert client.get("/expenses?sort_by=created_at", headers=auth_headers(user)).status_code == 422
    assert client.post("/expenses", headers=auth_headers(user), json={"title": "Bad", "amount": 0, "category": "Food", "date": "bad", "payment_method": "UPI"}).status_code == 422


def test_expense_pagination_validation(client):
    user = make_user(client)
    for number in range(25):
        create_expense(client, user, f"Expense {number}", number + 1)
    first_page = client.get("/expenses?page=1&limit=10", headers=auth_headers(user)).json()
    third_page = client.get("/expenses?page=3&limit=10", headers=auth_headers(user)).json()
    assert len(first_page["items"]) == 10
    assert first_page["total_items"] == 25
    assert first_page["total_pages"] == 3
    assert len(third_page["items"]) == 5
    assert client.get("/expenses?page=0", headers=auth_headers(user)).status_code == 422
    assert client.get("/expenses?limit=0", headers=auth_headers(user)).status_code == 422
    assert client.get("/expenses?limit=51", headers=auth_headers(user)).status_code == 422

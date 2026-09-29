from .conftest import auth_headers, create_expense, create_income, make_user


def test_reports_calculations_and_csv(client):
    user = make_user(client)
    create_income(client, user, "Salary", 10000, "2026-09-10")
    create_expense(client, user, "Food", 2000, "Food", "UPI", "2026-09-11")
    create_expense(client, user, "Travel", 1000, "Travel", "Cash", "2026-09-12")
    create_expense(client, user, "Shopping", 500, "Shopping", "Debit Card", "2026-09-13")
    client.post("/budgets", headers=auth_headers(user), json={"amount": 5000, "month": "2026-09"})

    headers = auth_headers(user)
    summary = client.get("/reports/summary?start_date=2026-09-01&end_date=2026-09-30", headers=headers).json()
    assert summary["total_income"] == 10000
    assert summary["total_expenses"] == 3500
    assert summary["balance"] == 6500
    assert summary["top_category"]["category"] == "Food"
    assert summary["transaction_count"] == 4

    categories = client.get("/reports/categories?start_date=2026-09-01&end_date=2026-09-30", headers=headers).json()["categories"]
    assert categories[0] == {"category": "Food", "amount": 2000}
    monthly = client.get("/reports/monthly?start_date=2026-07-01&end_date=2026-09-30", headers=headers).json()["months"]
    assert monthly[-1] == {"month": "2026-09", "income": 10000, "expenses": 3500}
    budget = client.get("/reports/budget?month=2026-09", headers=headers).json()
    assert budget["remaining"] == 1500
    assert budget["percentage_used"] == 70
    csv_response = client.get("/reports/export/csv?start_date=2026-09-01&end_date=2026-09-30", headers=headers)
    assert csv_response.status_code == 200
    assert "text/csv" in csv_response.headers["content-type"]
    assert "Type,Title/Source,Amount" in csv_response.text
    assert "Expense,Food,2000" in csv_response.text
    assert "Income,Salary,10000" in csv_response.text


def test_reports_empty_and_date_validation(client):
    user = make_user(client)
    headers = auth_headers(user)
    empty = client.get("/reports/summary?start_date=2026-01-01&end_date=2026-01-31", headers=headers).json()
    assert empty["transaction_count"] == 0
    assert empty["top_category"] is None
    assert client.get("/reports/summary?start_date=2026-09-30&end_date=2026-09-01", headers=headers).status_code == 400
    zero_budget = client.get("/reports/budget?month=2026-09", headers=headers).json()
    assert zero_budget["budget"] == 0
    assert zero_budget["percentage_used"] == 0

from .conftest import auth_headers, create_expense, create_income, make_user


def test_reports_and_csv_are_user_isolated(client):
    user_a = make_user(client, "User A")
    user_b = make_user(client, "User B")
    create_income(client, user_a, "A salary", 10000)
    create_expense(client, user_a, "A lunch", 250)
    create_income(client, user_b, "B salary", 20000)
    create_expense(client, user_b, "B rent", 8000, "Bills", "Bank Transfer")

    summary_b = client.get("/reports/summary?start_date=2026-09-01&end_date=2026-09-30", headers=auth_headers(user_b)).json()
    csv_b = client.get("/reports/export/csv?start_date=2026-09-01&end_date=2026-09-30", headers=auth_headers(user_b)).text
    assert summary_b["total_income"] == 20000
    assert summary_b["total_expenses"] == 8000
    assert "B salary" in csv_b
    assert "A salary" not in csv_b
    assert "A lunch" not in csv_b

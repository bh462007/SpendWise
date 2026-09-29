import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app


@pytest.fixture()
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def make_user(client, name="Test User", password="password123"):
    email = f"{uuid.uuid4()}@example.com"
    response = client.post("/auth/register", json={"name": name, "email": email, "password": password})
    assert response.status_code == 200
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return {"email": email, "password": password, "token": login.json()["access_token"]}


def auth_headers(user):
    return {"Authorization": f"Bearer {user['token']}"}


def create_expense(client, user, title="Lunch", amount=250, category="Food", payment_method="UPI", date="2026-09-20"):
    response = client.post(
        "/expenses",
        headers=auth_headers(user),
        json={
            "title": title,
            "amount": amount,
            "category": category,
            "date": date,
            "payment_method": payment_method,
            "note": "Test note",
        },
    )
    assert response.status_code == 201
    return response.json()


def create_income(client, user, source="Salary", amount=10000, date="2026-09-20"):
    response = client.post(
        "/income",
        headers=auth_headers(user),
        json={"source": source, "amount": amount, "date": date, "note": "Test income"},
    )
    assert response.status_code == 201
    return response.json()

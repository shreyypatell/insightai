"""Integration tests for InsightAI API using a file-based test DB."""
import io
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# conftest.py sets env vars before we import the app
from app.database.db import Base, get_db
from app.database import models as _  # registers ORM classes with Base
from main import app, engine as app_engine   # reuse the engine main.py built


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables before each test for isolation."""
    Base.metadata.drop_all(bind=app_engine)
    Base.metadata.create_all(bind=app_engine)
    yield
    Base.metadata.drop_all(bind=app_engine)


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_csv(n=50):
    lines = ["age,salary,target"]
    for i in range(n):
        lines.append(f"{20 + i},{30000 + i * 500},{i % 2}")
    return "\n".join(lines).encode()

SAMPLE_CSV = _make_csv(50)


def register_and_login(client) -> dict:
    client.post("/api/auth/register",
        json={"name": "Test User", "email": "test@example.com", "password": "secret123"})
    resp = client.post("/api/auth/login",
        json={"email": "test@example.com", "password": "secret123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


# ─── Tests ────────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_login(client):
    r = client.post("/api/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "pass123"})
    assert r.status_code == 201
    assert r.json()["email"] == "alice@example.com"

    r2 = client.post("/api/auth/login",
        json={"email": "alice@example.com", "password": "pass123"})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_duplicate_registration(client):
    payload = {"name": "Bob", "email": "bob@example.com", "password": "pass123"}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400


def test_upload_and_list_datasets(client):
    headers = register_and_login(client)
    files = {"file": ("sample.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    r = client.post("/api/datasets/upload", files=files, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["n_rows"] == 50
    assert data["n_columns"] == 3

    r2 = client.get("/api/datasets", headers=headers)
    assert r2.status_code == 200
    assert len(r2.json()) == 1


def test_eda(client):
    headers = register_and_login(client)
    files = {"file": ("sample.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    dataset_id = client.post("/api/datasets/upload", files=files, headers=headers).json()["id"]
    r = client.get(f"/api/eda/{dataset_id}?target_column=target", headers=headers)
    assert r.status_code == 200
    assert "summary_statistics" in r.json()


def test_cleaning(client):
    headers = register_and_login(client)
    files = {"file": ("sample.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    dataset_id = client.post("/api/datasets/upload", files=files, headers=headers).json()["id"]
    r = client.post(f"/api/clean/{dataset_id}", headers=headers)
    assert r.status_code == 200
    assert "duplicates_removed" in r.json()


def test_model_training(client):
    headers = register_and_login(client)
    files = {"file": ("sample.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    dataset_id = client.post("/api/datasets/upload", files=files, headers=headers).json()["id"]

    payload = {
        "dataset_id": dataset_id,
        "target_column": "target",
        "problem_type": "classification",
        "algorithms": ["logistic_regression"],
    }
    r = client.post("/api/models/train", json=payload, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["best_algorithm"] == "logistic_regression"
    assert len(body["results"]) == 1
    assert "accuracy" in body["results"][0]["metrics"]

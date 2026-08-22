import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
import models

# Set up test database
from sqlalchemy.pool import StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = models.User(user_id="test-user", email="test@example.com", mode="General Human")
    db.add(user)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_pain_logging():
    # Log pain
    res = client.post("/pain/log/test-user", json={"zone": "left_knee", "score": 7})
    assert res.status_code == 200
    assert "log_id" in res.json()

    # Fetch history
    res = client.get("/pain/history/test-user")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["zone"] == "left_knee"
    assert data[0]["score"] == 7

def test_triage():
    # Triage high fear (score >= 25)
    res = client.post("/users/triage/test-user", json={"score": 30, "answers_json": "[1,2,3,4]"})
    assert res.status_code == 200
    assert res.json()["mode_assigned"] == "Low-Intensity Posture & Joint Stability"

    # Triage low fear (score < 25)
    res = client.post("/users/triage/test-user", json={"score": 15, "answers_json": "[1,2,3,4]"})
    assert res.status_code == 200
    assert res.json()["mode_assigned"] == "Standard Athletic Recovery"

def test_case_notes():
    res = client.post("/clinic/casenotes/test-user", json={"note": "Patellar tendinitis clinical flag."})
    assert res.status_code == 200

    res = client.get("/clinic/casenotes/test-user")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["note"] == "Patellar tendinitis clinical flag."

def test_pdf_report():
    res = client.get("/analytics/report/pdf/test-user")
    assert res.status_code == 200
    assert "PhysioTwin" in res.text
    assert "Clinical Diagnostic" in res.text

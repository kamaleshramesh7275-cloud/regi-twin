import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import datetime

from database import Base, get_db
import models
from main import app

# Test DB in memory with StaticPool for session continuity
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_features_suite():
    # 0. Setup a test user
    uid = "test-feature-user-123"
    db = TestingSessionLocal()
    user = models.User(user_id=uid, email="therapist_patient@example.com", mode="Athlete", age=28)
    db.add(user)
    
    # Add vision session for ROM and Symmetry
    vs = models.VisionSession(
        user_id=uid,
        task_type="knee_flexion",
        rom=125.0,
        symmetry=88.0,
        stability=82.0,
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=2)
    )
    db.add(vs)
    
    # Add capability profile
    cp = models.CapabilityProfile(
        user_id=uid,
        mobility=82.0,
        stability=78.0,
        movement_quality=85.0,
        cardiovascular_efficiency=75.0,
        recovery=80.0,
        capability_reserve=70.0,
        confidence="High"
    )
    db.add(cp)
    
    # Add pain log
    pl = models.PainLog(user_id=uid, zone="left_knee", score=3)
    db.add(pl)
    
    db.commit()
    db.close()

    print("\n--- Testing Feature 2: Analytics Summary ---")
    res_f2 = client.get(f"/analytics/summary/{uid}")
    assert res_f2.status_code == 200, f"F2 Failed: {res_f2.text}"
    f2_data = res_f2.json()
    assert "rom_trend" in f2_data
    assert "capability_trend" in f2_data
    assert "pain_trend" in f2_data
    assert "zone_heatmap" in f2_data
    assert len(f2_data["rom_trend"]) >= 1
    assert f2_data["rom_trend"][0]["rom"] == 125.0
    print(f"Feature 2 OK! ROM Trend entries: {len(f2_data['rom_trend'])}, Heatmap: {f2_data['zone_heatmap']}")

    print("\n--- Testing Feature 4: Wearable CSV Import ---")
    sample_csv = (
        "Date,Heart Rate,HRV,Sleep,Steps,Calories\n"
        "2026-08-10,58,62,7.5,10500,2400\n"
        "2026-08-11,56,65,8.0,11200,2550\n"
    )
    csv_file = io.BytesIO(sample_csv.encode("utf-8"))
    res_f4 = client.post(
        f"/wearable/import-csv/{uid}",
        files={"file": ("garmin_export.csv", csv_file, "text/csv")}
    )
    assert res_f4.status_code == 200, f"F4 Failed: {res_f4.text}"
    f4_data = res_f4.json()
    assert f4_data["status"] == "success"
    assert f4_data["imported"] == 2
    assert f4_data["source"] == "garmin"
    print(f"Feature 4 OK! Imported: {f4_data['imported']} rows (source: {f4_data['source']})")

    print("\n--- Testing Feature 8: AI Injury Risk Prediction ---")
    res_f8 = client.get(f"/analytics/injury-risk/{uid}")
    assert res_f8.status_code == 200, f"F8 Failed: {res_f8.text}"
    f8_data = res_f8.json()
    assert "risk_score" in f8_data
    assert "risk_level" in f8_data
    assert "recommendation" in f8_data
    assert "contributing_factors" in f8_data
    assert f8_data["risk_level"] in ["Low", "Moderate", "High"]
    print(f"Feature 8 OK! Risk Score: {f8_data['risk_score']}%, Level: {f8_data['risk_level']}")
    print(f"Recommendation: {f8_data['recommendation']}")

    print("\n--- Testing Feature 9: Clinic Roster & Patient Detail ---")
    # Test Roster
    res_f9 = client.get("/clinic/roster?admin_key=physiotwin-admin-2026")
    assert res_f9.status_code == 200, f"F9 Roster Failed: {res_f9.text}"
    roster = res_f9.json()
    assert len(roster) >= 1
    patient_entry = next((p for p in roster if p["user_id"] == uid), None)
    assert patient_entry is not None, "Test user not found in clinic roster"
    assert patient_entry["email"] == "therapist_patient@example.com"
    print(f"Feature 9 Roster OK! Total Patients in Roster: {len(roster)}, Found: {patient_entry['email']}")

    # Test Patient Detail Drilldown
    res_patient = client.get(f"/clinic/patient/{uid}?admin_key=physiotwin-admin-2026")
    assert res_patient.status_code == 200, f"F9 Patient Drilldown Failed: {res_patient.text}"
    p_detail = res_patient.json()
    assert p_detail["user"]["user_id"] == uid
    assert "capability_history" in p_detail
    assert "pain_logs" in p_detail
    assert "injury_risk" in p_detail
    print(f"Feature 9 Patient Detail OK! Capability points: {len(p_detail['capability_history'])}, Pain records: {len(p_detail['pain_logs'])}")

    print("\n=======================================================")
    print("ALL 4 NEW FEATURES (2, 4, 8, 9) PASSED INTEGRATION TESTS")
    print("=======================================================")

if __name__ == "__main__":
    test_features_suite()

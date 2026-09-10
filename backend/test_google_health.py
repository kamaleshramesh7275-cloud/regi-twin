import unittest
import json
import datetime
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
from crypto_utils import encrypt_secret, decrypt_secret
from integrations.google_health import (
    calculate_session_load,
    calculate_google_health_acwr,
    get_authorization_url,
    exchange_code_for_tokens
)

client = TestClient(app)

class TestGoogleHealthIntegration(unittest.TestCase):

    def setUp(self):
        self.db = SessionLocal()
        self.test_user_id = "test_gha_user_123"
        # Clear any existing test data
        self.db.query(models.User).filter(models.User.user_id == self.test_user_id).delete()
        self.db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == self.test_user_id).delete()
        self.db.commit()

    def tearDown(self):
        self.db.query(models.User).filter(models.User.user_id == self.test_user_id).delete()
        self.db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == self.test_user_id).delete()
        self.db.commit()
        self.db.close()

    def test_token_encryption_and_decryption(self):
        raw_refresh_token = "1//04test_google_health_refresh_token_xyz_998877"
        encrypted = encrypt_secret(raw_refresh_token, "GHA_TOKEN_ENCRYPTION_SECRET")
        self.assertNotEqual(encrypted, raw_refresh_token)
        decrypted = decrypt_secret(encrypted, "GHA_TOKEN_ENCRYPTION_SECRET")
        self.assertEqual(decrypted, raw_refresh_token)

    def test_session_load_calculation_with_hr_zones(self):
        # Zone 1 (< 110 bpm) -> 1.0
        load_z1 = calculate_session_load({"duration_minutes": 30, "avg_heart_rate": 105, "name": "Walk"})
        self.assertEqual(load_z1["intensity_factor"], 1.0)
        self.assertEqual(load_z1["load_score"], 30.0)

        # Zone 3 (130-155 bpm) -> 1.6
        load_z3 = calculate_session_load({"duration_minutes": 45, "avg_heart_rate": 145, "name": "Tempo Run"})
        self.assertEqual(load_z3["intensity_factor"], 1.6)
        self.assertEqual(load_z3["load_score"], 72.0)

        # Zone 5 (> 175 bpm) -> 2.5
        load_z5 = calculate_session_load({"duration_minutes": 20, "avg_heart_rate": 182, "name": "Sprint Intervals"})
        self.assertEqual(load_z5["intensity_factor"], 2.5)
        self.assertEqual(load_z5["load_score"], 50.0)

    def test_acwr_calculation_and_zones(self):
        today = datetime.date.today()
        activities = []
        
        # Build 28 days of balanced sessions (4 sessions/week, ~50 load each)
        for i in range(28):
            if i % 2 == 0:
                act_date = today - datetime.timedelta(days=i)
                activities.append({
                    "name": "Cardio / Strength",
                    "activity_type": "running",
                    "duration_minutes": 35,
                    "avg_heart_rate": 140,
                    "timestamp": act_date.isoformat()
                })
                
        acwr_res = calculate_google_health_acwr(activities, reference_date=today)
        self.assertIn("acwr", acwr_res)
        self.assertGreater(acwr_res["acute_load"], 0)
        self.assertGreater(acwr_res["chronic_load"], 0)
        # Balanced workouts should yield optimal ACWR
        self.assertFalse(acwr_res["is_cold_start"])
        self.assertIn(acwr_res["status"], ["optimal", "low", "caution"])

    def test_acwr_cold_start_detection(self):
        today = datetime.date.today()
        # Only 2 sessions logged
        activities = [
            {"name": "Run 1", "duration_minutes": 30, "avg_heart_rate": 140, "timestamp": today.isoformat()},
            {"name": "Run 2", "duration_minutes": 30, "avg_heart_rate": 140, "timestamp": (today - datetime.timedelta(days=2)).isoformat()}
        ]
        acwr_res = calculate_google_health_acwr(activities, reference_date=today)
        self.assertTrue(acwr_res["is_cold_start"])
        self.assertEqual(acwr_res["status"], "building_baseline")

    def test_oauth_authorization_url_and_status_endpoints(self):
        # 1. Authorize URL
        resp = client.get(f"/users/{self.test_user_id}/integrations/google-health/authorize")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("accounts.google.com", data["url"])
        self.assertIn(self.test_user_id, data["url"])

        # 2. Status when disconnected
        status_resp = client.get(f"/users/{self.test_user_id}/integrations/status")
        self.assertEqual(status_resp.status_code, 200)
        self.assertFalse(status_resp.json()["google_health"])

        # 3. Simulate callback connection
        cb_resp = client.get(f"/oauth/google-health/callback?code=mock_oauth_code_123&state={self.test_user_id}")
        self.assertEqual(cb_resp.status_code, 200)
        self.assertIn("Google Health Connected", cb_resp.text)

        # 4. Status when connected
        status_resp2 = client.get(f"/users/{self.test_user_id}/integrations/status")
        self.assertEqual(status_resp2.status_code, 200)
        self.assertTrue(status_resp2.json()["google_health"])

        # 5. Live sync
        sync_resp = client.post(f"/integrations/google-health/sync/{self.test_user_id}")
        self.assertEqual(sync_resp.status_code, 200)
        sync_data = sync_resp.json()
        self.assertIn("acwr", sync_data)
        self.assertIn("activities", sync_data)

        # 6. Disconnect
        del_resp = client.delete(f"/users/{self.test_user_id}/integrations/google-health")
        self.assertEqual(del_resp.status_code, 200)
        status_resp3 = client.get(f"/users/{self.test_user_id}/integrations/status")
        self.assertFalse(status_resp3.json()["google_health"])

    def test_dynamic_risk_with_google_health_activities(self):
        base_risk = {"lumbar": 20, "left_knee": 20, "right_knee": 20, "left_thigh": 20}
        
        # High load running session with low protein
        payload = {
            "base_risk": base_risk,
            "fit_data": {
                "workouts": [
                    {
                        "name": "High-Intensity Interval Trail Run",
                        "load_level": "High",
                        "load_score": 75,
                        "muscle_target": ["quadriceps", "calves", "glutes"]
                    }
                ],
                "nutrition": {"protein": "Low", "avg_protein_g": 65}
            }
        }
        resp = client.post("/analytics/dynamic-risk", json=payload)
        self.assertEqual(resp.status_code, 200)
        risk = resp.json()
        # High load running + low protein should escalate knee/lumbar risk
        self.assertGreater(risk["left_knee"], base_risk["left_knee"])
        self.assertGreater(risk["lumbar"], base_risk["lumbar"])


if __name__ == "__main__":
    unittest.main()

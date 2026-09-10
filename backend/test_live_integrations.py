import os
import sys
import unittest
import json
import datetime

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from crypto_utils import encrypt_secret, decrypt_secret
from integrations.hevy_client import parse_hevy_workouts, map_exercise_to_muscles
from integrations.nutritionix_client import NutritionixClient
from database import SessionLocal, engine, Base
import models
from fastapi.testclient import TestClient
from main import app

class TestLiveIntegrations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls.test_user_id = f"test_user_{int(datetime.datetime.utcnow().timestamp())}"

    @classmethod
    def tearDownClass(cls):
        # Cleanup test user
        cls.db.query(models.NutritionLog).filter(models.NutritionLog.user_id == cls.test_user_id).delete()
        cls.db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == cls.test_user_id).delete()
        cls.db.query(models.User).filter(models.User.user_id == cls.test_user_id).delete()
        cls.db.commit()
        cls.db.close()

    def test_01_fernet_encryption(self):
        """Verify API keys are encrypted at rest with Fernet and decrypted properly."""
        raw_token = "hevy_api_test_secret_key_12345"
        encrypted = encrypt_secret(raw_token)
        self.assertNotEqual(raw_token, encrypted)
        self.assertTrue(len(encrypted) > 20)
        
        decrypted = decrypt_secret(encrypted)
        self.assertEqual(raw_token, decrypted)

    def test_02_hevy_connection_and_status(self):
        """Test connect, status, and disconnect endpoints for Hevy."""
        # 1. Initially not connected
        res = self.client.get(f"/users/{self.test_user_id}/integrations/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["hevy"])

        # 2. Connect Hevy key
        connect_res = self.client.post(
            f"/users/{self.test_user_id}/integrations/hevy",
            json={"api_key": "hevy_mock_pro_key_abc123"}
        )
        self.assertEqual(connect_res.status_code, 200)
        self.assertTrue(connect_res.json()["hevy"])

        # Verify key is encrypted in DB and NOT stored in plaintext
        user = self.db.query(models.User).filter(models.User.user_id == self.test_user_id).first()
        self.assertIsNotNone(user)
        self.assertNotEqual(user.hevy_api_key_encrypted, "hevy_mock_pro_key_abc123")
        self.assertEqual(decrypt_secret(user.hevy_api_key_encrypted), "hevy_mock_pro_key_abc123")

        # 3. Status returns connected
        res_after = self.client.get(f"/users/{self.test_user_id}/integrations/status")
        self.assertTrue(res_after.json()["hevy"])

        # 4. Disconnect Hevy
        del_res = self.client.delete(f"/users/{self.test_user_id}/integrations/hevy")
        self.assertEqual(del_res.status_code, 200)
        self.assertFalse(del_res.json()["hevy"])

        # Verify DB is cleared
        self.db.refresh(user)
        self.assertIsNone(user.hevy_api_key_encrypted)

    def test_03_hevy_workout_parsing_and_real_acwr(self):
        """Verify mathematical ACWR calculation: Acute (7d) / Chronic (28d / 4)."""
        now = datetime.datetime.utcnow()
        
        # Create 4 weeks of workout sessions
        raw_workouts = []
        
        # 2 workouts per week for last 4 weeks
        for week in range(4):
            for day_offset in [1, 4]:
                w_date = now - datetime.timedelta(days=(week * 7 + day_offset))
                raw_workouts.append({
                    "id": f"workout_w{week}_d{day_offset}",
                    "title": "Leg & Back Hypertrophy",
                    "start_time": w_date.isoformat(),
                    "end_time": (w_date + datetime.timedelta(minutes=60)).isoformat(),
                    "exercises": [
                        {
                            "title": "Barbell Squat",
                            "sets": [
                                {"weight_kg": 100.0, "reps": 10},
                                {"weight_kg": 100.0, "reps": 10},
                                {"weight_kg": 100.0, "reps": 10}
                            ]
                        },
                        {
                            "title": "Romanian Deadlift",
                            "sets": [
                                {"weight_kg": 80.0, "reps": 10},
                                {"weight_kg": 80.0, "reps": 10}
                            ]
                        }
                    ]
                })

        parsed = parse_hevy_workouts(raw_workouts)
        self.assertIn("weekly_stats", parsed)
        stats = parsed["weekly_stats"]
        
        # Each session volume: (3*10*100) + (2*10*80) = 3000 + 1600 = 4600 kg
        # 2 sessions in week 0 (7 days) = 9200 kg acute load
        # 8 sessions over 28 days = 36800 kg total / 4 = 9200 kg chronic weekly avg
        # ACWR = 9200 / 9200 = 1.0
        self.assertAlmostEqual(stats["acwr"], 1.0, delta=0.1)
        self.assertFalse(stats["is_cold_start"])
        self.assertEqual(stats["acwr_status"], "Optimal Sweet Spot (0.8-1.3)")

    def test_04_nutritionix_natural_language_logging(self):
        """Test natural language food parser with macros & micronutrients."""
        client = NutritionixClient()
        success, result, note = client.parse_natural_nutrition("2 large eggs, 2 slices whole wheat toast, 1 cup black coffee")
        self.assertTrue(success)
        self.assertGreater(result["calories"], 150)
        self.assertGreater(result["protein_g"], 10.0)
        self.assertIn("micronutrients", result)
        self.assertIn("iron_mg", result["micronutrients"])
        self.assertIn("calcium_mg", result["micronutrients"])

    def test_05_nutrition_endpoints_and_daily_weekly_rollups(self):
        """Test POST /nutrition/log/{user_id}, GET /nutrition/daily/{user_id}, and GET /nutrition/week/{user_id}."""
        # Log a breakfast meal
        post_res = self.client.post(
            f"/nutrition/log/{self.test_user_id}",
            json={
                "text": "3 eggs, 1 bagel, black coffee",
                "meal_name": "Breakfast"
            }
        )
        self.assertEqual(post_res.status_code, 200)
        data = post_res.json()
        self.assertGreater(data["calories"], 100)
        self.assertGreater(data["protein_g"], 15.0)

        # Query daily nutrition
        daily_res = self.client.get(f"/nutrition/daily/{self.test_user_id}")
        self.assertEqual(daily_res.status_code, 200)
        daily_data = daily_res.json()
        self.assertGreaterEqual(daily_data["calories"], data["calories"])
        self.assertEqual(len(daily_data["meals"]), 1)
        self.assertIn("micronutrients", daily_data)

        # Query weekly rollup
        week_res = self.client.get(f"/nutrition/week/{self.test_user_id}")
        self.assertEqual(week_res.status_code, 200)
        week_data = week_res.json()
        self.assertEqual(len(week_data["nutrition"]), 7)
        self.assertEqual(week_data["weekly_summary"]["tracked_days"], 1)

    def test_06_dynamic_risk_calculation(self):
        """Verify dynamic risk increases joint risk scores when high leg volume pairs with low protein."""
        base_risk = {
            "lumbar": 20, "left_knee": 25, "right_knee": 25, "left_thigh": 10
        }
        
        # Heavy leg workout + low protein
        fit_payload = {
            "workouts": [
                {"name": "Heavy Leg Day", "load": "High", "volume_kg": 8500}
            ],
            "nutrition": {
                "protein": "Low",
                "avg_protein_g": 65
            }
        }
        
        res = self.client.post(
            "/analytics/dynamic-risk",
            json={"base_risk": base_risk, "fit_data": fit_payload}
        )
        self.assertEqual(res.status_code, 200)
        updated_risk = res.json()
        
        self.assertGreater(updated_risk["lumbar"], base_risk["lumbar"])
        self.assertGreater(updated_risk["left_knee"], base_risk["left_knee"])
        self.assertGreater(updated_risk["right_knee"], base_risk["right_knee"])


if __name__ == "__main__":
    unittest.main()

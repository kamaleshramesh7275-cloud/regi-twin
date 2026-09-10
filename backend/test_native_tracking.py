import unittest
from fastapi.testclient import TestClient
from main import app
from database import get_db, SessionLocal
from models import Exercise, Food, Workout, WorkoutExercise, SetLog, NutritionLog, WaterLog, BodyWeightLog
import io
import uuid

class TestNativeTracking(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.user_id = f"test_native_user_{uuid.uuid4().hex[:8]}"

    def test_01_exercise_catalog(self):
        """Test fetching exercise catalog and filtering"""
        res = self.client.get("/exercises")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(len(data), 100)
        
        # Test search
        res_search = self.client.get("/exercises?search=bench")
        self.assertEqual(res_search.status_code, 200)
        bench_results = res_search.json()
        self.assertTrue(any("Bench Press" in ex["name"] for ex in bench_results))

    def test_02_food_catalog(self):
        """Test searching food database"""
        res = self.client.get("/foods/search?q=chicken")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue("Chicken Breast" in data[0]["name"])

    def test_03_workout_lifecycle_and_pr(self):
        """Test starting a workout, logging sets, and detecting a new PR"""
        # 1. Create Workout
        create_res = self.client.post(f"/workouts/{self.user_id}", json={"name": "Heavy Push Day"})
        self.assertEqual(create_res.status_code, 200)
        workout = create_res.json()
        workout_id = workout["id"]

        # 2. Add Bench Press exercise
        exs = self.client.get("/exercises?search=barbell bench press").json()
        bench_id = exs[0]["id"]
        
        we_res = self.client.post(f"/workouts/{workout_id}/exercises", json={"exercise_id": bench_id, "order_index": 0})
        self.assertEqual(we_res.status_code, 200)
        we_id = we_res.json()["id"]

        # 3. Log a heavy set: 100kg x 5 reps (Epley 1RM = 100 * (1 + 5/30) = 116.67 kg)
        set_res = self.client.post(
            f"/workouts/{workout_id}/exercises/{we_id}/sets",
            json={
                "set_number": 1,
                "set_type": "normal",
                "weight_kg": 100.0,
                "reps": 5,
                "rpe": 8,
                "is_completed": True
            }
        )
        self.assertEqual(set_res.status_code, 200)
        set_data = set_res.json()
        self.assertTrue(set_data["is_new_pr"])
        self.assertAlmostEqual(set_data["new_estimated_1rm"], 116.67, delta=0.5)

        # 4. Finish workout
        finish_res = self.client.patch(
            f"/workouts/{workout_id}",
            json={"duration_seconds": 3600, "notes": "Felt strong!"}
        )
        self.assertEqual(finish_res.status_code, 200)

        # 5. Check stats
        stats_res = self.client.get(f"/workouts/{self.user_id}/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.json()
        self.assertGreater(stats["total_workouts"], 0)
        self.assertGreater(stats["acute_load"], 0)

    def test_04_nutrition_water_and_weight(self):
        """Test daily nutrition logging, water logging and body weight tracking"""
        # 1. Log a meal
        meal_res = self.client.post(
            f"/nutrition/log/{self.user_id}",
            json={
                "meal_type": "Lunch",
                "items": [
                    {
                        "name": "Chicken Breast (Grilled)",
                        "portion_g": 200,
                        "calories": 330,
                        "protein_g": 62.0,
                        "carbs_g": 0.0,
                        "fat_g": 7.2,
                        "micros": {"iron_mg": 2.0, "zinc_mg": 2.0}
                    }
                ],
                "notes": "Post gym meal"
            }
        )
        self.assertEqual(meal_res.status_code, 200)

        # 2. Log Water
        water_res = self.client.post(
            f"/nutrition/water/{self.user_id}",
            json={"amount_ml": 500}
        )
        self.assertEqual(water_res.status_code, 200)
        self.assertGreaterEqual(water_res.json()["total_water_ml"], 500)

        # 3. Log Body Weight
        weight_res = self.client.post(
            f"/nutrition/weight/{self.user_id}",
            json={"weight_kg": 75.2}
        )
        self.assertEqual(weight_res.status_code, 200)
        self.assertEqual(weight_res.json()["weight_kg"], 75.2)

        # 4. Check Daily Rollup
        daily_res = self.client.get(f"/nutrition/daily/{self.user_id}")
        self.assertEqual(daily_res.status_code, 200)
        daily = daily_res.json()
        self.assertEqual(daily["totals"]["calories"], 330)
        self.assertEqual(daily["totals"]["protein_g"], 62.0)
        self.assertEqual(daily["water_ml"], 500)

    def test_05_photo_upload_validations(self):
        """Test uploading a photo to a workout"""
        # Create workout
        w = self.client.post(f"/workouts/{self.user_id}", json={"name": "Photo Test Workout"}).json()
        workout_id = w["id"]

        # Create dummy image file
        file_data = io.BytesIO(b"fake image data in jpeg format")
        upload_res = self.client.post(
            f"/workouts/{workout_id}/image",
            files={"file": ("workout_pic.jpg", file_data, "image/jpeg")}
        )
        self.assertEqual(upload_res.status_code, 200)
        self.assertTrue(upload_res.json()["image_url"].startswith("/uploads/workouts/"))

if __name__ == "__main__":
    unittest.main()

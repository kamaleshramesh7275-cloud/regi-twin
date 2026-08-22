from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
import datetime

from database import engine, get_db, Base
import models
from mock_sensor import SyntheticSensorGenerator
from analytics import compute_capability_profile, generate_weekly_letter, generate_deep_insights, chat_with_twin, simulate_activity

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PhysioTwin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class UserCreate(BaseModel):
    user_id: str
    email: str
    age: Optional[int] = None
    sex: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    mode: str = "General Human"
    goals: Optional[str] = None
    consent: bool = False

class SensorDataResponse(BaseModel):
    timestamp: int
    heart_rate: float
    spo2: float
    temperature: float
    accel_x: float
    accel_y: float
    accel_z: float
    source: str
class VisionSessionCreate(BaseModel):
    user_id: str
    task_type: str
    pose_landmarks_json: str
    joint_angles_json: str
    rom: float
    movement_speed: float
    symmetry: float
    stability: float
    camera_quality: str
    annotated_image_url: Optional[str] = None

class AnalyticsDashboardResponse(BaseModel):
    mobility: float
    stability: float
    quality: float
    cardio: float
    recovery: float
    reserve: float
    confidence: str
    change_point_alert: Optional[str] = None
    zone_risks: Optional[Any] = None
    trend_data: Optional[Any] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class SimulationRequest(BaseModel):
    activity_type: str
    duration_mins: int
    intensity: str

generator = SyntheticSensorGenerator()

@app.get("/")
def read_root():
    return {"message": "PhysioTwin API is running"}

@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == user.user_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")
    
    new_user = models.User(
        user_id=user.user_id,
        email=user.email,
        age=user.age,
        sex=user.sex,
        height=user.height,
        weight=user.weight,
        mode=user.mode,
        goals=user.goals,
        consent=user.consent
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/sensors/synthetic", response_model=SensorDataResponse)
def get_synthetic_sensor_data(exertion: float = 0.0):
    """
    Fetch a single frame of simulated sensor data based on exertion level (0.0 to 1.0)
    """
    data = generator.generate(exertion)
    return data

class SyncFitRequest(BaseModel):
    fit_data: dict
    base_risk: dict

@app.post("/analytics/dynamic-risk")
def calculate_dynamic_risk(req: SyncFitRequest):
    updated_risk = req.base_risk.copy()
    fit_data = req.fit_data
    
    workouts = fit_data.get("workouts", [])
    nutrition = fit_data.get("nutrition", {})
    
    has_heavy_legs = any(
        "Leg Day" in w.get("name", "") and w.get("load") == "High" 
        for w in workouts
    )
    has_low_protein = "Low" in nutrition.get("protein", "")
    
    if has_heavy_legs and has_low_protein:
        updated_risk["lumbar"] = min(100, updated_risk.get("lumbar", 0) + 35)
        updated_risk["left_knee"] = min(100, updated_risk.get("left_knee", 0) + 25)
        updated_risk["right_knee"] = min(100, updated_risk.get("right_knee", 0) + 30)
        updated_risk["left_thigh"] = min(100, updated_risk.get("left_thigh", 0) + 15)
        
    return updated_risk

class SyncExternalAppsRequest(BaseModel):
    workouts: list
    nutrition: dict

@app.post("/analytics/external-apps/{user_id}")
def sync_external_apps(user_id: str, req: SyncExternalAppsRequest, db: Session = Depends(get_db)):
    import json
    # Clear old entries for demo purposes to avoid infinite DB growth
    db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == user_id).delete()
    
    entries = []
    if req.workouts:
        entries.append(
            models.ExternalAppSession(
                user_id=user_id,
                app_name="Hevy",
                session_data=json.dumps({"workouts": req.workouts})
            )
        )
    if req.nutrition:
        entries.append(
            models.ExternalAppSession(
                user_id=user_id,
                app_name="HealthifyMe",
                session_data=json.dumps({"nutrition": req.nutrition})
            )
        )
    if entries:
        db.bulk_save_objects(entries)
        db.commit()
    return {"status": "synced", "count": len(entries)}

@app.post("/sessions/vision")
def ingest_vision_session(session: VisionSessionCreate, db: Session = Depends(get_db)):
    new_session = models.VisionSession(
        user_id=session.user_id,
        task_type=session.task_type,
        pose_landmarks_json=session.pose_landmarks_json,
        joint_angles_json=session.joint_angles_json,
        rom=session.rom,
        movement_speed=session.movement_speed,
        symmetry=session.symmetry,
        stability=session.stability,
        camera_quality=session.camera_quality,
        annotated_image_url=session.annotated_image_url
    )
    db.add(new_session)
    db.commit()
    
    # Compute profile right after a session is added
    compute_capability_profile(session.user_id, db)
    
    return {"message": "Vision session logged and profile updated"}

@app.get("/sessions/history/{user_id}")
def get_session_history(user_id: str, db: Session = Depends(get_db)):
    sessions = db.query(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.VisionSession.timestamp.desc()).all()
    return [{
        "id": s.id,
        "timestamp": s.timestamp.isoformat(),
        "task_type": s.task_type,
        "rom": s.rom,
        "movement_speed": s.movement_speed,
        "symmetry": s.symmetry,
        "stability": s.stability,
        "annotated_image_url": s.annotated_image_url
    } for s in sessions]

@app.get("/analytics/dashboard/{user_id}", response_model=AnalyticsDashboardResponse)
def get_dashboard(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    if not profile:
        return AnalyticsDashboardResponse(
            mobility=50, stability=50, quality=50, cardio=50, recovery=50, reserve=50, confidence="Low"
        )
    
    cp = db.query(models.ChangePoint).filter(models.ChangePoint.user_id == user_id).order_by(models.ChangePoint.detected_at.desc()).first()
    alert = None
    if cp:
        alert = f"Deterioration detected in {cp.metric_name} over last 3 sessions."
        
    import json
    
    # Provide default fallback for zone risks and trend data if the profile lacks them
    default_zone_risks = {
        "left_knee": 72,
        "right_knee": 25,
        "lumbar": 48,
        "cervical": 65,
        "left_shoulder": 20,
        "right_shoulder": 15,
        "left_ankle": 55,
        "right_ankle": 30,
        "left_hip": 18,
        "right_hip": 22
    }
    
    default_trend_data = [
        {"name": "W1", "mobility": 74, "stability": 72, "quality": 85, "cardio": 70, "recovery": 80, "reserve": 50},
        {"name": "W2", "mobility": 76, "stability": 70, "quality": 86, "cardio": 72, "recovery": 82, "reserve": 52},
        {"name": "W3", "mobility": 78, "stability": 68, "quality": 88, "cardio": 74, "recovery": 84, "reserve": 53},
        {"name": "W4", "mobility": 80, "stability": 66, "quality": 90, "cardio": 76, "recovery": 85, "reserve": 54},
        {"name": "W5", "mobility": 82, "stability": 65, "quality": 91, "cardio": 77, "recovery": 86, "reserve": 55},
        {"name": "W6", "mobility": 84, "stability": 63, "quality": 92, "cardio": 78, "recovery": 87, "reserve": 56},
        {"name": "W7", "mobility": 86, "stability": 62, "quality": 93, "cardio": 79, "recovery": 88, "reserve": 55},
        {"name": "W8", "mobility": 88, "stability": 64, "quality": 93, "cardio": 79, "recovery": 88, "reserve": 55}
    ]

    return AnalyticsDashboardResponse(
        mobility=profile.mobility,
        stability=profile.stability,
        quality=profile.movement_quality,
        cardio=profile.cardiovascular_efficiency,
        recovery=profile.recovery,
        reserve=profile.capability_reserve,
        confidence=profile.confidence,
        change_point_alert=alert,
        zone_risks=json.loads(profile.zone_risks) if profile.zone_risks else default_zone_risks,
        trend_data=json.loads(profile.trend_data) if profile.trend_data else default_trend_data
    )

@app.post("/analytics/weekly-letter/{user_id}")
def get_weekly_letter(user_id: str, db: Session = Depends(get_db)):
    letter = generate_weekly_letter(user_id, db)
    return {"letter": letter}

@app.post("/analytics/deep-insights/{user_id}")
def get_deep_insights(user_id: str, db: Session = Depends(get_db)):
    insights = generate_deep_insights(user_id, db)
    return {"insights": insights}

@app.post("/analytics/chat/{user_id}")
def api_chat_with_twin(user_id: str, req: ChatRequest, db: Session = Depends(get_db)):
    messages_dict = [{"role": msg.role, "content": msg.content} for msg in req.messages]
    response = chat_with_twin(user_id, messages_dict, db)
    return {"response": response}

@app.post("/analytics/simulate/{user_id}")
def api_simulate_activity(user_id: str, req: SimulationRequest, db: Session = Depends(get_db)):
    result = simulate_activity(user_id, req.activity_type, req.duration_mins, req.intensity, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/reports/analyze/{user_id}")
async def analyze_medical_report(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Simulate AI processing delay
    await asyncio.sleep(2.5)

    # 2. Extract diagnosis (Mocked AI Analysis)
    # Regardless of the actual image uploaded, we will detect a "Meniscus Tear" 
    # to demonstrate the risk update flow and Twin visualization.
    diagnosis = {
        "zone": "left_knee",
        "condition": "Grade 2 Meniscus Tear",
        "severity": 85,
        "recommendation": "Avoid high-impact axial loading. Prescribe stabilization protocol."
    }

    # 3. Update the user's base ZoneRisk profile
    user_zones = db.query(models.ZoneRisk).filter(models.ZoneRisk.user_id == user_id).first()
    if not user_zones:
        user_zones = models.ZoneRisk(user_id=user_id)
        db.add(user_zones)
    
    # Spike the risk for the affected zone
    setattr(user_zones, diagnosis["zone"], diagnosis["severity"])
    db.commit()

    return {
        "status": "success",
        "filename": file.filename,
        "finding": diagnosis
    }


@app.get("/analytics/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    # If leaderboard is empty, seed it with some realistic default data
    entries = db.query(models.LeaderboardEntry).order_by(models.LeaderboardEntry.score.desc()).all()
    if not entries:
        seed_data = [
            models.LeaderboardEntry(username="AlexChen", score=940, rank_change=1),
            models.LeaderboardEntry(username="SarahJ", score=890, rank_change=0),
            models.LeaderboardEntry(username="MikeT", score=865, rank_change=-1),
            models.LeaderboardEntry(username="EmmaW", score=840, rank_change=2),
            models.LeaderboardEntry(username="ChrisP", score=810, rank_change=0)
        ]
        db.bulk_save_objects(seed_data)
        db.commit()
        entries = db.query(models.LeaderboardEntry).order_by(models.LeaderboardEntry.score.desc()).all()
        
    return [{"username": e.username, "score": e.score, "rank_change": e.rank_change} for e in entries]

@app.get("/analytics/external-apps/{user_id}")
def get_external_apps(user_id: str, db: Session = Depends(get_db)):
    import json
    entries = db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == user_id).order_by(models.ExternalAppSession.timestamp.desc()).all()
    if not entries:
        # Seed realistic external app data to simulate the webhook
        seed_data = [
            models.ExternalAppSession(user_id=user_id, app_name="Hevy", session_data=json.dumps({
                "workouts": [
                  {"app": "Hevy", "name": "Leg Day (Heavy)", "load": "High", "day": "Mon",
                   "volume_kg": 14200, "duration_min": 75, "sets": 22, "reps_total": 176,
                   "affectedZones": ["left_knee", "right_knee", "lumbar", "left_thigh", "right_thigh", "glutes"],
                   "exercises": [
                     {"name": "Barbell Back Squat", "sets": 5, "reps": 5, "weight_kg": 120, "volume": 3000, "is_pr": True, "prev_1rm": 138},
                     {"name": "Romanian Deadlift", "sets": 4, "reps": 10, "weight_kg": 90, "volume": 3600, "is_pr": False, "prev_1rm": 118},
                     {"name": "Leg Press", "sets": 4, "reps": 12, "weight_kg": 160, "volume": 7680, "is_pr": False},
                     {"name": "Leg Curl (Machine)", "sets": 3, "reps": 12, "weight_kg": 55, "volume": 1980, "is_pr": False},
                     {"name": "Walking Lunges", "sets": 3, "reps": 20, "weight_kg": 20, "volume": 1200, "is_pr": False},
                     {"name": "Calf Raises", "sets": 4, "reps": 15, "weight_kg": 80, "volume": 4800, "is_pr": False}
                   ]},
                  {"app": "Hevy", "name": "Rest Day", "load": "None", "day": "Tue",
                   "volume_kg": 0, "duration_min": 0, "sets": 0, "reps_total": 0,
                   "affectedZones": [], "exercises": []},
                  {"app": "Hevy", "name": "Push Day (Hypertrophy)", "load": "Medium", "day": "Wed",
                   "volume_kg": 9800, "duration_min": 65, "sets": 20, "reps_total": 200,
                   "affectedZones": ["chest", "left_shoulder", "right_shoulder", "triceps"],
                   "exercises": [
                     {"name": "Incline Bench Press", "sets": 4, "reps": 10, "weight_kg": 85, "volume": 3400, "is_pr": False, "prev_1rm": 112},
                     {"name": "Flat Dumbbell Press", "sets": 3, "reps": 12, "weight_kg": 36, "volume": 1296, "is_pr": False},
                     {"name": "Cable Lateral Raise", "sets": 4, "reps": 15, "weight_kg": 12, "volume": 720, "is_pr": False},
                     {"name": "Arnold Press", "sets": 3, "reps": 10, "weight_kg": 22, "volume": 660, "is_pr": True, "prev_1rm": 29},
                     {"name": "Tricep Rope Pushdown", "sets": 3, "reps": 15, "weight_kg": 30, "volume": 1350, "is_pr": False},
                     {"name": "Overhead Tricep Extension", "sets": 3, "reps": 12, "weight_kg": 25, "volume": 900, "is_pr": False}
                   ]},
                  {"app": "Hevy", "name": "Pull Day (Heavy)", "load": "High", "day": "Thu",
                   "volume_kg": 12400, "duration_min": 70, "sets": 21, "reps_total": 182,
                   "affectedZones": ["lumbar", "neck", "biceps", "left_shoulder", "right_shoulder", "traps"],
                   "exercises": [
                     {"name": "Conventional Deadlift", "sets": 4, "reps": 5, "weight_kg": 150, "volume": 3000, "is_pr": True, "prev_1rm": 168},
                     {"name": "Barbell Row (Pendlay)", "sets": 4, "reps": 8, "weight_kg": 100, "volume": 3200, "is_pr": False, "prev_1rm": 120},
                     {"name": "Weighted Pull-Ups", "sets": 4, "reps": 8, "weight_kg": 20, "volume": 2560, "is_pr": False},
                     {"name": "Face Pulls", "sets": 3, "reps": 15, "weight_kg": 30, "volume": 1350, "is_pr": False},
                     {"name": "Barbell Curl", "sets": 3, "reps": 10, "weight_kg": 40, "volume": 1200, "is_pr": False},
                     {"name": "Hammer Curl", "sets": 3, "reps": 12, "weight_kg": 18, "volume": 648, "is_pr": False}
                   ]},
                  {"app": "Hevy", "name": "Rest Day", "load": "None", "day": "Fri",
                   "volume_kg": 0, "duration_min": 0, "sets": 0, "reps_total": 0,
                   "affectedZones": [], "exercises": []},
                  {"app": "Hevy", "name": "Full Body Strength", "load": "Medium", "day": "Sat",
                   "volume_kg": 10600, "duration_min": 80, "sets": 24, "reps_total": 220,
                   "affectedZones": ["left_knee", "right_knee", "lumbar", "chest", "traps", "core"],
                   "exercises": [
                     {"name": "Front Squat", "sets": 4, "reps": 6, "weight_kg": 90, "volume": 2160, "is_pr": False},
                     {"name": "Bench Press", "sets": 4, "reps": 8, "weight_kg": 95, "volume": 3040, "is_pr": False, "prev_1rm": 125},
                     {"name": "T-Bar Row", "sets": 4, "reps": 10, "weight_kg": 70, "volume": 2800, "is_pr": False},
                     {"name": "Dumbbell Shoulder Press", "sets": 3, "reps": 10, "weight_kg": 28, "volume": 840, "is_pr": False},
                     {"name": "Cable Crunch", "sets": 3, "reps": 15, "weight_kg": 50, "volume": 2250, "is_pr": False},
                     {"name": "Farmer's Walk", "sets": 3, "reps": 1, "weight_kg": 50, "volume": 150, "is_pr": False}
                   ]},
                  {"app": "Hevy", "name": "Active Recovery", "load": "Low", "day": "Sun",
                   "volume_kg": 1800, "duration_min": 40, "sets": 8, "reps_total": 120,
                   "affectedZones": ["core", "glutes"],
                   "exercises": [
                     {"name": "Yoga Flow", "sets": 1, "reps": 30, "weight_kg": 0, "volume": 0, "is_pr": False},
                     {"name": "Band Pull-Aparts", "sets": 3, "reps": 20, "weight_kg": 5, "volume": 300, "is_pr": False},
                     {"name": "Glute Bridges", "sets": 4, "reps": 20, "weight_kg": 30, "volume": 2400, "is_pr": False}
                   ]}
                ],
                "weekly_stats": {
                  "total_volume_kg": 48800,
                  "total_sessions": 5,
                  "total_sets": 95,
                  "avg_session_duration": 66,
                  "acute_load": 38500,
                  "chronic_load": 28000,
                  "acwr": 1.37,
                  "readiness_score": 72,
                  "hrv_avg": 58,
                  "sleep_avg_h": 7.2,
                  "prs_this_week": 4,
                  "muscle_groups": {"Legs": 38, "Back": 28, "Chest": 18, "Shoulders": 10, "Arms": 6}
                }
            })),
            models.ExternalAppSession(user_id=user_id, app_name="HealthifyMe", session_data=json.dumps({
                "nutrition": [
                  {"day": "Mon", "calories": 2180, "protein": 128, "carbs": 235, "fat": 62, "fiber": 24, "sugar": 45, "sodium": 1850, "water_ml": 2800, "hydration": "Optimal",
                   "food_quality_score": 82, "recovery_note": "Solid protein intake, but consider bumping up hydration post-workout.",
                   "micronutrients": {"iron_pct": 110, "calcium_pct": 95, "vit_d_pct": 80, "vit_b12_pct": 120, "magnesium_pct": 90, "potassium_pct": 85},
                   "meals": [
                     {"meal": "Breakfast", "items": "3 Egg Omelette with Spinach, 2 Multigrain Toast, Black Coffee", "kcal": 420, "protein": 32, "time": "07:30"},
                     {"meal": "Lunch", "items": "Chicken Biryani (1 plate), Raita, Salad", "kcal": 680, "protein": 38, "time": "13:00"},
                     {"meal": "Snack", "items": "Protein Shake (whey), 1 Banana", "kcal": 280, "protein": 30, "time": "16:30"},
                     {"meal": "Dinner", "items": "Grilled Fish, Brown Rice, Stir-fried Veggies", "kcal": 520, "protein": 28, "time": "20:00"},
                     {"meal": "Post-Dinner", "items": "Greek Yogurt with Almonds", "kcal": 280, "protein": 0, "time": "22:00"}
                   ]},
                  {"day": "Tue", "calories": 2350, "protein": 148, "carbs": 248, "fat": 68, "fiber": 28, "sugar": 38, "sodium": 1720, "water_ml": 3200, "hydration": "Optimal",
                   "food_quality_score": 88, "recovery_note": "Great micronutrient diversity today. Iron levels are well-supported.",
                   "micronutrients": {"iron_pct": 130, "calcium_pct": 105, "vit_d_pct": 85, "vit_b12_pct": 115, "magnesium_pct": 95, "potassium_pct": 90},
                   "meals": [
                     {"meal": "Breakfast", "items": "Overnight Oats with Protein Powder, Berries, Chia Seeds", "kcal": 450, "protein": 35, "time": "07:00"},
                     {"meal": "Lunch", "items": "Dal Tadka, 3 Rotis, Paneer Bhurji, Buttermilk", "kcal": 720, "protein": 42, "time": "12:30"},
                     {"meal": "Snack", "items": "Peanut Butter Toast, Green Tea", "kcal": 320, "protein": 14, "time": "16:00"},
                     {"meal": "Dinner", "items": "Chicken Tikka (6 pcs), Mixed Salad, Quinoa", "kcal": 580, "protein": 45, "time": "19:30"},
                     {"meal": "Post-Dinner", "items": "Casein Shake", "kcal": 280, "protein": 12, "time": "22:30"}
                   ]},
                  {"day": "Wed", "calories": 2520, "protein": 162, "carbs": 268, "fat": 74, "fiber": 32, "sugar": 42, "sodium": 1950, "water_ml": 3500, "hydration": "Optimal",
                   "food_quality_score": 92, "recovery_note": "Your Wednesday protein intake of 162g combined with post-workout carb timing is well-positioned to support your Leg Day DOMS recovery.",
                   "micronutrients": {"iron_pct": 140, "calcium_pct": 110, "vit_d_pct": 90, "vit_b12_pct": 130, "magnesium_pct": 105, "potassium_pct": 100},
                   "meals": [
                     {"meal": "Breakfast", "items": "4 Egg Whites Scramble, Avocado Toast, Orange Juice", "kcal": 480, "protein": 36, "time": "06:45"},
                     {"meal": "Lunch", "items": "Rajma Chawal, Cucumber Raita, Papad", "kcal": 650, "protein": 28, "time": "13:00"},
                     {"meal": "Pre-Workout", "items": "Banana, 10 Almonds, Black Coffee", "kcal": 220, "protein": 6, "time": "15:30"},
                     {"meal": "Post-Workout", "items": "Whey Protein, Dextrose Shake", "kcal": 350, "protein": 42, "time": "17:30"},
                     {"meal": "Dinner", "items": "Mutton Keema, 2 Rotis, Onion Salad", "kcal": 620, "protein": 40, "time": "20:30"},
                     {"meal": "Post-Dinner", "items": "Warm Milk with Turmeric", "kcal": 200, "protein": 10, "time": "22:00"}
                   ]},
                  {"day": "Thu", "calories": 2050, "protein": 118, "carbs": 225, "fat": 58, "fiber": 20, "sugar": 52, "sodium": 2100, "water_ml": 2400, "hydration": "Suboptimal",
                   "food_quality_score": 65, "recovery_note": "Low protein and hydration today. Your recovery readiness is suffering. Aim for lean proteins tomorrow.",
                   "micronutrients": {"iron_pct": 80, "calcium_pct": 75, "vit_d_pct": 60, "vit_b12_pct": 90, "magnesium_pct": 70, "potassium_pct": 75},
                   "meals": [
                     {"meal": "Breakfast", "items": "Poha with Peanuts, Tea", "kcal": 320, "protein": 12, "time": "08:00"},
                     {"meal": "Lunch", "items": "Chole Bhature (2 pcs), Lassi", "kcal": 780, "protein": 22, "time": "13:30"},
                     {"meal": "Snack", "items": "Samosa (2), Chai", "kcal": 380, "protein": 8, "time": "17:00"},
                     {"meal": "Dinner", "items": "Egg Fried Rice, Manchurian", "kcal": 570, "protein": 26, "time": "20:00"}
                   ]},
                  {"day": "Fri", "calories": 2480, "protein": 168, "carbs": 258, "fat": 72, "fiber": 30, "sugar": 35, "sodium": 1680, "water_ml": 3400, "hydration": "Optimal",
                   "food_quality_score": 90, "recovery_note": "Excellent bounce back! Macros are perfectly aligned with your Pull Day demands.",
                   "micronutrients": {"iron_pct": 120, "calcium_pct": 100, "vit_d_pct": 95, "vit_b12_pct": 140, "magnesium_pct": 100, "potassium_pct": 95},
                   "meals": [
                     {"meal": "Breakfast", "items": "Moong Dal Chilla (3), Mint Chutney, Boiled Eggs (2)", "kcal": 420, "protein": 34, "time": "07:15"},
                     {"meal": "Lunch", "items": "Grilled Chicken Breast, Sweet Potato, Broccoli", "kcal": 620, "protein": 52, "time": "12:30"},
                     {"meal": "Snack", "items": "Makhana (Fox Nuts), Protein Bar", "kcal": 310, "protein": 22, "time": "16:00"},
                     {"meal": "Dinner", "items": "Palak Paneer, Jeera Rice, Salad", "kcal": 580, "protein": 32, "time": "19:45"},
                     {"meal": "Post-Dinner", "items": "Cottage Cheese with Flaxseeds", "kcal": 250, "protein": 28, "time": "22:00"}
                   ]},
                  {"day": "Sat", "calories": 2850, "protein": 185, "carbs": 310, "fat": 88, "fiber": 26, "sugar": 58, "sodium": 2200, "water_ml": 3000, "hydration": "Optimal",
                   "food_quality_score": 75, "recovery_note": "High calorie surplus. Useful for strength gains, but watch out for processed sugars.",
                   "micronutrients": {"iron_pct": 115, "calcium_pct": 90, "vit_d_pct": 80, "vit_b12_pct": 150, "magnesium_pct": 85, "potassium_pct": 90},
                   "meals": [
                     {"meal": "Breakfast", "items": "Masala Dosa, Sambar, Coconut Chutney, Filter Coffee", "kcal": 520, "protein": 16, "time": "09:00"},
                     {"meal": "Lunch", "items": "Butter Chicken, Garlic Naan (2), Dal Makhani", "kcal": 920, "protein": 48, "time": "13:30"},
                     {"meal": "Snack", "items": "Fruit Bowl (Mango, Papaya, Pomegranate)", "kcal": 280, "protein": 4, "time": "16:30"},
                     {"meal": "Dinner", "items": "Tandoori Prawns, Pulao, Mixed Veg Curry", "kcal": 680, "protein": 42, "time": "20:00"},
                     {"meal": "Post-Dinner", "items": "Protein Ice Cream, Dark Chocolate (2 squares)", "kcal": 450, "protein": 25, "time": "22:30"}
                   ]},
                  {"day": "Sun", "calories": 2200, "protein": 135, "carbs": 232, "fat": 64, "fiber": 22, "sugar": 40, "sodium": 1550, "water_ml": 2600, "hydration": "Optimal",
                   "food_quality_score": 85, "recovery_note": "Balanced day for active recovery. Magnesium levels could be slightly higher.",
                   "micronutrients": {"iron_pct": 105, "calcium_pct": 95, "vit_d_pct": 85, "vit_b12_pct": 110, "magnesium_pct": 80, "potassium_pct": 85},
                   "meals": [
                     {"meal": "Breakfast", "items": "Idli (4) with Sambar, Coconut Chutney", "kcal": 380, "protein": 14, "time": "08:30"},
                     {"meal": "Lunch", "items": "Fish Curry, Steamed Rice, Bhindi Fry", "kcal": 620, "protein": 38, "time": "13:00"},
                     {"meal": "Snack", "items": "Roasted Chana, Green Tea", "kcal": 180, "protein": 12, "time": "16:00"},
                     {"meal": "Dinner", "items": "Egg Bhurji, 2 Parathas, Curd", "kcal": 580, "protein": 32, "time": "19:30"},
                     {"meal": "Post-Dinner", "items": "Warm Milk with Honey", "kcal": 180, "protein": 9, "time": "21:30"}
                   ]}
                ],
                "weekly_summary": {
                  "avg_calories": 2376,
                  "avg_protein": 149,
                  "avg_carbs": 254,
                  "avg_fat": 69,
                  "total_water_l": 20.9,
                  "protein_target_hit_days": 5,
                  "calorie_target": 2400,
                  "protein_target": 150
                }
            }))
        ]
        db.bulk_save_objects(seed_data)
        db.commit()
        entries = db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == user_id).order_by(models.ExternalAppSession.timestamp.desc()).all()
        
    return [
        {"app_name": e.app_name, "session_data": json.loads(e.session_data), "timestamp": e.timestamp.isoformat()} 
        for e in entries
    ]

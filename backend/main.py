from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Any
import datetime

from database import engine, get_db, Base
import models
from analytics import compute_capability_profile, generate_weekly_letter, generate_deep_insights, chat_with_twin, simulate_activity, compute_injury_risk

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
    capability_mark: Optional[int] = None
    acwr: Optional[float] = None
    acwr_risk: Optional[str] = None
    recovery_score: Optional[int] = None



class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class SimulationRequest(BaseModel):
    activity_type: str
    duration_mins: int
    intensity: str

class PainLogCreate(BaseModel):
    zone: str
    score: int

class TriageRequest(BaseModel):
    score: int
    answers_json: str

class CaseNoteCreate(BaseModel):
    note: str


@app.get("/api/health")
def read_health():
    return {"status": "ok", "message": "PhysioTwin API is running"}

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

# ── Wearable Sync ────────────────────────────────────────────────────────────
# Data arrives via software APIs from consumer smartwatches/fitness bands.
# Supported platforms: Google Fit, Garmin Connect, Fitbit, Apple Health, Samsung Health.
# No dedicated custom hardware — all synced through platform OAuth APIs.

class WearableSyncRequest(BaseModel):
    source: str = "google_fit"   # 'google_fit' | 'garmin' | 'fitbit' | 'apple_health' | 'samsung_health'
    heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    spo2: Optional[float] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None
    sleep_score: Optional[int] = None
    readiness_score: Optional[int] = None
    calories_burned: Optional[int] = None
    active_minutes: Optional[int] = None
    raw_data: Optional[str] = None  # Full JSON string from the platform API

@app.post("/wearables/sync/{user_id}")
def sync_wearable_data(user_id: str, req: WearableSyncRequest, db: Session = Depends(get_db)):
    """
    Ingest a vitals snapshot from a consumer smartwatch/fitness band.
    Called after fetching data from a platform API (Google Fit, Garmin, etc.).
    """
    import json
    session = models.WearableSession(
        user_id=user_id,
        source=req.source,
        heart_rate=req.heart_rate,
        hrv=req.hrv,
        spo2=req.spo2,
        steps=req.steps,
        sleep_hours=req.sleep_hours,
        sleep_score=req.sleep_score,
        readiness_score=req.readiness_score,
        calories_burned=req.calories_burned,
        active_minutes=req.active_minutes,
        raw_data=req.raw_data
    )
    db.add(session)
    db.commit()
    return {"status": "synced", "source": req.source}

@app.get("/wearables/latest/{user_id}")
def get_latest_wearable(user_id: str, db: Session = Depends(get_db)):
    """
    Returns the most recently synced wearable vitals for a user.
    Falls back to seeded defaults if no data has been synced yet.
    """
    session = (
        db.query(models.WearableSession)
        .filter(models.WearableSession.user_id == user_id)
        .order_by(models.WearableSession.timestamp.desc())
        .first()
    )
    if session:
        return {
            "source": session.source,
            "heart_rate": session.heart_rate,
            "hrv": session.hrv,
            "spo2": session.spo2,
            "steps": session.steps,
            "sleep_hours": session.sleep_hours,
            "sleep_score": session.sleep_score,
            "readiness_score": session.readiness_score,
            "calories_burned": session.calories_burned,
            "active_minutes": session.active_minutes,
            "timestamp": session.timestamp.isoformat()
        }
    # Default values shown before first sync
    return {
        "source": "not_synced",
        "heart_rate": None,
        "hrv": None,
        "spo2": None,
        "steps": None,
        "sleep_hours": None,
        "sleep_score": None,
        "readiness_score": None,
        "calories_burned": None,
        "active_minutes": None,
        "timestamp": None
    }


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
    sessions = db.query(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.VisionSession.timestamp.asc()).all()
    
    # Calculate historical bests per task_type to award badges
    best_rom = {}
    best_stability = {}
    best_symmetry = {}
    
    for s in sessions:
        tt = s.task_type
        if s.rom is not None:
            best_rom[tt] = max(best_rom.get(tt, 0.0), s.rom)
        if s.stability is not None:
            best_stability[tt] = max(best_stability.get(tt, 0.0), s.stability)
        if s.symmetry is not None:
            best_symmetry[tt] = max(best_symmetry.get(tt, 0.0), s.symmetry)
            
    history = []
    for i, s in enumerate(sessions):
        badge = None
        tt = s.task_type
        
        # Check if latest session hit or matched all-time bests
        is_pb = False
        if s.rom is not None and s.rom >= best_rom.get(tt, 0.0):
            is_pb = True
        elif s.stability is not None and s.stability >= best_stability.get(tt, 0.0):
            is_pb = True
        elif s.symmetry is not None and s.symmetry >= best_symmetry.get(tt, 0.0):
            is_pb = True
            
        if is_pb:
            badge = "Personal Best"
        elif s.stability is not None and s.stability < 0.70:
            badge = "Watchpoint"
        else:
            # Check for improvement over the previous session of the same task type
            prev_s = None
            for ps in reversed(sessions[:i]):
                if ps.task_type == tt:
                    prev_s = ps
                    break
            if prev_s and prev_s.rom and s.rom and s.rom > prev_s.rom * 1.03:
                badge = "Improved"
                
        history.append({
            "id": s.session_id,
            "timestamp": s.timestamp.isoformat(),
            "task_type": s.task_type,
            "rom": s.rom,
            "movement_speed": s.movement_speed,
            "symmetry": s.symmetry,
            "stability": s.stability,
            "annotated_image_url": s.annotated_image_url,
            "badge": badge
        })
        
    history.reverse()
    return history


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

    # Calculate dynamic capability mark based on capability profile weights
    mobility_score = profile.mobility if profile.mobility is not None else 85.0
    stability_score = profile.stability if profile.stability is not None else 70.0
    quality_score = profile.movement_quality if profile.movement_quality is not None else 92.0
    cardio_score = profile.cardiovascular_efficiency if profile.cardiovascular_efficiency is not None else 78.0
    recovery_score = profile.recovery if profile.recovery is not None else 88.0

    capability_mark = int(round(
        (mobility_score * 0.20) +
        (stability_score * 0.25) +
        (quality_score * 0.20) +
        (cardio_score * 0.20) +
        (recovery_score * 0.15)
    ) * 10)

    # Upsert leaderboard entry for user
    user_obj = db.query(models.User).filter(models.User.user_id == user_id).first()
    username = user_obj.email.split("@")[0] if user_obj and user_obj.email else "You"
    
    entry = db.query(models.LeaderboardEntry).filter(models.LeaderboardEntry.user_id == user_id).first()
    if entry:
        entry.score = capability_mark
        entry.username = username
        entry.updated_at = datetime.datetime.utcnow()
    else:
        entry = models.LeaderboardEntry(
            user_id=user_id,
            username=username,
            score=capability_mark
        )
        db.add(entry)
    db.commit()

    # Calculate ACWR (Acute-to-Chronic Workload Ratio)
    # Fetch user's workout/nutrition sessions from the last 28 days
    twenty_eight_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=28)
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    app_sessions = db.query(models.ExternalAppSession).filter(
        models.ExternalAppSession.user_id == user_id,
        models.ExternalAppSession.timestamp >= twenty_eight_days_ago
    ).all()
    
    acute_loads = []
    chronic_loads = []
    
    for s in app_sessions:
        try:
            data = json.loads(s.session_data)
            workouts = data.get("workouts", [])
            for w in workouts:
                load = w.get("volume_kg", 0)
                if not load:
                    load = w.get("duration_min", 30) * 10
                
                if s.timestamp >= seven_days_ago:
                    acute_loads.append(load)
                chronic_loads.append(load)
        except Exception:
            pass
            
    acute_avg = sum(acute_loads) / 7.0 if acute_loads else 100.0
    chronic_avg = sum(chronic_loads) / 28.0 if chronic_loads else 100.0
    acwr = round(acute_avg / (chronic_avg or 1.0), 2)
    acwr = max(0.0, min(3.0, acwr))
    
    if acwr > 1.5:
        acwr_risk = "Danger Zone"
    elif acwr >= 0.8:
        acwr_risk = "Sweet Spot"
    else:
        acwr_risk = "Under-training"

    # Calculate Recovery Score
    latest_wearable = (
        db.query(models.WearableSession)
        .filter(models.WearableSession.user_id == user_id)
        .order_by(models.WearableSession.timestamp.desc())
        .first()
    )
    
    recovery_val = 78
    if latest_wearable:
        sleep_score = latest_wearable.sleep_score or 75
        hrv_val = latest_wearable.hrv or 60
        hr_val = latest_wearable.heart_rate or 72
        
        hrv_comp = min(100.0, hrv_val * 1.3)
        hr_comp = max(0.0, min(100.0, 130.0 - hr_val))
        
        recovery_val = int(round((sleep_score * 0.40) + (hrv_comp * 0.40) + (hr_comp * 0.20)))
        recovery_val = max(10, min(100, recovery_val))

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
        trend_data=json.loads(profile.trend_data) if profile.trend_data else default_trend_data,
        capability_mark=capability_mark,
        acwr=acwr,
        acwr_risk=acwr_risk,
        recovery_score=recovery_val
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
    
    # Save user message to database
    if messages_dict:
        user_msg = messages_dict[-1]["content"]
        db_user_msg = models.TwinNote(
            user_id=user_id,
            type="chat_message",
            content=f"user||{user_msg}"
        )
        db.add(db_user_msg)
        db.commit()

    response = chat_with_twin(user_id, messages_dict, db)

    # Save twin response to database
    db_twin_msg = models.TwinNote(
        user_id=user_id,
        type="chat_message",
        content=f"twin||{response}"
    )
    db.add(db_twin_msg)
    db.commit()

    return {"response": response}

@app.get("/analytics/chat/history/{user_id}")
def get_chat_history(user_id: str, db: Session = Depends(get_db)):
    notes = (
        db.query(models.TwinNote)
        .filter(models.TwinNote.user_id == user_id, models.TwinNote.type == "chat_message")
        .order_by(models.TwinNote.timestamp.desc())
        .limit(20)
        .all()
    )
    history = []
    for n in reversed(notes):
        parts = n.content.split("||", 1)
        role = parts[0] if len(parts) > 1 else "twin"
        content = parts[1] if len(parts) > 1 else n.content
        history.append({
            "role": role,
            "content": content
        })
    return history

@app.delete("/analytics/chat/history/{user_id}")
def clear_chat_history(user_id: str, db: Session = Depends(get_db)):
    db.query(models.TwinNote).filter(
        models.TwinNote.user_id == user_id,
        models.TwinNote.type == "chat_message"
    ).delete(synchronize_session=False)
    db.commit()
    return {"status": "cleared"}


@app.post("/analytics/simulate/{user_id}")
def api_simulate_activity(user_id: str, req: SimulationRequest, db: Session = Depends(get_db)):
    result = simulate_activity(user_id, req.activity_type, req.duration_mins, req.intensity, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/reports/analyze/{user_id}")
async def analyze_medical_report(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    import json as _json
    from analytics import GROQ_API_KEY
    from groq import Groq

    # 1. Processing delay
    await asyncio.sleep(1.5)

    # 2. Detect body region from filename keywords
    filename_lower = (file.filename or "").lower()
    region_map = {
        "knee": ("left_knee", "Knee"),
        "shoulder": ("left_shoulder", "Shoulder"),
        "lumbar": ("lumbar", "Lumbar Spine"),
        "spine": ("lumbar", "Lumbar Spine"),
        "back": ("lumbar", "Lower Back"),
        "hip": ("left_hip", "Hip"),
        "ankle": ("left_ankle", "Ankle"),
        "neck": ("cervical", "Cervical Spine"),
        "cervical": ("cervical", "Cervical Spine"),
        "wrist": ("left_forearm", "Wrist"),
        "elbow": ("left_arm", "Elbow"),
        "foot": ("left_ankle", "Foot"),
        "hamstring": ("left_thigh", "Hamstring"),
        "quad": ("left_thigh", "Quadriceps"),
        "thigh": ("left_thigh", "Thigh"),
    }
    detected_zone, detected_region = next(
        ((zone, region) for keyword, (zone, region) in region_map.items() if keyword in filename_lower),
        ("lumbar", "Lower Back")  # default if no keyword found
    )

    # 3. Use Groq to generate a varied, contextual clinical finding
    diagnosis = {
        "zone": detected_zone,
        "condition": "Soft Tissue Finding",
        "severity": 45,
        "recommendation": "Follow up with a qualified physiotherapist for assessment.",
        "ai_generated": True,
        "disclaimer": "This is an AI-generated suggestion based on the filename only. It is NOT a real diagnosis."
    }

    if GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            groq_response = client.chat.completions.create(
                model="groq/compound-mini",
                messages=[{
                    "role": "user",
                    "content": (
                        f'A medical imaging report file named "{file.filename}" was uploaded. '
                        f'The detected body region is: {detected_region}. '
                        f'Generate a realistic, non-alarmist clinical finding as a JSON object with these exact keys: '
                        f'"zone" (string, one of: left_knee, right_knee, lumbar, cervical, left_shoulder, right_shoulder, left_hip, right_hip, left_ankle, right_ankle, left_thigh, right_thigh), '
                        f'"condition" (string, 3-6 words, e.g. "Grade 1 Ligament Strain"), '
                        f'"severity" (integer between 15 and 80), '
                        f'"recommendation" (string, one concise clinical action sentence). '
                        f'Return ONLY the JSON object. No explanation.'
                    )
                }],
                max_tokens=200,
                temperature=0.5
            )
            raw = groq_response.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = _json.loads(raw.strip())
            diagnosis.update({
                "zone": parsed.get("zone", detected_zone),
                "condition": parsed.get("condition", "Soft Tissue Finding"),
                "severity": int(parsed.get("severity", 45)),
                "recommendation": parsed.get("recommendation", diagnosis["recommendation"]),
            })
        except Exception as e:
            print(f"Groq medical analysis failed, using fallback: {e}")

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
        
    return [{"username": e.username, "score": e.score, "rank_change": e.rank_change, "user_id": e.user_id} for e in entries]

@app.post("/programs/generate/{user_id}")
def generate_rehab_program(user_id: str, db: Session = Depends(get_db)):
    import json as _json
    from analytics import GROQ_API_KEY
    from groq import Groq
    
    # 1. Pull latest capability profile to identify weak zones
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    
    top_zones_str = "left_knee (varus/valgus stabilization), lumbar (pelvic control)"
    if profile and profile.zone_risks:
        try:
            risks = _json.loads(profile.zone_risks)
            sorted_risks = sorted(risks.items(), key=lambda x: x[1], reverse=True)
            high_risks = [f"{z} (risk: {r}/100)" for z, r in sorted_risks if r > 30]
            if high_risks:
                top_zones_str = ", ".join(high_risks[:3])
        except Exception as e:
            print(f"Error parsing profile zone risks: {e}")

    # Fallback default 4-week stabilization program
    program = {
        "title": "4-Week Targeted Stabilization Protocol",
        "focus": f"Stabilizing high-risk areas: {top_zones_str}",
        "weeks": [
            {
                "week": 1,
                "focus": "Neuromuscular Activation",
                "tasks": [
                    {
                        "title": "Gluteus Medius Activation (Clamshells)",
                        "sets_reps": "3 sets x 15 reps",
                        "rationale": "Awakens hip abductors to control varus/valgus alignment at the knee."
                    },
                    {
                        "title": "Prone Cobra (Pelvic Floor/Back Extension)",
                        "sets_reps": "3 sets x 30s hold",
                        "rationale": "Strengthens erector spinae and multifidus to restore core stability."
                    },
                    {
                        "title": "Quad Sets (Isometric hold)",
                        "sets_reps": "3 sets x 10s hold",
                        "rationale": "Maintains baseline neuromuscular recruitment patterns of the vastus medialis."
                    }
                ]
            },
            {
                "week": 2,
                "focus": "Eccentric Strength & Alignment",
                "tasks": [
                    {
                        "title": "Slow Eccentric Step-Downs",
                        "sets_reps": "3 sets x 10 reps",
                        "rationale": "Improves deceleration control and tendon capacity of the patellar insertion."
                    },
                    {
                        "title": "Dead Bug Hold (Core Bracing)",
                        "sets_reps": "3 sets x 10 reps/side",
                        "rationale": "Addresses stability asymmetry and reduces pelvic rotation under load."
                    },
                    {
                        "title": "Banded Glute Bridges",
                        "sets_reps": "3 sets x 12 reps",
                        "rationale": "Teaches the gluteal muscles to extend the hip without lumbar compensation."
                    }
                ]
            },
            {
                "week": 3,
                "focus": "Dynamic Stability Overlay",
                "tasks": [
                    {
                        "title": "Single-Leg Balance on Foam Pad",
                        "sets_reps": "3 sets x 30s/leg",
                        "rationale": "Fires stabilizer muscles in ankles and hips to prevent joint cave."
                    },
                    {
                        "title": "Banded Lateral Monster Walks",
                        "sets_reps": "2 sets x 15 steps",
                        "rationale": "Builds endurance in lateral glutes to eliminate dynamic varus stress."
                    },
                    {
                        "title": "Bird Dog (Contralateral Extension)",
                        "sets_reps": "3 sets x 8 reps/side",
                        "rationale": "Reduces shear stress on the lumbar spine while testing rotational control."
                    }
                ]
            },
            {
                "week": 4,
                "focus": "Functional Loading Progression",
                "tasks": [
                    {
                        "title": "Tempo Goblet Squats (3-1-1)",
                        "sets_reps": "3 sets x 8 reps",
                        "rationale": "Integrates single-muscle activations into a compound functional pattern."
                    },
                    {
                        "title": "Single-Leg Romanian Deadlifts",
                        "sets_reps": "3 sets x 8 reps/leg",
                        "rationale": "Addresses bilateral hamstrings-to-quads strength imbalances."
                    },
                    {
                        "title": "Side Plank with Leg Abduction",
                        "sets_reps": "3 sets x 20s/side",
                        "rationale": "Challenges the lateral kinetic chain to maintain spinal neutrality."
                    }
                ]
            }
        ]
    }

    # Generate custom program with Groq if key is present
    if GROQ_API_KEY:
        try:
            client = Groq(api_key=GROQ_API_KEY)
            response = client.chat.completions.create(
                model="groq/compound-mini",
                messages=[{
                    "role": "user",
                    "content": (
                        f"Generate a customized 4-week physiotherapy / rehab program for a user with these high-risk areas: {top_zones_str}. "
                        f"Structure the response as a JSON object with this exact schema: \n"
                        f"{{\n"
                        f"  \"title\": \"Name of the program (e.g. Lower Limb Realignment Program)\",\n"
                        f"  \"focus\": \"Short summary of targeted corrections\",\n"
                        f"  \"weeks\": [\n"
                        f"    {{\n"
                        f"      \"week\": 1,\n"
                        f"      \"focus\": \"Week 1 focus area\",\n"
                        f"      \"tasks\": [\n"
                        f"        {{\n"
                        f"          \"title\": \"Exercise name\",\n"
                        f"          \"sets_reps\": \"Sets & reps, e.g. 3x12 reps\",\n"
                        f"          \"rationale\": \"1 sentence biomechanical explanation explaining WHY this exercise targets the weak zones\"\n"
                        f"        }}\n"
                        f"      ]\n"
                        f"    }}\n"
                        f"  ]\n"
                        f"}}\n"
                        f"Generate exactly 4 weeks, with exactly 3 tasks per week. Return ONLY the raw JSON string. No extra text."
                    )
                }],
                max_tokens=1000,
                temperature=0.4
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            parsed = _json.loads(raw.strip())
            if "title" in parsed and "weeks" in parsed:
                program = parsed
        except Exception as e:
            print(f"Groq program generation failed, using fallback: {e}")
            
    return program


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


@app.post("/pain/log/{user_id}")
def log_pain(user_id: str, req: PainLogCreate, db: Session = Depends(get_db)):
    new_log = models.PainLog(
        user_id=user_id,
        zone=req.zone,
        score=req.score
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return {"status": "success", "log_id": new_log.id}


@app.get("/pain/history/{user_id}")
def get_pain_history(user_id: str, db: Session = Depends(get_db)):
    logs = db.query(models.PainLog).filter(models.PainLog.user_id == user_id).order_by(models.PainLog.timestamp.asc()).all()
    return [{
        "timestamp": l.timestamp.isoformat(),
        "zone": l.zone,
        "score": l.score
    } for l in logs]


@app.post("/users/triage/{user_id}")
def triage_user(user_id: str, req: TriageRequest, db: Session = Depends(get_db)):
    record = models.KinesiophobiaRecord(
        user_id=user_id,
        score=req.score,
        answers_json=req.answers_json
    )
    db.add(record)
    
    # Check score and update user mode / recovery intensity configuration
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user:
        if req.score >= 25:
            user.mode = "Low-Intensity Posture & Joint Stability"
        else:
            user.mode = "Standard Athletic Recovery"
    db.commit()
    return {"status": "success", "score": req.score, "mode_assigned": user.mode if user else "None"}


@app.post("/clinic/casenotes/{user_id}")
def create_case_note(user_id: str, req: CaseNoteCreate, db: Session = Depends(get_db)):
    new_note = models.TwinNote(
        user_id=user_id,
        type="system_flag",  # 'system_flag' acts as Case Note
        content=f"Casenote: {req.note}"
    )
    db.add(new_note)
    db.commit()
    return {"status": "success"}


@app.get("/clinic/casenotes/{user_id}")
def get_case_notes(user_id: str, db: Session = Depends(get_db)):
    notes = db.query(models.TwinNote).filter(
        models.TwinNote.user_id == user_id,
        models.TwinNote.type == "system_flag"
    ).order_by(models.TwinNote.timestamp.desc()).all()
    return [{
        "timestamp": n.timestamp.isoformat(),
        "note": n.content.replace("Casenote: ", "")
    } for n in notes]


@app.get("/analytics/report/pdf/{user_id}")
def get_printable_report(user_id: str, db: Session = Depends(get_db)):
    from fastapi.responses import HTMLResponse
    
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    sessions = db.query(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.VisionSession.timestamp.desc()).all()
    pain_logs = db.query(models.PainLog).filter(models.PainLog.user_id == user_id).order_by(models.PainLog.timestamp.desc()).limit(10).all()
    
    mobility = profile.mobility if profile else 50
    stability = profile.stability if profile else 50
    quality = profile.movement_quality if profile else 50
    cardio = profile.cardiovascular_efficiency if profile else 50
    recovery = profile.recovery if profile else 50
    reserve = profile.capability_reserve if profile else 50
    
    mark = 500
    if profile:
        mark = int(round((mobility*0.2 + stability*0.25 + quality*0.2 + cardio*0.2 + recovery*0.15)*10))
        
    sessions_rows = ""
    for s in sessions:
        sessions_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);">{s.timestamp.strftime('%Y-%m-%d %H:%M')}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 500;">{s.task_type}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-family: monospace;">{s.rom or 0}&deg;</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-family: monospace;">{round((s.symmetry or 0)*100, 1)}%</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-family: monospace;">{round((s.stability or 0)*100, 1)}%</td>
        </tr>
        """
        
    pain_rows = ""
    for p in pain_logs:
        pain_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);">{p.timestamp.strftime('%Y-%m-%d')}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 500;">{p.zone.replace('_', ' ').title()}</td>
            <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: bold; color: {'#ef4444' if p.score > 6 else '#f59e0b'}">{p.score}/10</td>
        </tr>
        """
        
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>PhysioTwin - Biomechanical Capability Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', system-ui, sans-serif;
                background-color: #030712;
                color: #f3f4f6;
                margin: 40px;
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 24px;
                margin-bottom: 40px;
            }}
            .logo-area {{ display: flex; align-items: center; gap: 8px; }}
            .logo-icon {{
                width: 32px;
                height: 32px;
                background-color: #2563eb;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                color: white;
                font-size: 14px;
            }}
            .logo-text {{ font-size: 20px; font-weight: 800; tracking-tight; }}
            .title {{ font-size: 32px; font-weight: 900; letter-spacing: -0.025em; text-align: center; margin-bottom: 40px; color: white; }}
            .section {{
                background-color: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 30px;
            }}
            .section-title {{
                font-size: 18px;
                font-weight: 800;
                letter-spacing: -0.015em;
                color: #3b82f6;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                padding-bottom: 10px;
                margin-bottom: 20px;
            }}
            .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }}
            .stat-card {{
                background-color: rgba(255,255,255,0.01);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 16px;
                text-align: center;
            }}
            .stat-label {{ font-size: 11px; font-weight: 700; color: #9ca3af; uppercase; letter-spacing: 0.05em; }}
            .stat-val {{ font-size: 28px; font-weight: 800; color: #3b82f6; margin-top: 6px; font-family: monospace; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            th {{ text-align: left; padding: 10px; background-color: rgba(255,255,255,0.03); color: #9ca3af; font-size: 11px; font-weight: 700; uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.1); }}
            @media print {{
                body {{
                    background-color: white;
                    color: black;
                    margin: 0;
                    padding: 20px;
                }}
                .title, .section-title {{ color: black !important; }}
                .logo-icon {{ background-color: black !important; }}
                .stat-val {{ color: black !important; }}
                .section {{
                    background: none !important;
                    border: 1px solid #ddd !important;
                    box-shadow: none !important;
                }}
                .stat-card {{
                    background: none !important;
                    border: 1px solid #ddd !important;
                }}
                th {{
                    background: #f3f4f6 !important;
                    color: black !important;
                    border-bottom: 1px solid #ccc !important;
                }}
                td {{ border-bottom: 1px solid #eee !important; }}
                .no-print {{ display: none !important; }}
            }}
        </style>
    </head>
    <body>
        <div class="no-print" style="background: rgba(37,99,235,0.1); padding: 16px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.2); margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 500; color: #93c5fd;">Biomechanical PDF Report Generator. Print styling overrides apply.</span>
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; transition: background 0.2s;">Print / Save PDF</button>
        </div>
        
        <div class="header">
            <div class="logo-area">
                <div class="logo-icon">PT</div>
                <div class="logo-text">PhysioTwin</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #9ca3af; line-height: 1.4;">
                User ID: {user_id}<br/>
                Report Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
            </div>
        </div>
        
        <div class="title">Clinical Diagnostic &amp; Biomechanical Report</div>
        
        <div class="section">
            <div class="section-title">1. Biomechanical Base Scores</div>
            <div style="text-align: center; margin-bottom: 24px; font-size: 15px; color: #9ca3af;">
                Total Physical Capability Mark: <strong style="font-size: 26px; color: #3b82f6; font-family: monospace; font-weight: 900; margin-left: 6px;">{mark}</strong> / 1000
            </div>
            <div class="grid">
                <div class="stat-card">
                    <div class="stat-label">Mobility</div>
                    <div class="stat-val">{mobility}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Stability</div>
                    <div class="stat-val">{stability}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Movement Quality</div>
                    <div class="stat-val">{quality}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Cardiovascular</div>
                    <div class="stat-val">{cardio}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Recovery Index</div>
                    <div class="stat-val">{recovery}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Capability Reserve</div>
                    <div class="stat-val">{reserve}%</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">2. Markerless Kinematic Capture History</div>
            <table>
                <thead>
                    <tr>
                        <th>Date / Time</th>
                        <th>Movement Task</th>
                        <th>Range of Motion</th>
                        <th>Symmetry</th>
                        <th>Stability</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions_rows if sessions_rows else "<tr><td colspan='5' style='text-align:center; padding: 20px; color: #6b7280;'>No diagnostic captures recorded.</td></tr>"}
                </tbody>
            </table>
        </div>

        <div class="section" style="page-break-before: always;">
            <div class="section-title">3. Subjective Pain logs</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Body Region</th>
                        <th>Subjective Intensity</th>
                    </tr>
                </thead>
                <tbody>
                    {pain_rows if pain_rows else "<tr><td colspan='3' style='text-align:center; padding: 20px; color: #6b7280;'>No pain reports logged.</td></tr>"}
                </tbody>
            </table>
        </div>
        
        <div class="section" style="margin-top: 50px; background: none; border: none; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
            <div style="font-size: 10px; color: #6b7280; text-align: center; line-height: 1.4;">
                Disclaimer: This report is automatically generated using computer vision biomechanical estimation. It should be used to augment, not replace, clinical evaluation by a licensed physical therapist or orthopedic specialist.
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


# ── Feature 2: Analytics Summary ─────────────────────────────────────────────

@app.get("/analytics/summary/{user_id}")
def get_analytics_summary(user_id: str, db: Session = Depends(get_db)):
    """Return live analytics data: ROM trend, capability trend, pain overlay, zone heatmap."""
    vision_sessions = db.query(models.VisionSession)\
        .filter(models.VisionSession.user_id == user_id)\
        .order_by(models.VisionSession.timestamp.asc())\
        .limit(12).all()

    rom_trend = [{
        "date": vs.timestamp.strftime("%b %d"),
        "rom": round(vs.rom or 0, 1),
        "symmetry": round(vs.symmetry or 0, 1),
        "stability": round(vs.stability or 0, 1),
        "task": vs.task_type or "general",
    } for vs in vision_sessions]

    cap_profiles = db.query(models.CapabilityProfile)\
        .filter(models.CapabilityProfile.user_id == user_id)\
        .order_by(models.CapabilityProfile.timestamp.asc())\
        .limit(8).all()

    capability_trend = [{
        "date": cp.timestamp.strftime("%b %d"),
        "mobility": round(cp.mobility or 0, 1),
        "stability": round(cp.stability or 0, 1),
        "recovery": round(cp.recovery or 0, 1),
        "quality": round(cp.movement_quality or 0, 1),
    } for cp in cap_profiles]

    pain_logs = db.query(models.PainLog)\
        .filter(models.PainLog.user_id == user_id)\
        .order_by(models.PainLog.timestamp.asc())\
        .limit(10).all()

    pain_trend = [{
        "date": pl.timestamp.strftime("%b %d"),
        "zone": pl.zone,
        "score": pl.score,
    } for pl in pain_logs]

    zone_counts: dict = {}
    for vs in vision_sessions:
        t = vs.task_type or "general"
        zone_counts[t] = zone_counts.get(t, 0) + 1
    zone_heatmap = [{"zone": k, "sessions": v} for k, v in zone_counts.items()]

    csv_rows = [{
        "date": vs.timestamp.isoformat(),
        "task": vs.task_type,
        "rom": vs.rom,
        "symmetry": vs.symmetry,
        "stability": vs.stability,
    } for vs in vision_sessions]

    return {
        "rom_trend": rom_trend,
        "capability_trend": capability_trend,
        "pain_trend": pain_trend,
        "zone_heatmap": zone_heatmap,
        "csv_rows": csv_rows,
    }


# ── Feature 4: CSV Wearable Import ────────────────────────────────────────────
import csv as _csv
import io as _io

@app.post("/wearable/import-csv/{user_id}")
async def import_wearable_csv(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Parse and import a CSV file exported from Garmin, Fitbit, or Apple Health."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    contents = await file.read()
    text = contents.decode("utf-8", errors="ignore")
    reader = _csv.DictReader(_io.StringIO(text))
    headers = [h.strip().lower() for h in (reader.fieldnames or [])]

    source = "generic"
    if any("heart rate" in h for h in headers) and any("hrv" in h for h in headers):
        source = "garmin"
    elif any("datetime" in h for h in headers) and any("value" in h for h in headers):
        source = "fitbit"
    elif any("source name" in h for h in headers):
        source = "apple_health"

    imported = 0
    skipped = 0
    for row in reader:
        keys = {k.strip().lower(): v.strip() for k, v in row.items()}
        date_str = keys.get("date") or keys.get("datetime") or keys.get("starttime") or ""
        try:
            ts = datetime.datetime.fromisoformat(date_str.replace("Z", ""))
        except Exception:
            try:
                ts = datetime.datetime.strptime(date_str[:10], "%Y-%m-%d")
            except Exception:
                skipped += 1
                continue

        existing = db.query(models.WearableSession)\
            .filter(models.WearableSession.user_id == user_id,
                    models.WearableSession.timestamp == ts).first()
        if existing:
            skipped += 1
            continue

        def _f(k):
            try: return float(keys.get(k) or 0) or None
            except: return None
        def _i(k):
            try: return int(float(keys.get(k) or 0)) or None
            except: return None

        session = models.WearableSession(
            user_id=user_id, timestamp=ts, source=source,
            heart_rate=_f("heart rate") or _f("restingheartrate") or _f("avg heart rate"),
            hrv=_f("hrv") or _f("heart rate variability"),
            spo2=_f("spo2") or _f("blood oxygen"),
            steps=_i("steps") or _i("total steps"),
            sleep_hours=_f("sleep") or _f("sleep hours"),
            sleep_score=_i("sleep score") or _i("sleep quality"),
            calories_burned=_i("calories") or _i("active calories"),
            active_minutes=_i("active minutes"),
        )
        db.add(session)
        imported += 1

    db.commit()
    return {"status": "success", "imported": imported, "skipped": skipped, "source": source}


# ── Feature 8: Injury Risk Prediction ─────────────────────────────────────────
from analytics import compute_injury_risk

@app.get("/analytics/injury-risk/{user_id}")
def get_injury_risk(user_id: str, db: Session = Depends(get_db)):
    """Compute multi-factor injury risk score for the next 7 days."""
    return compute_injury_risk(user_id, db)


# ── Feature 9: Clinic Roster ───────────────────────────────────────────────────
ADMIN_KEY = "physiotwin-admin-2026"

@app.get("/clinic/roster")
def get_clinic_roster(admin_key: str = "", db: Session = Depends(get_db)):
    """Return summary of all patients for the therapist roster view."""
    if admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin key required")

    users = db.query(models.User).all()
    roster = []
    for u in users:
        cp = db.query(models.CapabilityProfile)\
            .filter(models.CapabilityProfile.user_id == u.user_id)\
            .order_by(models.CapabilityProfile.timestamp.desc()).first()

        now = datetime.datetime.utcnow()
        acute_sessions = db.query(models.VisionSession)\
            .filter(models.VisionSession.user_id == u.user_id,
                    models.VisionSession.timestamp >= now - datetime.timedelta(days=7)).all()
        chronic_sessions = db.query(models.VisionSession)\
            .filter(models.VisionSession.user_id == u.user_id,
                    models.VisionSession.timestamp >= now - datetime.timedelta(days=28)).all()
        acute_load = sum(s.rom or 0 for s in acute_sessions) / 7.0
        chronic_load = sum(s.rom or 0 for s in chronic_sessions) / 28.0
        acwr = round(acute_load / chronic_load, 2) if chronic_load > 0 else 0.0

        recent_pain = db.query(models.PainLog)\
            .filter(models.PainLog.user_id == u.user_id,
                    models.PainLog.timestamp >= now - datetime.timedelta(days=7)).all()
        pain_max = max((p.score for p in recent_pain), default=0)

        last_vs = db.query(models.VisionSession)\
            .filter(models.VisionSession.user_id == u.user_id)\
            .order_by(models.VisionSession.timestamp.desc()).first()

        risk_data = compute_injury_risk(u.user_id, db)

        roster.append({
            "user_id": u.user_id,
            "email": u.email,
            "mode": u.mode,
            "recovery_score": round(cp.recovery, 1) if cp else None,
            "latest_acwr": acwr,
            "pain_max": pain_max,
            "risk_level": risk_data.get("risk_level", "Unknown"),
            "risk_score": risk_data.get("risk_score", 0),
            "last_session": last_vs.timestamp.isoformat() if last_vs else None,
        })

    return roster


@app.get("/clinic/patient/{user_id}")
def get_patient_summary(user_id: str, admin_key: str = "", db: Session = Depends(get_db)):
    """Full patient detail for drill-down from the clinic roster."""
    if admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Admin key required")

    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cap_profiles = db.query(models.CapabilityProfile)\
        .filter(models.CapabilityProfile.user_id == user_id)\
        .order_by(models.CapabilityProfile.timestamp.desc()).limit(5).all()

    pain_logs = db.query(models.PainLog)\
        .filter(models.PainLog.user_id == user_id)\
        .order_by(models.PainLog.timestamp.desc()).limit(10).all()

    notes = db.query(models.TwinNote)\
        .filter(models.TwinNote.user_id == user_id,
                models.TwinNote.type == "system_flag")\
        .order_by(models.TwinNote.timestamp.desc()).limit(5).all()

    return {
        "user": {"user_id": user.user_id, "email": user.email, "mode": user.mode, "age": user.age},
        "capability_history": [
            {"date": cp.timestamp.isoformat(), "mobility": cp.mobility,
             "stability": cp.stability, "recovery": cp.recovery} for cp in cap_profiles
        ],
        "pain_logs": [
            {"date": pl.timestamp.isoformat(), "zone": pl.zone, "score": pl.score} for pl in pain_logs
        ],
        "case_notes": [
            {"date": n.timestamp.isoformat(), "note": n.content.replace("Casenote: ", "")} for n in notes
        ],
        "injury_risk": compute_injury_risk(user_id, db),
    }


# ── Serve Built Frontend SPA Static Files (Production Render Deployment) ─────
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build not found")


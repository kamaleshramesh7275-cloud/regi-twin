from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
import uuid

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    mode = Column(String, default="General Human")
    goals = Column(String, nullable=True) # Stored as comma separated string or JSON array string
    consent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WearableSession(Base):
    """Vitals synced from consumer smartwatches/fitness bands via software APIs
    (Google Fit, Garmin Connect, Fitbit, Apple Health, etc.)
    No dedicated hardware — all data arrives through platform APIs.
    """
    __tablename__ = "wearable_sessions"

    session_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    # Source platform: 'google_fit' | 'garmin' | 'fitbit' | 'apple_health' | 'samsung_health'
    source = Column(String, default="google_fit")
    heart_rate = Column(Float, nullable=True)       # BPM (resting)
    hrv = Column(Float, nullable=True)              # Heart rate variability (ms)
    spo2 = Column(Float, nullable=True)             # Blood oxygen %
    steps = Column(Integer, nullable=True)          # Daily steps
    sleep_hours = Column(Float, nullable=True)      # Total sleep in hours
    sleep_score = Column(Integer, nullable=True)    # Platform sleep quality score 0-100
    readiness_score = Column(Integer, nullable=True) # Platform readiness/recovery score 0-100
    calories_burned = Column(Integer, nullable=True)
    active_minutes = Column(Integer, nullable=True)
    raw_data = Column(Text, nullable=True)          # Full JSON blob from platform API

class VisionSession(Base):
    __tablename__ = "vision_sessions"

    session_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    wearable_session_id = Column(String, ForeignKey("wearable_sessions.session_id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    task_type = Column(String)
    pose_landmarks_json = Column(Text)
    joint_angles_json = Column(Text)
    rom = Column(Float)
    movement_speed = Column(Float)
    symmetry = Column(Float)
    stability = Column(Float)
    camera_quality = Column(String)
    annotated_image_url = Column(Text, nullable=True)

class KinematicsData(Base):
    __tablename__ = "kinematics_data"

    id = Column(String, primary_key=True, default=generate_uuid)
    vision_session_id = Column(String, ForeignKey("vision_sessions.session_id"))
    timestamp_ms = Column(Integer) # offset from start of session
    joint_angles_json = Column(Text) # JSON mapping of joint angles for this frame
    stress_levels_json = Column(Text) # JSON mapping of simulated muscle stress

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    vision_session_id = Column(String, ForeignKey("vision_sessions.session_id"))
    timestamp_ms = Column(Integer)
    type = Column(String) # e.g. "knee_valgus", "asymmetry"
    description = Column(String)

class CapabilityProfile(Base):

    __tablename__ = "capability_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    mobility = Column(Float)
    stability = Column(Float)
    movement_quality = Column(Float)
    cardiovascular_efficiency = Column(Float)
    recovery = Column(Float)
    capability_reserve = Column(Float)
    confidence = Column(String) # 'Low' | 'Medium' | 'High'
    zone_risks = Column(Text, nullable=True) # JSON string mapping zone_id to risk 0-100
    trend_data = Column(Text, nullable=True) # JSON string of historical trend data


class BaselineHistory(Base):
    __tablename__ = "baseline_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    task_type = Column(String)
    metric_name = Column(String)
    mean = Column(Float)
    std = Column(Float)
    sample_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChangePoint(Base):
    __tablename__ = "change_points"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    metric_name = Column(String)
    session_id = Column(String)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    classification = Column(String) # 'temporary' | 'persistent'
    magnitude = Column(Float)

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    username = Column(String)
    score = Column(Integer)
    rank_change = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExternalAppSession(Base):
    __tablename__ = "external_app_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    app_name = Column(String) # 'Hevy', 'HealthifyMe'
    session_data = Column(Text) # JSON string with the workout/nutrition details
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class TwinNote(Base):
    __tablename__ = "twin_notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    type = Column(String) # 'weekly_letter' | 'user_note' | 'system_flag' | 'chat_message'
    content = Column(Text)

class PainLog(Base):
    """Daily subjective pain intensity per joint zone (1-10 scale)"""
    __tablename__ = "pain_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    zone = Column(String)  # 'left_knee', 'lumbar', etc.
    score = Column(Integer)  # 1 to 10

class KinesiophobiaRecord(Base):
    """TSK-11 (Tampa Scale for Kinesiophobia) survey results for re-injury fear triage"""
    __tablename__ = "kinesiophobia_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    score = Column(Integer)  # 11 to 44
    answers_json = Column(Text)  # Store JSON array of 11 questions


class Medication(Base):
    """User-managed medication and supplement adherence tracker."""
    __tablename__ = "medications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    name = Column(String)                   # e.g. "Ibuprofen (NSAID)"
    dosage = Column(String)                 # e.g. "400mg"
    time_of_day = Column(String)            # e.g. "Morning w/ food"
    type = Column(String)                   # 'medication' | 'supplement'
    taken = Column(Boolean, default=False)  # toggled each day
    last_taken_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CommunityPost(Base):
    """User-generated post in the community recovery feed."""
    __tablename__ = "community_posts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    author_name = Column(String)            # Display name for the post
    group_name = Column(String)             # e.g. "ACL Reconstruction Support"
    title = Column(String)
    content = Column(Text)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WorkoutLog(Base):
    """Manually logged workout session (used when no Hevy/wearable sync is available)."""
    __tablename__ = "workout_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    name = Column(String)                   # e.g. "Leg Day"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    duration_min = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    exercises_json = Column(Text, nullable=True)  # JSON array of {name, sets, reps, weight_kg}
    affected_zones_json = Column(Text, nullable=True)  # JSON array of zone IDs
    volume_kg = Column(Float, nullable=True)
    load_level = Column(String, nullable=True)  # 'Low' | 'Medium' | 'High'


class NutritionLog(Base):
    """Manually logged daily nutrition entry."""
    __tablename__ = "nutrition_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    meal_name = Column(String, nullable=True)   # e.g. "Breakfast"
    items = Column(Text, nullable=True)          # Free text description
    calories = Column(Integer, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)

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

class SensorSession(Base):
    __tablename__ = "sensor_sessions"

    session_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    heart_rate = Column(Float)
    spo2 = Column(Float)
    temperature = Column(Float)
    accel_x = Column(Float)
    accel_y = Column(Float)
    accel_z = Column(Float)
    source = Column(String, default="synthetic") # 'synthetic' | 'esp32'
    sensor_quality = Column(String, default="High")

class VisionSession(Base):
    __tablename__ = "vision_sessions"

    session_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
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

class FusedSession(Base):
    __tablename__ = "fused_sessions"

    session_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    sensor_session_id = Column(String, ForeignKey("sensor_sessions.session_id"))
    vision_session_id = Column(String, ForeignKey("vision_sessions.session_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    fused_confidence = Column(String) # 'Low' | 'Medium' | 'High'

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
    type = Column(String) # 'weekly_letter' | 'user_note' | 'system_flag'
    content = Column(Text)

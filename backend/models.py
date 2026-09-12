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
    zone_confidence_json = Column(Text, nullable=True) # JSON string mapping zone_id to 'high'|'medium'|'low'|'none'
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
    app_name = Column(String) # 'Native Workout', 'Native Nutrition'
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

# ==============================================================================
# PHASE 1 & 2: NATIVE EXERCISE & WORKOUT TRACKING MODELS
# ==============================================================================

class Exercise(Base):
    """In-app exercise reference database."""
    __tablename__ = "exercises"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    category = Column(String, default="General", index=True)
    primary_muscle = Column(String, default="General", index=True)
    secondary_muscles = Column(String, nullable=True)
    muscle_group = Column(String, index=True, default="full_body")
    equipment = Column(String, index=True, default="bodyweight")
    difficulty = Column(String, default="Intermediate")
    instructions = Column(Text, nullable=True)
    tips = Column(Text, nullable=True)
    icon_svg = Column(String, nullable=True)
    image_path = Column(String, nullable=True)
    gif_url = Column(String, nullable=True)
    gifUrl = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Workout(Base):
    """Native logged workout session with optional cover image."""
    __tablename__ = "workouts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    name = Column(String, default="Workout Session")
    date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    duration_seconds = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    template_id = Column(String, nullable=True)
    is_completed = Column(Integer, default=1)
    cover_image_path = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    total_volume_kg = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")

class WorkoutExercise(Base):
    """An exercise performed within a workout session."""
    __tablename__ = "workout_exercises"

    id = Column(String, primary_key=True, default=generate_uuid)
    workout_id = Column(String, ForeignKey("workouts.id"), index=True)
    exercise_id = Column(String, ForeignKey("exercises.id"), nullable=True)
    exercise_name = Column(String, nullable=True)
    muscle_group = Column(String, default="full_body")
    order = Column(Integer, default=0)
    order_index = Column(Integer, default=0)

    workout = relationship("Workout", back_populates="exercises")
    sets = relationship("SetLog", back_populates="workout_exercise", cascade="all, delete-orphan")

class SetLog(Base):
    """Individual set logged with reps, weight, RPE and PR tracking."""
    __tablename__ = "set_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    workout_exercise_id = Column(String, ForeignKey("workout_exercises.id"), index=True)
    set_number = Column(Integer, default=1)
    set_type = Column(String, default="normal")
    reps = Column(Integer, default=10)
    weight = Column(Float, default=0.0)
    weight_kg = Column(Float, default=0.0)
    rpe = Column(Float, nullable=True)
    completed = Column(Integer, default=1)
    is_pr = Column(Integer, default=0)
    estimated_1rm = Column(Float, nullable=True)

    workout_exercise = relationship("WorkoutExercise", back_populates="sets")

class WorkoutTemplate(Base):
    """Saved workout routine / template for quick reuse."""
    __tablename__ = "workout_templates"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    name = Column(String)
    description = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    exercises_json = Column(Text, default="[]")
    is_public = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PersonalRecord(Base):
    """Tracked personal bests per user per exercise."""
    __tablename__ = "personal_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    exercise_id = Column(String, index=True)
    exercise_name = Column(String, nullable=True)
    max_weight = Column(Float, default=0.0)
    max_reps_at_weight = Column(Integer, default=0)
    max_estimated_1rm = Column(Float, default=0.0)
    estimated_1rm_kg = Column(Float, default=0.0)
    achieved_weight_kg = Column(Float, default=0.0)
    achieved_reps = Column(Integer, default=0)
    achieved_date = Column(DateTime, default=datetime.datetime.utcnow)
    achieved_at = Column(DateTime, default=datetime.datetime.utcnow)

# ==============================================================================
# PHASE 4: NATIVE FOOD DATABASE & NUTRITION TRACKING MODELS
# ==============================================================================

class Food(Base):
    """Local reference food database (macros & key micronutrients)."""
    __tablename__ = "foods"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    category = Column(String, default="General")
    serving_unit = Column(String, default="100g")
    serving_size_g = Column(Float, default=100.0)
    calories = Column(Float, default=0.0)
    calories_per_100g = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    protein_g_100g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    carbs_g_100g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    fat_g_100g = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    fiber_g_100g = Column(Float, default=0.0)
    sodium_mg = Column(Float, default=0.0)
    
    # Key Micronutrients
    iron_mg = Column(Float, default=0.0)
    calcium_mg = Column(Float, default=0.0)
    vitamin_d_iu = Column(Float, default=0.0)
    b12_mcg = Column(Float, default=0.0)
    magnesium_mg = Column(Float, default=0.0)
    potassium_mg = Column(Float, default=0.0)
    zinc_mg = Column(Float, default=0.0)
    micros_json = Column(Text, nullable=True)

class NutritionLog(Base):
    """Logged meal entry with attached meal photo and micronutrient breakdown."""
    __tablename__ = "nutrition_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    food_id = Column(String, nullable=True)
    meal_name = Column(String, default="Meal")
    meal_type = Column(String, default="Lunch")
    food_name = Column(String, nullable=True)
    items_json = Column(Text, nullable=True)
    quantity = Column(Float, default=1.0)
    serving_unit = Column(String, default="serving")
    calories = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    sodium_mg = Column(Float, default=0.0)
    micros_json = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    date = Column(String, index=True, nullable=True)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class WaterLog(Base):
    """Hydration logging."""
    __tablename__ = "water_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    amount_ml = Column(Integer, default=250)
    date = Column(String, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class BodyWeightLog(Base):
    """Body weight tracker."""
    __tablename__ = "body_weight_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    weight_kg = Column(Float)
    notes = Column(Text, nullable=True)
    date = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class ReadinessSurvey(Base):
    """Daily stress-recovery and psychological readiness survey."""
    __tablename__ = "readiness_surveys"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Stress & Recovery (RESTQ-Sport indicators, 0-100)
    general_stress = Column(Integer)
    emotional_stress = Column(Integer)
    social_stress = Column(Integer)
    fatigue = Column(Integer)
    energy_deficit = Column(Integer)
    physical_complaints = Column(Integer)
    success = Column(Integer)
    social_recovery = Column(Integer)
    physical_recovery = Column(Integer)
    well_being = Column(Integer)
    
    # Psychological indices
    kinesiophobia_score = Column(Integer)     # Tampa Scale (11 to 44)
    sport_confidence_score = Column(Integer)  # ACL-RSI (0 to 100)


# ==============================================================================
# CLINICAL OCR, DIGITAL TWIN INGESTION & PREDICTIVE TREND MODELS
# ==============================================================================

class ClinicalReportDocument(Base):
    """Uploaded clinical / laboratory report document (PDF or image)."""
    __tablename__ = "clinical_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    filename = Column(String, nullable=True)
    original_filename = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    stored_filepath = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    file_type = Column(String, default="pdf")  # 'pdf' | 'image'
    file_size_bytes = Column(Integer, default=0)
    report_type = Column(String, default="lab_panel")
    lab_name = Column(String, nullable=True)
    report_date = Column(DateTime, nullable=True)
    page_count = Column(Integer, default=1)
    raw_ocr_json = Column(Text, nullable=True)  # JSON array of raw text lines, bboxes, confidences
    extracted_data_json = Column(Text, nullable=True)  # JSON array of pending parsed lab metrics
    confirmed_data_json = Column(Text, nullable=True)  # JSON array of confirmed lab metrics
    status = Column(String, default="pending_review")  # 'pending_review' | 'confirmed' | 'rejected'
    total_metrics_found = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    review_notes = Column(Text, nullable=True)


class ClinicalMetricRecord(Base):
    """Confirmed clinical metric reading ingested into the Digital Twin with provenance."""
    __tablename__ = "clinical_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("clinical_reports.id"), nullable=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    metric_key = Column(String, index=True)  # canonical key e.g. 'hemoglobin', 'fasting_blood_glucose'
    canonical_name = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    value = Column(Float)
    unit = Column(String)
    ref_low = Column(Float, nullable=True)
    ref_high = Column(Float, nullable=True)
    reference_range = Column(String, nullable=True)
    status = Column(String, default="normal")  # 'normal' | 'high' | 'low'
    confidence_tier = Column(String, default="high")  # 'high' | 'medium' | 'low'
    confidence_score = Column(Float, default=1.0)
    ocr_confidence = Column(Float, nullable=True)
    source = Column(String, default="clinicReportOCR")  # 'clinicReportOCR' | 'manual'
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    recorded_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    is_out_of_range = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ClinicalPredictionAlert(Base):
    """Informational predictive trend notification with non-diagnostic medical disclaimer."""
    __tablename__ = "clinical_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    metric_key = Column(String, index=True)
    canonical_name = Column(String, nullable=True)
    metric_name = Column(String, nullable=True)
    trigger_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    predicted_value = Column(Float, nullable=True)
    expected_range_min = Column(Float, nullable=True)
    expected_range_max = Column(Float, nullable=True)
    alert_type = Column(String, default="trend_anomaly")  # 'trend_anomaly' | 'out_of_reference'
    severity = Column(String, default="info")  # 'info' | 'caution'
    title = Column(String)
    message = Column(String)
    suggested_action = Column(String, nullable=True)
    disclaimer = Column(
        String, 
        default="This is a pattern-based observation, not a medical diagnosis. Please discuss this result with a healthcare professional."
    )
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class InjuryHistoryRecord(Base):
    """Structured medical injury history extracted from OCR clinical documents or logged manually."""
    __tablename__ = "injury_history_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), index=True)
    report_id = Column(String, ForeignKey("clinical_reports.id"), nullable=True, index=True)
    zone = Column(String, index=True)  # 'forearm', 'lumbar', 'left_knee', 'right_shoulder', etc.
    side = Column(String, default="left")  # 'left' | 'right' | 'bilateral' | 'central'
    injury_name = Column(String)  # e.g. "Forearm Flexor Tendonitis / Sprain"
    severity = Column(String, default="moderate")  # 'mild' | 'moderate' | 'severe' | 'critical'
    occurred_at = Column(DateTime, default=datetime.datetime.utcnow)
    months_ago = Column(Float, default=2.0)
    notes = Column(Text, nullable=True)
    source = Column(String, default="ocr_extracted")  # 'ocr_extracted' | 'manual_user' | 'clinician_note'
    status = Column(String, default="vulnerable")  # 'vulnerable' | 'recovering' | 'resolved'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)



# ==============================================================================
# ROLE MODEL: USER ROLES & CLINICIAN ASSIGNMENTS
# ==============================================================================

class UserRole(Base):
    """
    Persists role assignments for audit trail and quick lookup.
    The authoritative role is always the Firebase custom claim — this table
    is a mirror/cache and used for admin UI listing only.
    Roles: 'client' | 'clinician' | 'superadmin'
    """
    __tablename__ = "user_roles"

    uid = Column(String, primary_key=True)   # Firebase UID
    email = Column(String, nullable=True, index=True)
    display_name = Column(String, nullable=True)
    role = Column(String, default="client", index=True)
    set_by_uid = Column(String, nullable=True)  # UID of the superadmin who set this
    set_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ClinicianAssignment(Base):
    """
    Maps a clinician's Firebase UID to a JSON list of client UIDs they are
    authorised to view. Maintained by superadmins via the /admin panel.
    """
    __tablename__ = "clinician_assignments"

    clinician_uid = Column(String, primary_key=True)  # Firebase UID of the clinician
    clinician_email = Column(String, nullable=True)
    client_uids_json = Column(Text, default="[]")     # JSON array of client Firebase UIDs
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    updated_by_uid = Column(String, nullable=True)    # UID of the superadmin who last edited


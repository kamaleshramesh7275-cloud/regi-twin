import datetime
from database import SessionLocal
import models

def seed():
    db = SessionLocal()
    # 1. Create user
    uid = "test-user"
    user = db.query(models.User).filter(models.User.user_id == uid).first()
    if not user:
        user = models.User(user_id=uid, email="athlete@physiotwin.com", mode="Athlete", age=28, height=180, weight=75, consent=True)
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Add Capability Profiles over time
    db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == uid).delete()
    base_time = datetime.datetime.utcnow() - datetime.timedelta(days=20)
    for i in range(5):
        cp = models.CapabilityProfile(
            user_id=uid,
            timestamp=base_time + datetime.timedelta(days=i*4),
            mobility=65 + i * 4,
            stability=60 + i * 3,
            movement_quality=70 + i * 4,
            cardiovascular_efficiency=55 + i * 5,
            recovery=70 + (i % 2) * 10,
            capability_reserve=60 + i * 3,
            confidence="High"
        )
        db.add(cp)

    # 3. Add Vision Sessions
    db.query(models.VisionSession).filter(models.VisionSession.user_id == uid).delete()
    for i in range(10):
        vs = models.VisionSession(
            user_id=uid,
            timestamp=base_time + datetime.timedelta(days=i*2),
            task_type="knee_flexion" if i % 2 == 0 else "hip_stability",
            pose_landmarks_json="{}",
            joint_angles_json="{}",
            rom=80 + i * 5,
            movement_speed=1.0 + i * 0.1,
            symmetry=70 + i * 2.5,
            stability=75 + i * 2,
            camera_quality="High"
        )
        db.add(vs)

    # 4. Add Pain Logs
    db.query(models.PainLog).filter(models.PainLog.user_id == uid).delete()
    for i in range(6):
        pl = models.PainLog(
            user_id=uid,
            timestamp=base_time + datetime.timedelta(days=i*3),
            zone="left_knee",
            score=8 - i
        )
        db.add(pl)

    # 5. Add Wearable Sessions
    db.query(models.WearableSession).filter(models.WearableSession.user_id == uid).delete()
    for i in range(7):
        ws = models.WearableSession(
            user_id=uid,
            timestamp=base_time + datetime.timedelta(days=i*3),
            source="garmin",
            heart_rate=65 - i,
            hrv=45 + i * 4,
            spo2=98.0,
            steps=8000 + i * 500,
            sleep_hours=6.5 + i * 0.25,
            sleep_score=65 + i * 3,
            calories_burned=2200 + i * 100,
            active_minutes=30 + i * 10
        )
        db.add(ws)

    # 6. Add a clinical case note
    db.query(models.TwinNote).filter(models.TwinNote.user_id == uid, models.TwinNote.type == "system_flag").delete()
    note = models.TwinNote(
        user_id=uid,
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        type="system_flag",
        content="Casenote: Left knee patellar tendinopathy. Gradual loading program initiated."
    )
    db.add(note)

    db.commit()
    db.close()
    print("Database successfully seeded for test-user!")

if __name__ == "__main__":
    seed()

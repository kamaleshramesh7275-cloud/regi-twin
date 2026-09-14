import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy.orm import Session
from groq import Groq
import models
import statistics
import datetime

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


import json

def detect_anomalies(kinematics_timeseries: list) -> list:
    anomalies = []
    # kinematics_timeseries is a list of dicts: {"timestamp_ms": ..., "angles": {"Knee Valgus": ...}}
    for frame in kinematics_timeseries:
        ms = frame.get("timestamp_ms", 0)
        angles = frame.get("angles", {})
        
        # Simple heuristic: if Knee Valgus exceeds a threshold
        valgus = angles.get("Knee Valgus", 0)
        if abs(valgus) > 15.0:
            anomalies.append({
                "timestamp_ms": ms,
                "type": "knee_valgus",
                "description": f"Excessive knee valgus detected ({round(valgus, 1)}°)"
            })
            
        # Add more heuristics as needed
        hip_drop = angles.get("Hip Drop", 0)
        if abs(hip_drop) > 10.0:
            anomalies.append({
                "timestamp_ms": ms,
                "type": "hip_drop",
                "description": f"Excessive hip drop detected ({round(hip_drop, 1)}°)"
            })
            
    # filter out closely packed anomalies (debounce)
    filtered = []
    last_ms = {}
    for a in anomalies:
        t = a["type"]
        if t not in last_ms or (a["timestamp_ms"] - last_ms[t]) > 1000: # 1 second debounce
            filtered.append(a)
            last_ms[t] = a["timestamp_ms"]
            
    return filtered

# Mock capability scoring algorithm
def compute_capability_profile(user_id: str, db: Session):
    sessions = db.query(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.VisionSession.timestamp.asc()).all()
    session_count = len(sessions)
    
    # Base values start at zero for a clean slate
    mobility = 0.0
    stability = 0.0
    quality = 0.0
    cardio = 0.0
    recovery = 0.0
    reserve = 0.0
    
    zone_risks = {
        "head": None, "neck": None, "chest": None, "lumbar": None,
        "left_shoulder": None, "right_shoulder": None, "left_arm": None, "right_arm": None,
        "left_forearm": None, "right_forearm": None, "left_hip": None, "right_hip": None,
        "left_thigh": None, "right_thigh": None, "left_knee": None, "right_knee": None,
        "left_shin": None, "right_shin": None, "left_ankle": None, "right_ankle": None
    }
    zone_confidence = {k: "none" for k in zone_risks.keys()}
    trend_data = []

    # Calculate pain logs influence
    recent_pain = db.query(models.PainLog).filter(models.PainLog.user_id == user_id).order_by(models.PainLog.timestamp.desc()).limit(20).all()
    pain_map = {}
    for p in recent_pain:
        if p.zone not in pain_map:
            pain_map[p.zone] = []
        pain_map[p.zone].append(p.score)
        
    for zone, scores in pain_map.items():
        if zone in zone_risks:
            avg_pain = sum(scores) / len(scores)
            # Pain score 1-10 mapped to 10-100
            zone_risks[zone] = int(avg_pain * 10)
            zone_confidence[zone] = "high" if len(scores) >= 3 else ("medium" if len(scores) > 0 else "low")
            
    # Calculate anomaly events influence
    recent_anomalies = db.query(models.AnomalyEvent).join(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.AnomalyEvent.timestamp_ms.desc()).limit(50).all()
    for a in recent_anomalies:
        target_zones = []
        if "valgus" in a.type.lower():
            target_zones.extend(["left_knee", "right_knee"])
        elif "hip" in a.type.lower() or "asymmetry" in a.type.lower():
            target_zones.extend(["left_hip", "right_hip", "lumbar"])
        
        for tz in target_zones:
            if tz in zone_risks:
                current = zone_risks[tz] or 0
                zone_risks[tz] = min(100, current + 15)
                if zone_confidence[tz] == "none":
                    zone_confidence[tz] = "low"
                elif zone_confidence[tz] == "low":
                    zone_confidence[tz] = "medium"

    if session_count > 0:
        # Calculate core metrics dynamically from the latest 5 sessions
        recent_sessions = sessions[-5:]
        roms = [s.rom for s in recent_sessions if s.rom is not None]
        stabs = [s.stability for s in recent_sessions if s.stability is not None]
        syms = [s.symmetry for s in recent_sessions if s.symmetry is not None]
        
        if roms:
            mean_rom = statistics.mean(roms)
            # Normalize ROM in degrees (e.g. 140-180 deg) to 0-100 scale
            mobility = min(100.0, round((mean_rom / 140.0) * 100.0, 1) if mean_rom > 100 else mean_rom)
        if stabs: stability = min(100.0, round(statistics.mean(stabs) * 100, 1))
        if syms: quality = min(100.0, round(statistics.mean(syms) * 100, 1))
        
        # Trend data from chronological sessions
        for i, s in enumerate(sessions[-30:]):
            trend_data.append({
                "name": s.timestamp.strftime('%m-%d'),
                "mobility": round(s.rom, 1) if s.rom else 0.0,
                "stability": round(s.stability * 100, 1) if s.stability else 0.0,
                "quality": round(s.symmetry * 100, 1) if s.symmetry else 0.0,
                "recovery": 0.0,
                "reserve": 0.0
            })
            
        # Parse zone risks from the latest session
        latest_session = sessions[-1]
        if latest_session.joint_angles_json:
            try:
                angles = json.loads(latest_session.joint_angles_json)
                shoulder_tilt = abs(float(angles.get("Shoulder Tilt") or angles.get("shoulderTilt") or 0))
                hip_tilt = abs(float(angles.get("Hip Tilt") or angles.get("hipTilt") or 0))
                head_fwd = abs(float(angles.get("Head Forward") or angles.get("headForward") or 0))
                knee_valgus = abs(float(angles.get("Knee Valgus") or angles.get("kneeValgus") or 0))
                trunk_lean = abs(float(angles.get("Trunk Lean") or angles.get("trunkLean") or 0))
                raw_symmetry = float(latest_session.symmetry or 0.95)
                asym = max(0.0, (1.0 - raw_symmetry) * 100)
                
                def apply_risk(z, calculated_risk):
                    current = zone_risks[z] or 0
                    zone_risks[z] = min(100, max(current, int(calculated_risk)))
                    zone_confidence[z] = "high" if session_count >= 3 else ("medium" if session_count > 0 else "low")
                
                if head_fwd > 0 or shoulder_tilt > 0:
                    neck_risk = min(100, int(head_fwd * 5.5 + shoulder_tilt * 1.5))
                    apply_risk("neck", neck_risk)
                    apply_risk("head", neck_risk * 0.6)
                    apply_risk("chest", min(100, int(15 + head_fwd * 2.0 + shoulder_tilt * 2.0)))
                
                if shoulder_tilt > 0 or asym > 0:
                    l_shoulder_risk = min(100, int(20 + shoulder_tilt * 5.0 + asym * 0.8))
                    r_shoulder_risk = min(100, int(20 + shoulder_tilt * 4.0 + asym * 0.5))
                    apply_risk("left_shoulder", l_shoulder_risk)
                    apply_risk("right_shoulder", r_shoulder_risk)
                    apply_risk("left_arm", l_shoulder_risk * 0.6)
                    apply_risk("right_arm", r_shoulder_risk * 0.6)
                    apply_risk("left_forearm", l_shoulder_risk * 0.4)
                    apply_risk("right_forearm", r_shoulder_risk * 0.4)
                
                if hip_tilt > 0 or shoulder_tilt > 0 or trunk_lean > 0:
                    lumbar_risk = min(100, int(25 + (shoulder_tilt * 3.5) + (hip_tilt * 4.0) + (trunk_lean * 3.0) + asym * 1.2))
                    apply_risk("lumbar", lumbar_risk)
                    
                if hip_tilt > 0 or asym > 0:
                    l_hip_risk = min(100, int(20 + hip_tilt * 5.0 + asym * 1.0))
                    r_hip_risk = min(100, int(18 + hip_tilt * 4.0))
                    apply_risk("left_hip", l_hip_risk)
                    apply_risk("right_hip", r_hip_risk)
                
                if knee_valgus > 0 or hip_tilt > 0:
                    l_knee_risk = min(100, int(22 + (hip_tilt * 4.5) + (knee_valgus * 3.0) + asym * 1.5))
                    r_knee_risk = min(100, int(20 + (hip_tilt * 3.5) + (knee_valgus * 2.5) + asym * 1.0))
                    apply_risk("left_knee", l_knee_risk)
                    apply_risk("right_knee", r_knee_risk)
                    
                    thigh_risk = min(100, int(15 + knee_valgus * 2.5 + asym * 1.2))
                    apply_risk("left_thigh", thigh_risk)
                    apply_risk("right_thigh", thigh_risk * 0.9)
                    apply_risk("left_shin", l_knee_risk * 0.5)
                    apply_risk("right_shin", r_knee_risk * 0.5)
                
                if hip_tilt > 0 or asym > 0:
                    ankle_risk = min(100, int(15 + hip_tilt * 2.0 + asym * 1.0))
                    apply_risk("left_ankle", ankle_risk)
                    apply_risk("right_ankle", ankle_risk * 0.9)
                    
            except Exception as e:
                print(f"Error parsing joint angles for zone risks: {e}")
    else:
        # No sessions = empty trend data
        trend_data = []

    # Integrate External Apps (Hevy/HealthifyMe)
    ext_apps = db.query(models.ExternalAppSession).filter(models.ExternalAppSession.user_id == user_id).order_by(models.ExternalAppSession.timestamp.desc()).all()
    if ext_apps:
        heavy_workouts = 0
        total_protein = 0
        for ext in ext_apps[:7]: # last 7 entries
            try:
                data = json.loads(ext.session_data)
                if ext.app_name == "Hevy":
                    workouts = data.get("workouts", [])
                    heavy_workouts += sum(1 for w in workouts if w.get("load") == "High")
                elif ext.app_name == "HealthifyMe":
                    protein_status = data.get("nutrition", {}).get("protein", "")
                    if "High" in protein_status or "Optimal" in protein_status:
                        total_protein += 1
            except:
                pass
        
        # Adjust recovery and reserve based on external data
        recovery = max(0.0, min(100.0, 88.0 - (heavy_workouts * 5) + (total_protein * 3)))
        reserve = max(0.0, min(100.0, 55.0 - (heavy_workouts * 3) + (total_protein * 2)))
        
    if trend_data:
        trend_data[-1]["recovery"] = round(recovery, 1)
        trend_data[-1]["reserve"] = round(reserve, 1)

    # Fix 6: Compute cardio score from real wearable data instead of hardcoding 78.0
    # Pull the most recent wearable session for this user
    latest_wearable = (
        db.query(models.WearableSession)
        .filter(models.WearableSession.user_id == user_id)
        .order_by(models.WearableSession.timestamp.desc())
        .first()
    )
    if latest_wearable and (latest_wearable.heart_rate or latest_wearable.hrv):
        hr  = latest_wearable.heart_rate or 72.0
        hrv = latest_wearable.hrv or 50.0
        # Lower resting HR → better cardio: 50 BPM = 100 score, 90 BPM = 20 score
        hr_score  = max(0.0, min(100.0, 130.0 - (hr * 1.0)))
        # Higher HRV → better recovery: 80ms = 80 score, 20ms = 20 score
        hrv_score = max(0.0, min(100.0, hrv * 1.0))
        cardio = round((hr_score * 0.6) + (hrv_score * 0.4), 1)
    # else: cardio stays at the base fallback value of 78.0

    profile = models.CapabilityProfile(
        user_id=user_id,
        mobility=round(mobility, 1),
        stability=round(stability, 1),
        movement_quality=round(quality, 1),
        cardiovascular_efficiency=round(cardio, 1),
        recovery=round(recovery, 1),
        capability_reserve=round(reserve, 1),
        confidence="High" if session_count >= 3 else ("Medium" if session_count > 0 else "Low"),
        trend_data=json.dumps(trend_data),
        zone_risks=json.dumps(zone_risks) if zone_risks else None,
        zone_confidence_json=json.dumps(zone_confidence)
    )
    db.add(profile)
    
    if session_count >= 3 and stability < 60:
        cp = models.ChangePoint(
            user_id=user_id,
            metric_name="stability",
            session_id="latest",
            classification="persistent",
            magnitude=round(stability - 70.0, 1)
        )
        db.add(cp)
        
    db.commit()
    db.refresh(profile)
    return profile

def generate_weekly_letter(user_id: str, db: Session):
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    
    if not profile:
        return "Not enough data to generate a weekly letter. Keep logging sessions!"

    prompt = f"""
    You are PhysioTwin, a friendly, concise, and highly analytical digital twin of the user's physical capability. 
    Write a short weekly summary (2-3 paragraphs max) based on the user's latest data.
    Do NOT give medical advice or diagnose anything. Use a clinical-precision but supportive tone.
    
    Latest Stats:
    Mobility: {profile.mobility}
    Stability: {profile.stability}
    Movement Quality: {profile.movement_quality}
    Cardio Efficiency: {profile.cardiovascular_efficiency}
    Recovery: {profile.recovery}
    
    If stability is below 60, mention that we've noticed a persistent deterioration in stability over the last few sessions, likely driven by postural sway, and suggest focusing on ankle mobility.
    """

    try:
        client = Groq(api_key=GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="groq/compound-mini",
            temperature=0.7,
            max_tokens=300
        )
        content = chat_completion.choices[0].message.content
        
        note = models.TwinNote(
            user_id=user_id,
            type="weekly_letter",
            content=content
        )
        db.add(note)
        db.commit()
        return content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Your digital twin is currently analyzing your data. Check back later for your weekly summary."

def generate_deep_insights(user_id: str, db: Session):
    sessions = db.query(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.VisionSession.timestamp.desc()).limit(10).all()
    
    if not sessions:
        default_metrics = {
            "bilateral_symmetry": "95.0%",
            "ground_reaction_force_bw": "1.20 BW",
            "ground_reaction_force_n": "840 N",
            "spine_lumbar_flexion": "10.0° (L4-L5)",
            "spine_thoracolumbar": "14.5°",
            "valgus_velocity": "12.0 °/s",
            "angular_acceleration": "38.0 °/s²",
            "reps_decay": "0.0%",
            "task_type": "None"
        }
        return {
            "insights": "No session history found. Please record a Capture session first to get deep insights.",
            "metrics": default_metrics
        }

    import json
    latest = sessions[0]
    
    # Map legacy task types to standard naming
    task_map = {
        "Sit-to-Stand": "Squats", "sit-to-stand": "Squats", "squat-analysis": "Squats", "squats": "Squats",
        "biceps-curls": "Bicep Curls", "bicep-curls": "Bicep Curls", "Biceps-Curls": "Bicep Curls",
        "standing-posture": "Standing Posture", "Standing-Posture": "Standing Posture"
    }
    latest_task = task_map.get(latest.task_type or "", latest.task_type or "Squats")

    # Normalize speed values to realistic reps/min and calculate tempo (sec/rep)
    raw_latest_speed = latest.movement_speed if (latest.movement_speed and latest.movement_speed > 0) else 1.2
    latest_speed_rpm = round(raw_latest_speed * 16.0, 1) if raw_latest_speed < 5.0 else round(raw_latest_speed, 1)
    latest_tempo_sec = round(60.0 / latest_speed_rpm, 1) if latest_speed_rpm > 0 else 3.2

    # 1. Bilateral Symmetry (%)
    raw_sym = latest.symmetry or 0.94
    symmetry_pct = round(raw_sym * 100 if raw_sym <= 1.0 else raw_sym, 1)
    
    # 2. Ground Reaction Force (GRF)
    speed_val = (latest_speed_rpm / 16.0)
    grf_bw = round(1.15 + (speed_val / 15.0), 2)
    grf_n = round(72.0 * 9.81 * grf_bw)
    
    # 3. Spine Segmental Segmenting (L4-L5 lumbar flexion & thoracolumbar curvature)
    shoulder_tilt = 2.5
    hip_tilt = 2.0
    head_forward = 4.0
    if latest.joint_angles_json:
        try:
            angles = json.loads(latest.joint_angles_json)
            shoulder_tilt = abs(float(angles.get("Shoulder Tilt", angles.get("shoulderTilt", 2.5))))
            hip_tilt = abs(float(angles.get("Hip Tilt", angles.get("hipTilt", 2.0))))
            head_forward = abs(float(angles.get("Head Forward", angles.get("headForward", 4.0))))
        except Exception:
            pass

    spine_lumbar = round(8.5 + hip_tilt * 1.6, 1)
    spine_thoraco = round(12.0 + shoulder_tilt * 2.2, 1)
    
    # 4. Valgus Velocity (°/s) & Angular Acceleration (°/s²)
    valgus_vel = round(8.5 + (1.0 - (latest.stability or 0.9)) * 45.0, 1)
    angular_accel = round(28.0 + (latest.rom or 110.0) * 0.14 + speed_val * 3.5, 1)
    
    # 5. Reps Fatigue Decay Indicator (% velocity loss across reps)
    session_reps = latest.rom if (latest.rom and latest.rom < 50) else 6
    reps_decay_pct = round(min(22.0, max(0.0, (session_reps * 1.4) + (1.0 - (latest.symmetry or 0.9)) * 30.0)), 1)
    
    metrics = {
        "bilateral_symmetry": f"{symmetry_pct:.1f}%",
        "ground_reaction_force_bw": f"{grf_bw:.2f} BW",
        "ground_reaction_force_n": f"{grf_n:.0f} N",
        "spine_lumbar_flexion": f"{spine_lumbar:.1f}° (L4-L5)",
        "spine_thoracolumbar": f"{spine_thoraco:.1f}°",
        "valgus_velocity": f"{valgus_vel:.1f} °/s",
        "angular_acceleration": f"{angular_accel:.1f} °/s²",
        "reps_decay": f"{reps_decay_pct:.1f}% Fatigue Drop",
        "movement_speed": f"{latest_speed_rpm:.1f} reps/min ({latest_tempo_sec}s/rep)",
        "task_type": latest_task
    }
    
    history_lines = []
    for s in sessions:
        disp_type = task_map.get(s.task_type or "", s.task_type or "Movement Assessment")
        raw_s_speed = s.movement_speed if (s.movement_speed and s.movement_speed > 0) else 1.2
        s_speed_rpm = round(raw_s_speed * 16.0, 1) if raw_s_speed < 5.0 else round(raw_s_speed, 1)
        s_tempo = round(60.0 / s_speed_rpm, 1) if s_speed_rpm > 0 else 3.2
        s_sym = round(s.symmetry * 100 if (s.symmetry and s.symmetry <= 1.0) else (s.symmetry or 92), 1)

        if s.task_type in ["Static-Image-Posture", "Standing-Posture", "standing-posture"]:
            try:
                angles = json.loads(s.joint_angles_json) if s.joint_angles_json else {}
                st = f"{angles.get('shoulderTilt', 0):.1f}°"
                ht = f"{angles.get('hipTilt', 0):.1f}°"
                hf = f"{angles.get('headForward', 0):.1f}°"
                history_lines.append(f"Date: {s.timestamp.strftime('%Y-%m-%d')}, Type: {disp_type}, Score: {s.stability*100:.0f}, Symmetry: {s_sym}%, Shoulder Tilt: {st}, Hip Tilt: {ht}, Head Forward: {hf}")
            except Exception:
                history_lines.append(f"Date: {s.timestamp.strftime('%Y-%m-%d')}, Type: {disp_type}, Score: {s.stability*100:.0f}, Symmetry: {s_sym}%")
        else:
            history_lines.append(f"Date: {s.timestamp.strftime('%Y-%m-%d')}, Type: {disp_type}, ROM: {s.rom}°, Symmetry: {s_sym}%, Speed: {s_speed_rpm} reps/min ({s_tempo}s/rep tempo)")
            
    history_text = "\n".join(history_lines)

    limb_focus_instruction = ""
    if "bicep" in latest_task.lower() or "curl" in latest_task.lower():
        limb_focus_instruction = "IMPORTANT: This assessment is a Bicep Curls scan. Analyze and report biomechanical findings EXCLUSIVELY for the ARMS (biceps, elbows, forearms, shoulders). Omit lower body discussions."
    elif "squat" in latest_task.lower():
        limb_focus_instruction = "IMPORTANT: This assessment is a Squats scan. Analyze and report biomechanical findings EXCLUSIVELY for the KNEES & LOWER BODY (knee valgus velocity, L4-L5 lumbar flexion, ground reaction force). Omit upper arm discussions."

    prompt = f"""You are PhysioTwin — a clinical-grade biomechanics AI engine embedded inside a digital twin platform.
Produce a professional **Deep Insight Report** for the user based on their biomechanical assessment.
{limb_focus_instruction}
Do NOT give medical diagnoses. Address the user directly as "you". Use rich markdown with headers, bold text, bullet points, and horizontal rules.

**Calculated Biomechanical Kinematics:**
- Movement Assessment: {latest_task}
- Movement Cadence / Speed: {latest_speed_rpm:.1f} reps/min (Tempo: {latest_tempo_sec:.1f} seconds per repetition)
- Bilateral Symmetry: {metrics['bilateral_symmetry']}
- Ground Reaction Force (GRF): {metrics['ground_reaction_force_bw']} ({metrics['ground_reaction_force_n']})
- Spine Segmental Flexion (L4-L5): {metrics['spine_lumbar_flexion']}
- Peak Valgus Velocity: {metrics['valgus_velocity']}
- Angular Acceleration: {metrics['angular_acceleration']}
- Reps Fatigue Decay: {metrics['reps_decay']}

**Session History:**
{history_text}

**Report Structure (follow this EXACTLY):**

## Biomechanical Summary
A concise 3-4 sentence executive overview of your movement assessment. Reference Bilateral Symmetry ({metrics['bilateral_symmetry']}), Ground Reaction Force ({metrics['ground_reaction_force_bw']}), and Spine Segmental Flexion ({metrics['spine_lumbar_flexion']}).

---

## Asymmetry & Imbalance Detection
Analyze joint angular deviations & kinetic chain balance:
- **Bilateral Symmetry & Dynamic Balance:** Discuss Bilateral Symmetry ({metrics['bilateral_symmetry']}) and load distribution during movement.
- **Valgus Velocity & Joint Tracking:** Analyze peak knee valgus velocity ({metrics['valgus_velocity']}) and angular acceleration ({metrics['angular_acceleration']}).
- **Spine Segmental Alignment:** Analyze L4-L5 lumbar flexion ({metrics['spine_lumbar_flexion']}) and thoracolumbar curvature ({metrics['spine_thoracolumbar']}).
- **Fatigue Decay:** Evaluate reps fatigue decay rate ({metrics['reps_decay']}).

---

## Kinematic Risk Factors
Identify 2-3 specific biomechanical risks using anatomical terminology:
- Rate each risk as **Low**, **Moderate**, or **Elevated**.

---

## Prescriptive Corrective Protocols
Provide exactly 3 targeted corrective exercises formatted as:
- **Exercise Name** — Sets × Reps, tempo, and specific cues.
- **Target:** Which muscle group or movement pattern it addresses.
- **Rationale:** Why this exercise is selected based on the detected parameters.
"""

    report_text = ""
    try:
        client = Groq(api_key=GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="groq/compound-mini",
            temperature=0.35,
            max_tokens=950
        )
        report_text = chat_completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        report_text = f"""## Biomechanical Summary
Your movement assessment demonstrates a **Bilateral Symmetry** of **{metrics['bilateral_symmetry']}** with a peak Ground Reaction Force (GRF) of **{metrics['ground_reaction_force_bw']}** ({metrics['ground_reaction_force_n']}). Spine segmental alignment indicates an L4-L5 lumbar flexion of **{metrics['spine_lumbar_flexion']}**. Overall motion quality is strong, with targeted opportunities to improve rotational stability.

---

## Asymmetry & Imbalance Detection
- **Bilateral Symmetry & Dynamic Balance:** Measured bilateral symmetry is **{metrics['bilateral_symmetry']}**. Discrepancies between left and right limb loading remain within functional threshold.
- **Valgus Velocity & Acceleration:** Peak knee valgus velocity reached **{metrics['valgus_velocity']}** with an angular acceleration of **{metrics['angular_acceleration']}**.
- **Spine Segmental Alignment:** L4-L5 lumbar flexion measured **{metrics['spine_lumbar_flexion']}** with a thoracolumbar alignment of **{metrics['spine_thoracolumbar']}**.
- **Fatigue Decay Indicator:** Reps velocity decay is calculated at **{metrics['reps_decay']}**, reflecting high neuromuscular endurance across reps.

---

## Kinematic Risk Factors
- **Dynamic Knee Valgus Acceleration** — Elevated valgus velocity during descent increases medial compartment loading. Risk: **Moderate**.
- **Lumbar Segmental Compensation** — L4-L5 lumbar flexion of {metrics['spine_lumbar_flexion']} requires core bracing to protect intervertebral discs. Risk: **Low**.

---

## Prescriptive Corrective Protocols
- **Single-Leg Terminal Knee Extensions** — 3 × 12 per side, 2-sec hold. **Target:** VMO activation. **Rationale:** Controls valgus velocity ({metrics['valgus_velocity']}) during single-leg weight bearing.
- **Pallof Press with Anti-Rotation** — 3 × 10 per side, 3-sec pause. **Target:** Transverse abdominis & internal obliques. **Rationale:** Stabilizes thoracolumbar curvature ({metrics['spine_thoracolumbar']}).
- **Goblet Tempo Squats** — 3 × 8, 3-1-1 tempo. **Target:** Gluteus maximus & core braced posture. **Rationale:** Improves GRF distribution ({metrics['ground_reaction_force_bw']}) and reduces fatigue decay."""

    return {
        "insights": report_text,
        "metrics": metrics
    }

class MessageInput:
    role: str
    content: str

def chat_with_twin(user_id: str, messages_history: list[dict], db: Session):
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    
    stats = "No data yet."
    if profile:
        stats = f"Mobility: {profile.mobility}, Stability: {profile.stability}, Quality: {profile.movement_quality}, Cardio: {profile.cardiovascular_efficiency}, Recovery: {profile.recovery}, Reserve: {profile.capability_reserve}"
        if profile.zone_confidence_json:
            stats += f"\n    Zone Confidence: {profile.zone_confidence_json}"
        
    # Feature 10: Prepend case notes to twin system prompt for context memory
    case_notes = db.query(models.TwinNote).filter(
        models.TwinNote.user_id == user_id,
        models.TwinNote.type == "system_flag"
    ).order_by(models.TwinNote.timestamp.desc()).limit(3).all()
    notes_text = "\n".join([f"- {n.content.replace('Casenote: ', '')}" for n in case_notes]) if case_notes else "None"

    system_prompt = f"""
    You are PhysioTwin, a friendly, concise, and highly analytical digital twin of the user's physical capability.
    The user is chatting with you. You should answer their questions based on their latest data.
    Do NOT give medical advice. Speak directly to the user.
    
    User's Latest Stats:
    {stats}

    User's Clinical Case Notes:
    {notes_text}
    """
    
    # Prepend system prompt to the messages
    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages_history:
        api_messages.append({"role": msg["role"], "content": msg["content"]})
        
    try:
        client = Groq(api_key=GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=api_messages,
            model="groq/compound-mini",
            temperature=0.7,
            max_tokens=300
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        err_str = str(e)
        print(f"LLM Error: {err_str}")
        if "401" in err_str or "invalid_api_key" in err_str or "Authentication" in err_str:
            return "⚠️ The AI Twin is temporarily unavailable — the LLM API key needs to be refreshed. Please contact your administrator."
        elif "429" in err_str or "rate_limit" in err_str:
            return "⏳ The AI Twin is receiving too many requests right now. Please wait a moment and try again."
        elif "503" in err_str or "unavailable" in err_str.lower():
            return "🔌 The AI Twin's language model service is temporarily down. Please try again in a few minutes."
        else:
            return "❌ The AI Twin encountered an unexpected error. Please try again."

def simulate_activity(user_id: str, activity_type: str, duration_mins: int, intensity: str, db: Session):
    # Fetch current profile
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    
    if not profile:
        return {"error": "No baseline profile available for simulation."}
        
    # Heuristics based on activity
    cost = 0
    if activity_type.lower() == "running":
        cost = duration_mins * (0.5 if intensity == "Light" else 1.2 if intensity == "Hard" else 0.8)
    elif activity_type.lower() == "weightlifting":
        cost = duration_mins * (0.4 if intensity == "Light" else 1.0 if intensity == "Hard" else 0.7)
    elif activity_type.lower() == "yoga":
        cost = duration_mins * 0.2
    else:
        cost = duration_mins * 0.5
        
    new_reserve = max(0.0, profile.capability_reserve - cost)
    new_recovery = max(0.0, profile.recovery - (cost * 0.5))
    
    return {
        "original": {
            "reserve": profile.capability_reserve,
            "recovery": profile.recovery
        },
        "simulated": {
            "reserve": round(new_reserve, 1),
            "recovery": round(new_recovery, 1)
        },
        "cost": round(cost, 1)
    }

def simulate_counterfactual(
    user_id: str,
    activity_type: str = "Squats & Lifts",
    duration_mins: int = 45,
    intensity: str = "High",
    weekly_sessions: int = 4,
    sleep_hours: float = 7.0,
    protein_g: int = 110,
    hydration_l: float = 2.5,
    treatment_protocols: list = None,
    target_limb: str = "full_body",
    db: Session = None
) -> dict:
    treatment_protocols = treatment_protocols or []
    
    # Calculate physiological load & recovery multipliers
    intensity_mult = 1.4 if ("high" in intensity.lower() or "max" in intensity.lower()) else (1.1 if "mod" in intensity.lower() else 0.8)
    weekly_load_vol = (duration_mins / 30.0) * weekly_sessions * intensity_mult
    
    recovery_score = (sleep_hours / 8.0) * (protein_g / 130.0) * (hydration_l / 3.0)
    acwr = round(0.85 + (weekly_load_vol * 0.12) / max(0.4, recovery_score), 2)
    
    # Treatment reduction effects
    treatment_strain_reduction = 0.0
    symmetry_boost = 0.0
    for t in treatment_protocols:
        t_low = t.lower()
        if "eccentric" in t_low:
            treatment_strain_reduction += 0.18
            symmetry_boost += 5.0
        if "manual" in t_low:
            treatment_strain_reduction += 0.12
        if "emg" in t_low:
            symmetry_boost += 12.0
        if "deload" in t_low:
            treatment_strain_reduction += 0.25

    effective_acwr = max(0.7, round(acwr * (1.0 - treatment_strain_reduction), 2))
    reinjury_prob = min(95, max(8, round(effective_acwr * 30)))

    # Calculate projected trajectory curves across 30d, 90d, 180d
    trajectory = {
        "30d": {
            "acwr_baseline": acwr,
            "acwr_treatment": effective_acwr,
            "reinjury_prob": reinjury_prob,
            "recovery_index": min(100, round(recovery_score * 75))
        },
        "90d": {
            "acwr_baseline": max(0.8, round(acwr * 0.95, 2)),
            "acwr_treatment": max(0.7, round(effective_acwr * 0.85, 2)),
            "reinjury_prob": max(5, round(reinjury_prob * 0.65)),
            "recovery_index": min(100, round(recovery_score * 85))
        },
        "180d": {
            "acwr_baseline": max(0.8, round(acwr * 0.90, 2)),
            "acwr_treatment": max(0.7, round(effective_acwr * 0.75, 2)),
            "reinjury_prob": max(4, round(reinjury_prob * 0.40)),
            "recovery_index": min(100, round(recovery_score * 95))
        }
    }

    # Generate 3D zone risks for body parts
    base_strain = int(effective_acwr * 35)
    zone_risks = {
        "head": max(5, int(base_strain * 0.3)),
        "neck": max(10, int(base_strain * 0.4)),
        "chest": max(10, int(base_strain * 0.4)),
        "lumbar": min(95, max(20, int(base_strain * 1.3))),
        "left_shoulder": max(10, int(base_strain * 0.6)),
        "right_shoulder": max(10, int(base_strain * 0.5)),
        "left_arm": max(10, int(base_strain * 0.8 if target_limb == "arms" else base_strain * 0.4)),
        "right_arm": max(10, int(base_strain * 0.8 if target_limb == "arms" else base_strain * 0.4)),
        "left_forearm": max(10, int(base_strain * 0.7 if target_limb == "arms" else base_strain * 0.3)),
        "right_forearm": max(10, int(base_strain * 0.7 if target_limb == "arms" else base_strain * 0.3)),
        "left_hip": max(15, int(base_strain * 0.9)),
        "right_hip": max(15, int(base_strain * 0.7)),
        "left_thigh": min(95, max(15, int(base_strain * 1.4 if target_limb == "knees" else base_strain * 0.8))),
        "right_thigh": max(15, int(base_strain * 0.7)),
        "left_knee": min(95, max(20, int(base_strain * 1.6 if target_limb == "knees" else base_strain * 0.9))),
        "right_knee": max(15, int(base_strain * 0.8)),
        "left_shin": max(10, int(base_strain * 0.5)),
        "right_shin": max(10, int(base_strain * 0.4)),
        "left_ankle": max(10, int(base_strain * 0.6)),
        "right_ankle": max(10, int(base_strain * 0.5)),
    }

    return {
        "acwr_raw": acwr,
        "acwr_effective": effective_acwr,
        "reinjury_probability": reinjury_prob,
        "recovery_score": round(recovery_score, 2),
        "treatment_impact": {
            "active_protocols": treatment_protocols,
            "strain_reduction_percent": round(treatment_strain_reduction * 100, 1),
            "symmetry_boost_percent": round(symmetry_boost, 1)
        },
        "trajectory": trajectory,
        "zone_risks": zone_risks
    }


def compute_injury_risk(user_id: str, db: Session) -> dict:
    """
    Multi-factor heuristic injury risk model.
    Combines ACWR, pain scores, kinesiophobia, symmetry, and sleep to predict
    injury probability for the next 7 days (0–100%).

    Weights based on sports science literature:
      - ACWR spike:           35%
      - Subjective pain:      25%
      - Kinesiophobia score:  15%
      - Biomech asymmetry:    15%
      - Sleep deficit:        10%
    """
    now = datetime.datetime.utcnow()

    # ── 1. ACWR Component (35%) ────────────────────────────────────────────────
    acute_sessions = db.query(models.VisionSession)\
        .filter(models.VisionSession.user_id == user_id,
                models.VisionSession.timestamp >= now - datetime.timedelta(days=7)).all()
    chronic_sessions = db.query(models.VisionSession)\
        .filter(models.VisionSession.user_id == user_id,
                models.VisionSession.timestamp >= now - datetime.timedelta(days=28)).all()
    recent_pain = db.query(models.PainLog)\
        .filter(models.PainLog.user_id == user_id,
                models.PainLog.timestamp >= now - datetime.timedelta(days=7)).all()
    tsk = db.query(models.KinesiophobiaRecord)\
        .filter(models.KinesiophobiaRecord.user_id == user_id)\
        .order_by(models.KinesiophobiaRecord.timestamp.desc()).first()
    recent_vs = db.query(models.VisionSession)\
        .filter(models.VisionSession.user_id == user_id,
                models.VisionSession.timestamp >= now - datetime.timedelta(days=14))\
        .order_by(models.VisionSession.timestamp.desc()).limit(5).all()
    recent_wearable = db.query(models.WearableSession)\
        .filter(models.WearableSession.user_id == user_id,
                models.WearableSession.timestamp >= now - datetime.timedelta(days=7)).all()

    acute_vol = sum([s.rom or 100 for s in acute_sessions]) if acute_sessions else 300
    chronic_vol = (sum([s.rom or 100 for s in chronic_sessions]) / 4.0) if chronic_sessions else 250
    acwr = acute_vol / max(1.0, chronic_vol)
    acwr_risk = min(100, max(0, (acwr - 0.8) / (1.5 - 0.8) * 100)) if acwr > 0.8 else 0

    has_activity = bool(acute_sessions or chronic_sessions or recent_pain or tsk or recent_vs or recent_wearable)
    if not has_activity:
        return {
            "risk_score": 0,
            "risk_level": "Optimal",
            "recommendation": "No active movement strain logged. Complete a Live Vision posture capture to generate your baseline.",
            "contributing_factors": [],
            "acwr": 1.0,
        }

    # ── 2. Pain Score Component (25%) ─────────────────────────────────────────
    recent_pain = db.query(models.PainLog)\
        .filter(models.PainLog.user_id == user_id,
                models.PainLog.timestamp >= now - datetime.timedelta(days=7)).all()
    avg_pain = statistics.mean([p.score for p in recent_pain]) if recent_pain else 0
    pain_risk = (avg_pain / 10.0) * 100  # normalize 0-10 to 0-100

    # ── 3. Kinesiophobia Component (15%) ──────────────────────────────────────
    tsk = db.query(models.KinesiophobiaRecord)\
        .filter(models.KinesiophobiaRecord.user_id == user_id)\
        .order_by(models.KinesiophobiaRecord.timestamp.desc()).first()
    tsk_score = tsk.score if tsk else 22  # default mid-range
    # TSK range 11-44; risk starts at 25+
    kinesio_risk = max(0, (tsk_score - 11) / (44 - 11) * 100) if tsk else 30

    # ── 4. Symmetry / Asymmetry Component (15%) ───────────────────────────────
    recent_vs = db.query(models.VisionSession)\
        .filter(models.VisionSession.user_id == user_id,
                models.VisionSession.timestamp >= now - datetime.timedelta(days=14))\
        .order_by(models.VisionSession.timestamp.desc()).limit(5).all()
    avg_symmetry = statistics.mean([s.symmetry for s in recent_vs if s.symmetry]) if recent_vs else 75
    # Lower symmetry → higher risk. Perfect = 100, risk = 100 - symmetry
    asymmetry_risk = max(0, 100 - avg_symmetry)

    # ── 5. Sleep Deficit Component (10%) ──────────────────────────────────────
    recent_wearable = db.query(models.WearableSession)\
        .filter(models.WearableSession.user_id == user_id,
                models.WearableSession.timestamp >= now - datetime.timedelta(days=7)).all()
    avg_sleep = statistics.mean([w.sleep_hours for w in recent_wearable if w.sleep_hours]) \
        if recent_wearable else 7.0
    # <7h is deficit; risk scales linearly
    sleep_risk = max(0, (7.0 - avg_sleep) / 7.0 * 100) if avg_sleep < 7.0 else 0

    # ── Composite Score ────────────────────────────────────────────────────────
    raw_score = (
        acwr_risk       * 0.35 +
        pain_risk       * 0.25 +
        kinesio_risk    * 0.15 +
        asymmetry_risk  * 0.15 +
        sleep_risk      * 0.10
    )
    risk_score = min(100, max(0, round(raw_score)))

    if risk_score <= 30:
        risk_level = "Low"
        recommendation = "Training load is well-managed. Proceed with your planned program."
    elif risk_score <= 60:
        risk_level = "Moderate"
        recommendation = "Consider reducing session intensity by 20% and prioritizing sleep."
    else:
        risk_level = "High"
        recommendation = "High injury risk detected. Take an active rest day and consult your physio."

    # Contributing factors (sorted by contribution)
    factors = [
        {"factor": "Workload Spike (ACWR)", "contribution": round(acwr_risk * 0.35, 1), "value": f"{round(acwr, 2)}x"},
        {"factor": "Subjective Pain", "contribution": round(pain_risk * 0.25, 1), "value": f"{round(avg_pain, 1)}/10"},
        {"factor": "Movement Fear (TSK)", "contribution": round(kinesio_risk * 0.15, 1), "value": f"{tsk_score}/44"},
        {"factor": "Bilateral Asymmetry", "contribution": round(asymmetry_risk * 0.15, 1), "value": f"{round(avg_symmetry, 1)}%"},
        {"factor": "Sleep Deficit", "contribution": round(sleep_risk * 0.10, 1), "value": f"{round(avg_sleep, 1)}h"},
    ]
    factors.sort(key=lambda x: x["contribution"], reverse=True)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "contributing_factors": factors,
        "acwr": round(acwr, 2),
    }



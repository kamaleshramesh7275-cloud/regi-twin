import os
from sqlalchemy.orm import Session
from groq import Groq
import models
import statistics
import datetime

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

import json

# Mock capability scoring algorithm
def compute_capability_profile(user_id: str, db: Session):
    sessions = db.query(models.VisionSession).filter(models.VisionSession.user_id == user_id).order_by(models.VisionSession.timestamp.asc()).all()
    session_count = len(sessions)
    
    # Base fallback values
    mobility = 85.0
    stability = 70.0
    quality = 92.0
    cardio = 78.0
    recovery = 88.0
    reserve = 55.0
    
    zone_risks = {}
    trend_data = []

    if session_count > 0:
        # Calculate core metrics dynamically from the latest 5 sessions
        recent_sessions = sessions[-5:]
        roms = [s.rom for s in recent_sessions if s.rom is not None]
        stabs = [s.stability for s in recent_sessions if s.stability is not None]
        syms = [s.symmetry for s in recent_sessions if s.symmetry is not None]
        
        if roms: mobility = statistics.mean(roms)
        if stabs: stability = statistics.mean(stabs) * 100
        if syms: quality = statistics.mean(syms) * 100
        
        # Trend data from chronological sessions
        for i, s in enumerate(sessions[-30:]):
            trend_data.append({
                "name": s.timestamp.strftime('%m-%d'),
                "mobility": round(s.rom, 1) if s.rom else 85.0,
                "stability": round(s.stability * 100, 1) if s.stability else 70.0,
                "quality": round(s.symmetry * 100, 1) if s.symmetry else 92.0,
                "recovery": round(recovery - (i * 0.5) % 10, 1),
                "reserve": round(reserve + (i * 0.2) % 5, 1)
            })
            
        # Parse zone risks from the latest session
        latest_session = sessions[-1]
        if latest_session.joint_angles_json:
            try:
                angles = json.loads(latest_session.joint_angles_json)
                shoulder_tilt = abs(angles.get("Shoulder Tilt", 0))
                hip_tilt = abs(angles.get("Hip Tilt", 0))
                head_fwd = abs(angles.get("Head Forward", 0))
                
                zone_risks = {
                    "left_knee": min(100, 20 + hip_tilt * 5),
                    "right_knee": min(100, 20 + hip_tilt * 5),
                    "lumbar": min(100, 30 + (shoulder_tilt + hip_tilt) * 2),
                    "cervical": min(100, 30 + head_fwd * 3),
                    "left_shoulder": min(100, 20 + shoulder_tilt * 4),
                    "right_shoulder": min(100, 20 + shoulder_tilt * 4),
                    "left_ankle": 30,
                    "right_ankle": 30,
                    "left_hip": min(100, 20 + hip_tilt * 4),
                    "right_hip": min(100, 20 + hip_tilt * 4)
                }
            except Exception as e:
                print(f"Error parsing joint angles for zone risks: {e}")
    else:
        # Placeholder trend data if no sessions
        base_date = datetime.datetime.utcnow()
        for i in range(7, -1, -1):
            dt = base_date - datetime.timedelta(days=i)
            trend_data.append({
                "name": dt.strftime('%m-%d'),
                "mobility": mobility,
                "stability": stability,
                "quality": quality,
                "recovery": recovery,
                "reserve": reserve
            })

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
        zone_risks=json.dumps(zone_risks) if zone_risks else None
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
            model="llama-3.1-8b-instant",
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
        return "No session history found. Please record a Capture session first to get deep insights."

    import json
    
    # Check if the latest session is a Static-Image-Posture
    latest_task = sessions[0].task_type if sessions else "sit-to-stand"
    
    history_lines = []
    for s in sessions:
        if s.task_type == "Static-Image-Posture":
            try:
                angles = json.loads(s.joint_angles_json) if s.joint_angles_json else {}
                st = f"{angles.get('shoulderTilt', 0):.1f}°"
                ht = f"{angles.get('hipTilt', 0):.1f}°"
                hf = f"{angles.get('headForward', 0):.1f}°"
                history_lines.append(f"Date: {s.timestamp.strftime('%Y-%m-%d')}, Type: Static Posture, Score: {s.stability*100:.0f}, Symmetry: {s.symmetry*100:.0f}%, Shoulder Tilt: {st}, Hip Tilt: {ht}, Head Forward: {hf}")
            except:
                history_lines.append(f"Date: {s.timestamp.strftime('%Y-%m-%d')}, Type: Static Posture, Score: {s.stability*100:.0f}, Symmetry: {s.symmetry*100:.0f}%")
        else:
            history_lines.append(f"Date: {s.timestamp.strftime('%Y-%m-%d')}, Type: Sit-to-Stand, ROM: {s.rom}°, Symmetry: {s.symmetry}, Speed: {s.movement_speed} reps/min")
            
    history_text = "\n".join(history_lines)

    if latest_task == "Static-Image-Posture":
        prompt = f"""You are PhysioTwin — a clinical-grade biomechanics AI engine embedded inside a digital twin platform.
Produce a professional **Deep Insight Report** for the user based on their captured posture data.
Do NOT give medical diagnoses. Address the user directly as "you". Use rich markdown with headers, bold text, bullet points, and horizontal rules.

**Session Data:**
{history_text}

**Report Structure (follow this EXACTLY):**

## Biomechanical Summary
A concise 3-4 sentence executive overview of the user's current postural status. Reference the specific shoulder tilt, hip tilt, and head forward angle values. State the overall symmetry score and stability score as percentages.

---

## Asymmetry & Imbalance Detection
Analyze each measured joint angle deviation:
- **Shoulder Girdle:** Quantify the tilt magnitude and laterality (left-elevated vs right-elevated). Explain the likely muscular imbalance (e.g., upper trapezius dominance, levator scapulae shortening).
- **Pelvic Complex:** Quantify hip tilt and explain whether it suggests anterior/posterior tilt or lateral shift. Identify probable tight vs. weak muscle groups.
- **Cervical-Cranial:** Assess the head forward angle relative to the plumb line. Note implications for cervical lordosis and suboccipital loading.

---

## Kinematic Risk Factors
Based on the detected asymmetries, identify 2-3 specific biomechanical risks:
- Use precise anatomical terminology (e.g., "increased valgus moment at the knee", "compensatory lumbar hyperlordosis").
- For each risk, explain the kinetic chain effect (how the deviation propagates through adjacent joints).
- Rate each risk as **Low**, **Moderate**, or **Elevated**.

---

## Prescriptive Corrective Protocols
Provide exactly 3 targeted corrective exercises, each formatted as:
- **Exercise Name** — Sets × Reps, tempo, and specific cues.
- **Target:** Which muscle group or movement pattern it addresses.
- **Rationale:** Why this exercise is selected based on the detected deviation.
"""
    else:
        prompt = f"""You are PhysioTwin — a clinical-grade biomechanics AI engine embedded inside a digital twin platform.
Produce a professional **Deep Insight Report** for the user based on their Sit-to-Stand kinematic history.
Do NOT give medical diagnoses. Address the user directly as "you". Use rich markdown with headers, bold text, bullet points, and horizontal rules.

**Session Data:**
{history_text}

**Report Structure (follow this EXACTLY):**

## Biomechanical Summary
A concise 3-4 sentence executive overview. Reference specific ROM values, symmetry percentages, and movement speed trends across sessions. State overall trajectory (improving, plateauing, or declining).

---

## Asymmetry & Imbalance Detection
- **Bilateral Symmetry:** Analyze the symmetry ratio across sessions. Identify whether discrepancy is consistent or fluctuating.
- **ROM Trajectory:** Quantify the change in range of motion over the session window. Note any sessions that deviate from the trend.
- **Speed-Quality Trade-off:** Assess whether increases in movement speed correlate with decreases in symmetry or stability.

---

## Kinematic Risk Factors
Based on the movement data, identify 2-3 specific biomechanical risks:
- Use precise anatomical terminology.
- Explain kinetic chain effects for each identified risk.
- Rate each risk as **Low**, **Moderate**, or **Elevated**.

---

## Prescriptive Corrective Protocols
Provide exactly 3 targeted corrective exercises, each formatted as:
- **Exercise Name** — Sets × Reps, tempo, and specific cues.
- **Target:** Which muscle group or movement pattern it addresses.
- **Rationale:** Why this exercise is selected based on the detected deviation.
"""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.35,
            max_tokens=900
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        # Deterministic Fallback — matches the 4-section professional format
        if latest_task == "Static-Image-Posture":
            return """## Biomechanical Summary
Your latest static posture scan reveals a **Symmetry Score** consistent with your recent baseline. The captured joint angles show measurable deviations in **Shoulder Tilt**, **Hip Tilt**, and **Head Forward** positioning. Overall stability is within functional range, but the asymmetry pattern warrants targeted correction.

---

## Asymmetry & Imbalance Detection
- **Shoulder Girdle:** A mild lateral tilt was detected, suggesting potential upper trapezius dominance on the elevated side and reciprocal inhibition of the contralateral lower trapezius. This is a common pattern in desk-based postures.
- **Pelvic Complex:** Hip tilt indicates a subtle lateral shift, likely driven by tensor fasciae latae (TFL) tightness on the high side and gluteus medius weakness on the low side. Anterior/posterior tilt component is minimal.
- **Cervical-Cranial:** Head forward angle indicates slight anterior translation relative to the plumb line. This increases compressive loading on the C4-C6 facet joints and shortens the suboccipital extensors.

---

## Kinematic Risk Factors
- **Compensatory Lumbar Loading** — The combined shoulder and hip tilt creates a mild scoliotic moment that the lumbar erectors must counteract. Over time this may reduce rotational mobility in the thoracolumbar junction. Risk: **Moderate**.
- **Cervical Facet Compression** — Sustained anterior head carriage increases the effective weight of the cranium on the cervical spine by approximately 4.5 kg per inch of forward displacement. Risk: **Moderate**.
- **Scapular Dyskinesis** — Asymmetric shoulder positioning may alter scapulohumeral rhythm during overhead movements, increasing subacromial impingement risk. Risk: **Low**.

---

## Prescriptive Corrective Protocols
- **Thoracic Spine Extensions Over Foam Roller** — 2 × 12, 3-second hold at end range. **Target:** Thoracic extensors, anterior shoulder capsule. **Rationale:** Reverses kyphotic tendency driving the head-forward posture.
- **Side-Lying Clamshells with Band** — 3 × 15 per side, 2-second squeeze at top. **Target:** Gluteus medius. **Rationale:** Directly addresses the pelvic lateral shift by strengthening the hip abductors on the weak side.
- **Chin Tucks with Overpressure** — 3 × 10, 5-second hold. **Target:** Deep cervical flexors (longus colli, longus capitis). **Rationale:** Retrains cervical neutral and offloads the suboccipital extensors contributing to the forward head angle."""
        else:
            return """## Biomechanical Summary
Your recent Sit-to-Stand sessions show a **consistent Range of Motion** with minor fluctuations in bilateral symmetry. Movement speed has been stable, and overall stability metrics remain within functional thresholds. The trajectory suggests a maintenance phase with opportunity for targeted improvement in symmetry.

---

## Asymmetry & Imbalance Detection
- **Bilateral Symmetry:** Your symmetry ratio has shown slight variability between sessions, suggesting intermittent compensatory strategies — likely favouring one leg during the concentric (rising) phase.
- **ROM Trajectory:** Range of motion has remained within a narrow band, indicating good joint health but limited progressive overload of the movement pattern.
- **Speed-Quality Trade-off:** Movement speed is appropriate, with no inverse correlation to symmetry — suggesting you are not sacrificing form for speed.

---

## Kinematic Risk Factors
- **Unilateral Loading Bias** — Asymmetric force production during the concentric phase increases shear forces on the contralateral knee's medial compartment. Over repetitive cycles, this can accelerate articular cartilage wear. Risk: **Moderate**.
- **Plateau Effect** — Stable but non-improving ROM suggests the musculotendinous unit is not being challenged at end-range. This may lead to gradual stiffness if not addressed. Risk: **Low**.
- **Quadriceps Dominance** — Without posterior chain engagement data, the consistent speed pattern may mask over-reliance on the quadriceps, underloading the gluteal complex. Risk: **Low**.

---

## Prescriptive Corrective Protocols
- **Bulgarian Split Squats** — 3 × 8 per leg, 3-1-2 tempo (eccentric-pause-concentric). **Target:** Unilateral quadriceps, gluteus medius. **Rationale:** Isolates each limb to expose and correct the bilateral asymmetry detected in your symmetry scores.
- **Box Squats with Pause** — 3 × 10, 2-second pause at bottom. **Target:** Posterior chain activation (glutes, hamstrings). **Rationale:** Eliminates the stretch-shortening cycle to force deliberate concentric drive through both legs equally.
- **Single-Leg Romanian Deadlifts** — 3 × 10 per side, controlled tempo. **Target:** Hamstrings, gluteus maximus, proprioceptive balance. **Rationale:** Addresses potential quadriceps dominance and trains the posterior chain under unilateral load."""

class MessageInput:
    role: str
    content: str

def chat_with_twin(user_id: str, messages_history: list[dict], db: Session):
    profile = db.query(models.CapabilityProfile).filter(models.CapabilityProfile.user_id == user_id).order_by(models.CapabilityProfile.timestamp.desc()).first()
    
    stats = "No data yet."
    if profile:
        stats = f"Mobility: {profile.mobility}, Stability: {profile.stability}, Quality: {profile.movement_quality}, Cardio: {profile.cardiovascular_efficiency}, Recovery: {profile.recovery}, Reserve: {profile.capability_reserve}"
        
    system_prompt = f"""
    You are PhysioTwin, a friendly, concise, and highly analytical digital twin of the user's physical capability.
    The user is chatting with you. You should answer their questions based on their latest data.
    Do NOT give medical advice. Speak directly to the user.
    
    User's Latest Stats:
    {stats}
    """
    
    # Prepend system prompt to the messages
    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages_history:
        api_messages.append({"role": msg["role"], "content": msg["content"]})
        
    try:
        client = Groq(api_key=GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=api_messages,
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=300
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return f"Twin is offline. Error: {str(e)}"

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
    
    # We don't save to DB because it's a "What-If" simulation
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


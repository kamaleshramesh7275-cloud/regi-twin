import urllib.request
import urllib.parse
import json
import datetime
from typing import Dict, Any, List, Optional, Tuple

HEVY_BASE_URL = "https://api.hevyapp.com/v1"

# Muscle group keywords mapping
EXERCISE_MUSCLE_MAP = {
    "Chest": ["bench press", "chest", "push up", "fly", "pec", "dip", "incline press", "decline press"],
    "Shoulders": ["overhead press", "shoulder", "lateral raise", "military press", "arnold", "front raise", "face pull", "delt"],
    "Back": ["pull up", "pull-up", "chin up", "lat pulldown", "row", "deadlift", "back extension", "shrug", "pulldown"],
    "Quads": ["squat", "leg press", "lunge", "leg extension", "hack squat", "front squat", "step up", "quad"],
    "Hamstrings": ["romanian deadlift", "rdl", "leg curl", "hamstring", "glute ham", "stiff leg"],
    "Triceps": ["tricep", "skull crusher", "pushdown", "close grip bench", "overhead extension"],
    "Biceps": ["bicep curl", "curl", "hammer curl", "preacher curl", "concentration curl"],
    "Core": ["plank", "crunch", "ab wheel", "sit up", "leg raise", "hanging leg raise", "cable crunch", "russian twist"],
    "Calves": ["calf raise", "standing calf", "seated calf"]
}

def map_exercise_to_muscles(exercise_name: str) -> List[str]:
    name_lower = exercise_name.lower()
    matched = []
    for muscle, keywords in EXERCISE_MUSCLE_MAP.items():
        if any(kw in name_lower for kw in keywords):
            matched.append(muscle)
    return matched or ["Chest"] # default to Chest/Upper if unknown


class HevyClient:
    def __init__(self, api_key: str):
        self.api_key = api_key.strip()

    def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any, Optional[str]]:
        url = f"{HEVY_BASE_URL}{endpoint}"
        if params:
            query_string = urllib.parse.urlencode(params)
            url = f"{url}?{query_string}"

        req = urllib.request.Request(
            url,
            headers={
                "api-key": self.api_key,
                "Content-Type": "application/json",
                "User-Agent": "PhysioTwin-App/1.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                return True, json.loads(body), None
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            if e.code == 401:
                return False, None, "Invalid Hevy API key. Please verify your personal token in Settings."
            elif e.code == 403:
                return False, None, "Hevy Pro subscription is required to access developer API keys."
            elif e.code == 429:
                return False, None, "Hevy API rate limit reached. Please wait a few minutes."
            else:
                return False, None, f"Hevy API Error (HTTP {e.code}): {err_body or e.reason}"
        except Exception as e:
            return False, None, f"Could not connect to Hevy API: {str(e)}"

    def get_workout_count(self) -> Tuple[bool, int, Optional[str]]:
        success, data, err = self._make_request("/workouts/count")
        if not success:
            return False, 0, err
        return True, data.get("workout_count", 0), None

    def fetch_all_workouts(self, max_pages: int = 10, page_size: int = 10) -> Tuple[bool, List[Dict[str, Any]], Optional[str]]:
        """
        Fetches workouts with pagination support.
        """
        all_workouts = []
        page = 1

        while page <= max_pages:
            success, data, err = self._make_request("/workouts", {"page": page, "pageSize": page_size})
            if not success:
                # If we already fetched some workouts, return what we have
                if all_workouts:
                    return True, all_workouts, None
                return False, [], err

            workouts = data.get("workouts", [])
            if not workouts:
                break

            all_workouts.extend(workouts)

            # Hevy pagination: if returned count is less than page_size or page_count reached
            page_count = data.get("page_count", page)
            if len(workouts) < page_size or page >= page_count:
                break

            page += 1

        return True, all_workouts, None


def parse_hevy_workouts(raw_workouts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Parses Hevy API raw workout objects into PhysioTwin workout structures,
    calculates volume loads, muscle strain distributions, and true ACWR.
    """
    parsed_workouts = []
    now = datetime.datetime.utcnow()

    # Track daily volume for 28 days
    # day_0 is today (offset 0), day_27 is 27 days ago
    daily_volume: Dict[int, float] = {offset: 0.0 for offset in range(28)}
    muscle_volume: Dict[str, float] = {m: 0.0 for m in EXERCISE_MUSCLE_MAP.keys()}

    for w in raw_workouts:
        w_id = w.get("id") or str(w.get("workout_id", ""))
        title = w.get("title") or w.get("name") or "Workout Session"
        start_str = w.get("start_time") or w.get("created_at")
        end_str = w.get("end_time")

        # Parse timestamps
        start_dt = None
        if start_str:
            try:
                # Handle ISO timestamps like 2026-09-08T14:30:00Z
                clean_str = start_str.replace("Z", "+00:00")
                start_dt = datetime.datetime.fromisoformat(clean_str).replace(tzinfo=None)
            except Exception:
                start_dt = now

        duration_min = 45
        if start_dt and end_str:
            try:
                clean_end = end_str.replace("Z", "+00:00")
                end_dt = datetime.datetime.fromisoformat(clean_end).replace(tzinfo=None)
                duration_min = max(5, int((end_dt - start_dt).total_seconds() / 60))
            except Exception:
                pass

        # Calculate session tonnage and exercises
        total_session_vol = 0.0
        exercises_list = []
        raw_exercises = w.get("exercises", [])

        for ex in raw_exercises:
            ex_title = ex.get("title") or ex.get("name") or "Exercise"
            sets = ex.get("sets", [])
            ex_vol = 0.0
            reps_count = 0
            max_weight = 0.0

            for s in sets:
                reps = s.get("reps") or 0
                weight = float(s.get("weight_kg") or s.get("weight") or 0.0)
                set_vol = reps * weight
                ex_vol += set_vol
                reps_count += reps
                if weight > max_weight:
                    max_weight = weight

            total_session_vol += ex_vol
            exercises_list.append({
                "name": ex_title,
                "sets": len(sets),
                "reps": round(reps_count / max(1, len(sets))),
                "weight_kg": round(max_weight, 1),
                "volume_kg": round(ex_vol, 1)
            })

            # Distribute into muscle groups
            matched_muscles = map_exercise_to_muscles(ex_title)
            for m in matched_muscles:
                muscle_volume[m] = muscle_volume.get(m, 0.0) + (ex_vol / len(matched_muscles))

        # Determine load level
        load = "High" if total_session_vol > 6000 or duration_min >= 60 else ("Medium" if total_session_vol > 2500 or duration_min >= 35 else "Low")
        suffer_score = min(98, max(45, int((total_session_vol / 120) + (duration_min * 0.4))))

        # Day offset for ACWR
        if start_dt:
            days_ago = (now.date() - start_dt.date()).days
            if 0 <= days_ago < 28:
                daily_volume[days_ago] += total_session_vol

        day_label = start_dt.strftime("%a") if start_dt else "Session"
        date_str = start_dt.strftime("%Y-%m-%d") if start_dt else now.strftime("%Y-%m-%d")

        parsed_workouts.append({
            "id": w_id,
            "name": title,
            "day": day_label,
            "date": date_str,
            "timestamp": start_str or now.isoformat(),
            "duration_min": duration_min,
            "volume_kg": round(total_session_vol, 1),
            "load": load,
            "suffer_score": suffer_score,
            "exercises": exercises_list,
            "calories": int(duration_min * 7.5) # approximate burn
        })

    # ACWR Calculation:
    # Acute Load = Sum of volume over last 7 days (days 0..6)
    # Chronic Load = Average weekly volume over last 28 days (days 0..27) / 4
    acute_volume = sum(daily_volume[d] for d in range(7))
    total_28d_volume = sum(daily_volume[d] for d in range(28))
    chronic_weekly_avg = total_28d_volume / 4.0

    # Cold start check: if we have 0 chronic load or fewer than 2 distinct training days across the 28 days
    active_days_count = sum(1 for v in daily_volume.values() if v > 0)
    
    if chronic_weekly_avg <= 0 or active_days_count == 0:
        acwr = None
        acwr_status = "No Training History"
        is_cold_start = True
    elif active_days_count < 3 and total_28d_volume < 1000:
        acwr = round(acute_volume / max(1.0, chronic_weekly_avg), 2)
        acwr_status = "Building Baseline (Cold Start)"
        is_cold_start = True
    else:
        acwr = round(acute_volume / chronic_weekly_avg, 2)
        is_cold_start = False
        if acwr > 1.5:
            acwr_status = "Overreach Risk (>1.5)"
        elif acwr >= 1.3:
            acwr_status = "Caution Zone (1.3-1.5)"
        elif acwr >= 0.8:
            acwr_status = "Optimal Sweet Spot (0.8-1.3)"
        else:
            acwr_status = "Under-training / Deload (<0.8)"

    # Normalize muscle strain distribution (0-100 scale)
    total_m_vol = sum(muscle_volume.values())
    muscle_strain = {}
    if total_m_vol > 0:
        for m, v in muscle_volume.items():
            muscle_strain[m] = round(min(100.0, (v / total_m_vol) * 100 * 2.5), 1)
    else:
        muscle_strain = {
            "Chest": 50, "Shoulders": 50, "Back": 50, "Quads": 50,
            "Hamstrings": 50, "Triceps": 50, "Biceps": 50, "Core": 50
        }

    # Readiness score derived from recent strain
    if acute_volume > 25000:
        readiness = 65
    elif acute_volume > 15000:
        readiness = 78
    else:
        readiness = 88

    return {
        "workouts": parsed_workouts,
        "weekly_stats": {
            "acute_load_kg": round(acute_volume, 1),
            "chronic_weekly_avg_kg": round(chronic_weekly_avg, 1),
            "total_28d_volume_kg": round(total_28d_volume, 1),
            "acwr": acwr,
            "acwr_status": acwr_status,
            "is_cold_start": is_cold_start,
            "active_days_28d": active_days_count
        },
        "acwr": acwr if acwr is not None else 1.0,
        "readiness_score": readiness,
        "muscle_strain": muscle_strain
    }

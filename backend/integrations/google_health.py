import os
import json
import urllib.parse
import datetime
from typing import Dict, Any, List, Optional
import urllib.request
import urllib.error
from dotenv import load_dotenv

from crypto_utils import decrypt_secret, encrypt_secret

load_dotenv()

GOOGLE_HEALTH_CLIENT_ID = os.environ.get("GOOGLE_HEALTH_CLIENT_ID", "")
GOOGLE_HEALTH_CLIENT_SECRET = os.environ.get("GOOGLE_HEALTH_CLIENT_SECRET", "")
DEFAULT_REDIRECT_URI = os.environ.get("GOOGLE_HEALTH_REDIRECT_URI", "http://localhost:8000/oauth/google-health/callback")

# Standard scopes for fitness, activity, and heart rate
SCOPES = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.body.read",
    "openid",
    "email",
    "profile"
]


def get_authorization_url(user_id: str, redirect_uri: Optional[str] = None) -> str:
    """
    Generates the Google OAuth 2.0 consent authorization URL.
    `state` parameter securely carries the user_id.
    """
    client_id = GOOGLE_HEALTH_CLIENT_ID or "mock_client_id_for_dev"
    r_uri = redirect_uri or DEFAULT_REDIRECT_URI
    
    params = {
        "client_id": client_id,
        "redirect_uri": r_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": user_id,
        "include_granted_scopes": "true"
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"


def exchange_code_for_tokens(code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    """
    Exchanges authorization code for access_token and refresh_token.
    """
    r_uri = redirect_uri or DEFAULT_REDIRECT_URI
    token_url = "https://oauth2.googleapis.com/token"
    
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_HEALTH_CLIENT_ID,
        "client_secret": GOOGLE_HEALTH_CLIENT_SECRET,
        "redirect_uri": r_uri,
        "grant_type": "authorization_code"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        # In development/test mode without live credentials, return mock token for testing
        if not GOOGLE_HEALTH_CLIENT_ID or not GOOGLE_HEALTH_CLIENT_SECRET:
            return {
                "access_token": f"mock_gha_access_token_{code}",
                "refresh_token": f"mock_gha_refresh_token_{code}",
                "expires_in": 3600,
                "token_type": "Bearer"
            }
        raise Exception(f"Google OAuth token exchange failed ({e.code}): {err_body}")
    except Exception as e:
        if not GOOGLE_HEALTH_CLIENT_ID or not GOOGLE_HEALTH_CLIENT_SECRET:
            return {
                "access_token": f"mock_gha_access_token_{code}",
                "refresh_token": f"mock_gha_refresh_token_{code}",
                "expires_in": 3600,
                "token_type": "Bearer"
            }
        raise e


def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """
    Uses stored refresh token to obtain a fresh short-lived access token.
    """
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "refresh_token": refresh_token,
        "client_id": GOOGLE_HEALTH_CLIENT_ID,
        "client_secret": GOOGLE_HEALTH_CLIENT_SECRET,
        "grant_type": "refresh_token"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except Exception as e:
        # In sandbox/mock testing without live keys
        if refresh_token.startswith("mock_") or not GOOGLE_HEALTH_CLIENT_SECRET:
            return {
                "access_token": f"refreshed_{refresh_token[:15]}_{int(datetime.datetime.utcnow().timestamp())}",
                "expires_in": 3600,
                "token_type": "Bearer"
            }
        raise Exception(f"Failed to refresh Google Health access token: {e}")


def calculate_session_load(activity: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes TRIMP-style cardiovascular and muscular load from duration and heart rate intensity.
    Load Score = duration_minutes * intensity_factor
    """
    duration_mins = float(activity.get("duration_minutes", 0) or activity.get("duration_mins", 0))
    avg_hr = activity.get("avg_heart_rate") or activity.get("heart_rate")
    activity_type = str(activity.get("activity_type", activity.get("name", "workout"))).lower()
    
    # 1. Determine intensity factor based on HR zones if available
    intensity_zone = "Zone 2 (Moderate)"
    if avg_hr and isinstance(avg_hr, (int, float)) and avg_hr > 0:
        if avg_hr < 110:
            intensity_factor = 1.0
            intensity_zone = "Zone 1 (Light / Recovery)"
        elif avg_hr < 135:
            intensity_factor = 1.3
            intensity_zone = "Zone 2 (Aerobic Base)"
        elif avg_hr < 155:
            intensity_factor = 1.6
            intensity_zone = "Zone 3 (Tempo / Cardiovascular)"
        elif avg_hr < 175:
            intensity_factor = 2.0
            intensity_zone = "Zone 4 (Threshold / Anaerobic)"
        else:
            intensity_factor = 2.5
            intensity_zone = "Zone 5 (Max Effort / Peak)"
    else:
        # Heuristic based on activity type if HR data was not captured
        if any(k in activity_type for k in ["running", "hiit", "sprint", "interval", "crossfit"]):
            intensity_factor = 1.8
            intensity_zone = "Estimated High Intensity"
        elif any(k in activity_type for k in ["cycling", "rowing", "weightlifting", "strength", "swimming", "basketball"]):
            intensity_factor = 1.4
            intensity_zone = "Estimated Moderate Intensity"
        elif any(k in activity_type for k in ["walking", "yoga", "pilates", "stretching", "mobility"]):
            intensity_factor = 1.0
            intensity_zone = "Estimated Light Intensity"
        else:
            intensity_factor = 1.2
            intensity_zone = "Standard Activity"

    load_score = round(duration_mins * intensity_factor, 1)
    
    return {
        "load_score": load_score,
        "intensity_factor": intensity_factor,
        "intensity_zone": intensity_zone,
        "duration_minutes": duration_mins,
        "avg_heart_rate": avg_hr
    }


def calculate_google_health_acwr(activities: List[Dict[str, Any]], reference_date: Optional[datetime.date] = None) -> Dict[str, Any]:
    """
    Calculates Acute:Chronic Workload Ratio (ACWR) from activity load scores over rolling 28 days.
    - Acute Workload = Sum of load over last 7 days
    - Chronic Workload = Weekly average load over last 28 days (Sum 28d / 4.0)
    - ACWR = Acute / Chronic
    """
    if reference_date is None:
        reference_date = datetime.date.today()
    
    acute_cutoff = reference_date - datetime.timedelta(days=7)
    chronic_cutoff = reference_date - datetime.timedelta(days=28)
    
    acute_load = 0.0
    chronic_sum = 0.0
    unique_dates = set()
    
    enriched_activities = []
    
    for act in activities:
        start_time_str = act.get("start_time") or act.get("timestamp") or act.get("date")
        act_date = reference_date
        if start_time_str:
            try:
                if "T" in str(start_time_str):
                    act_date = datetime.datetime.fromisoformat(str(start_time_str).replace("Z", "+00:00")).date()
                else:
                    act_date = datetime.date.fromisoformat(str(start_time_str)[:10])
            except Exception:
                act_date = reference_date
        
        load_meta = calculate_session_load(act)
        enriched_act = {**act, **load_meta, "session_date": act_date.isoformat()}
        enriched_activities.append(enriched_act)
        
        if act_date >= chronic_cutoff:
            unique_dates.add(act_date)
            chronic_sum += load_meta["load_score"]
            if act_date >= acute_cutoff:
                acute_load += load_meta["load_score"]
                
    chronic_load = round(chronic_sum / 4.0, 1)
    acute_load = round(acute_load, 1)
    
    # Cold-start check: If user has < 5 active logged days in history or chronic load is negligible
    is_cold_start = len(unique_dates) < 5 or chronic_load <= 0.0
    
    if chronic_load > 0:
        acwr = round(acute_load / chronic_load, 2)
    else:
        acwr = 1.0 if acute_load > 0 else 0.0
        
    if is_cold_start:
        status = "building_baseline"
        status_label = "Baseline Building (Cold Start)"
    elif acwr < 0.8:
        status = "low"
        status_label = "Under-training / Deload"
    elif acwr <= 1.3:
        status = "optimal"
        status_label = "Optimal (Sweet Spot)"
    elif acwr <= 1.5:
        status = "caution"
        status_label = "Caution (Fatigue / Overuse Risk)"
    else:
        status = "danger"
        status_label = "High Risk (Spike in Acute Workload)"
        
    return {
        "acwr": acwr,
        "acute_load": acute_load,
        "chronic_load": chronic_load,
        "status": status,
        "status_label": status_label,
        "is_cold_start": is_cold_start,
        "active_days_tracked": len(unique_dates),
        "activities": enriched_activities
    }


def fetch_google_health_activities(access_token: str, days: int = 28) -> List[Dict[str, Any]]:
    """
    Fetches activity sessions and aggregated data from Google Health / Fitness REST API.
    """
    now = datetime.datetime.utcnow()
    start_time = now - datetime.timedelta(days=days)
    
    # Check if this is a mock dev token
    if access_token.startswith("mock_") or access_token.startswith("refreshed_mock"):
        # Generate realistic activity history for demonstration
        activities = []
        sample_templates = [
            {"name": "Morning Run", "activity_type": "running", "duration_minutes": 35, "avg_heart_rate": 152, "calories": 380, "muscle_target": ["quadriceps", "calves", "glutes"]},
            {"name": "Upper Body Strength", "activity_type": "weightlifting", "duration_minutes": 45, "avg_heart_rate": 128, "calories": 260, "muscle_target": ["chest", "shoulders", "triceps"]},
            {"name": "HIIT Circuit", "activity_type": "hiit", "duration_minutes": 30, "avg_heart_rate": 164, "calories": 340, "muscle_target": ["full_body", "core"]},
            {"name": "Evening Tempo Cycling", "activity_type": "cycling", "duration_minutes": 40, "avg_heart_rate": 142, "calories": 320, "muscle_target": ["quadriceps", "hamstrings"]},
            {"name": "Recovery Yoga & Mobility", "activity_type": "yoga", "duration_minutes": 25, "avg_heart_rate": 98, "calories": 90, "muscle_target": ["spine", "hips"]}
        ]
        
        for i in range(12):
            tpl = sample_templates[i % len(sample_templates)]
            session_time = (now - datetime.timedelta(days=i * 2 + 1, hours=3)).isoformat() + "Z"
            activities.append({
                "id": f"gha_session_{i+1}",
                "name": tpl["name"],
                "activity_type": tpl["activity_type"],
                "duration_minutes": tpl["duration_minutes"],
                "avg_heart_rate": tpl["avg_heart_rate"],
                "calories": tpl["calories"],
                "start_time": session_time,
                "end_time": (now - datetime.timedelta(days=i * 2 + 1, hours=2, minutes=60-tpl["duration_minutes"])).isoformat() + "Z",
                "source": "Google Health (Fitbit)",
                "muscle_target": tpl["muscle_target"]
            })
        return activities
        
    # Production Google Fitness / Health API call
    url = f"https://www.googleapis.com/fitness/v1/users/me/sessions?startTime={start_time.isoformat()}Z&endTime={now.isoformat()}Z"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw_sessions = data.get("session", [])
            
            parsed_activities = []
            for s in raw_sessions:
                s_start = int(s.get("startTimeMillis", 0)) / 1000.0
                s_end = int(s.get("endTimeMillis", 0)) / 1000.0
                dur_mins = max(1, round((s_end - s_start) / 60.0, 1)) if s_end > s_start else 30
                
                # Activity type mapping from Google Health activityType integer
                act_type_code = s.get("activityType", 0)
                type_name = _map_google_activity_type(act_type_code)
                
                parsed_activities.append({
                    "id": s.get("id", str(s_start)),
                    "name": s.get("name", type_name.capitalize()),
                    "activity_type": type_name,
                    "duration_minutes": dur_mins,
                    "avg_heart_rate": 135,
                    "calories": int(dur_mins * 7.5),
                    "start_time": datetime.datetime.utcfromtimestamp(s_start).isoformat() + "Z",
                    "end_time": datetime.datetime.utcfromtimestamp(s_end).isoformat() + "Z",
                    "source": "Google Health (Fitbit)",
                    "muscle_target": _get_muscle_targets_for_activity(type_name)
                })
            return parsed_activities
    except Exception as e:
        print(f"Error fetching Google Health sessions: {e}")
        return []


def _map_google_activity_type(type_code: int) -> str:
    """Maps Google Fitness activityType integer to string identifier."""
    mapping = {
        8: "running",
        1: "cycling",
        9: "aerobics",
        97: "weightlifting",
        100: "yoga",
        7: "walking",
        80: "swimming",
        58: "rowing",
        114: "hiit",
        25: "elliptical"
    }
    return mapping.get(type_code, "workout")


def _get_muscle_targets_for_activity(activity_type: str) -> List[str]:
    """Provides estimated muscle engagement for activity types."""
    act = activity_type.lower()
    if "run" in act:
        return ["quadriceps", "calves", "glutes", "hamstrings"]
    elif "cycl" in act:
        return ["quadriceps", "calves", "glutes"]
    elif "weight" in act or "strength" in act:
        return ["chest", "back", "shoulders", "biceps", "triceps", "quadriceps"]
    elif "yoga" in act or "pilates" in act:
        return ["core", "spine", "hips", "shoulders"]
    elif "swim" in act:
        return ["lats", "shoulders", "core", "calves"]
    elif "row" in act:
        return ["back", "biceps", "hamstrings", "core"]
    return ["full_body", "core"]

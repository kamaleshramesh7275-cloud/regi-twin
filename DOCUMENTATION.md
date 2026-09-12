# PhysioTwin — Complete Technical Documentation

> **Version:** 0.0.0 · **Stack:** React 19 + FastAPI + SQLite + Groq LLM + MediaPipe  
> **Author:** Kamalesh Ramesh · **Last updated:** August 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Backend](#4-backend)
   - [Technology Stack](#41-technology-stack)
   - [Setup & Running](#42-setup--running)
   - [Database Schema](#43-database-schema)
   - [API Reference](#44-api-reference)
   - [Analytics Engine](#45-analytics-engine)
   - [Synthetic Sensor Generator](#46-synthetic-sensor-generator)
   - [3D Model Generator](#47-3d-model-generator)
5. [Frontend](#5-frontend)
   - [Technology Stack](#51-technology-stack)
   - [Setup & Running](#52-setup--running)
   - [Application Routes](#53-application-routes)
   - [Authentication](#54-authentication)
   - [API Client](#55-api-client)
   - [Pages & Components](#56-pages--components)
6. [Data Flow](#6-data-flow)
7. [Key Concepts & Algorithms](#7-key-concepts--algorithms)
8. [External Integrations](#8-external-integrations)
9. [Tunneling & Deployment](#9-tunneling--deployment)
10. [Environment Variables](#10-environment-variables)
11. [Known Limitations & Future Work](#11-known-limitations--future-work)

---

## 1. Project Overview

**PhysioTwin** is a next-generation **digital twin** platform for physical health monitoring. It builds a living, data-driven model of a user's physical capability using:

- **Computer vision** (MediaPipe Pose) — tracks joints via webcam with no wearables needed
- **Synthetic / real IoT sensors** — simulates or ingests heart rate, SpO2, temperature, and IMU data
- **AI analytics** (Groq Llama 3.1) — generates weekly letters, deep biomechanical insights, and a conversational "twin chat"
- **3D body heatmap** (Three.js) — visualises injury/overuse risk per anatomical zone in real-time
- **What-if simulator** — predicts how a planned activity will deplete recovery and capability reserve

The platform targets **physiotherapists, athletes, and health-conscious individuals** who want actionable, AI-driven feedback on movement quality, recovery, and injury risk.

---

## 2. High-Level Architecture

```
+------------------------------------------------------------------+
|                          USER'S BROWSER                          |
|                                                                  |
|  +--------------+   +--------------+   +--------------------+   |
|  |  React SPA   |   |  MediaPipe   |   |     Three.js 3D    |   |
|  |  (Vite PWA)  |   | Pose (WASM)  |   |  Body Heatmap Model|   |
|  +------+-------+   +------+-------+   +--------------------+   |
|         |                  |                                     |
|         | REST (fetch)      | pose landmarks                     |
+---------|------------------|------------------------------------- +
          |                  |
          v                  v
+------------------------------------------------------------------+
|                    FASTAPI BACKEND  :8000                        |
|                                                                  |
|  +------------+  +--------------+  +------------------------+   |
|  |  /users/   |  | /sessions/   |  |    /analytics/         |   |
|  |  CRUD      |  |  vision      |  |  dashboard, chat,      |   |
|  +------------+  +--------------+  |  simulate, insights    |   |
|                                    +----------+-------------+   |
|  +------------+  +--------------+             |                  |
|  | /sensors/  |  |  /reports/   |             v                  |
|  | synthetic  |  |  analyze     |   +---------------------+     |
|  +------------+  +--------------+   | Groq API (Llama 3.1)|     |
|                                     +---------------------+     |
|  +--------------------------------------------------------+      |
|  |             SQLite  (physiotwin.db)                    |      |
|  |  users, sensor_sessions, vision_sessions, fused        |      |
|  |  capability_profiles, baseline_history, change_points  |      |
|  |  leaderboard, external_app_sessions, twin_notes        |      |
|  +--------------------------------------------------------+      |
+------------------------------------------------------------------+
          |
          v
+--------------------+
|  Firebase Auth     |
|  (Google / Email)  |
+--------------------+
```

**Vision processing** (MediaPipe) runs **entirely in the browser** — no video frames are ever sent to the server. Only computed biomechanical metadata (joint angles, ROM, symmetry, stability scores) is transmitted.

---

## 3. Repository Structure

```
physio-twin/
├── backend/
│   ├── analytics.py          # LLM-powered insight engine
│   ├── database.py           # SQLAlchemy engine + session factory
│   ├── generate_model.py     # Script: generates model.glb via trimesh
│   ├── main.py               # FastAPI app — all routes
│   ├── mock_sensor.py        # Synthetic physiological sensor generator
│   ├── models.py             # SQLAlchemy ORM models
│   ├── physiotwin.db         # SQLite database (auto-created)
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Python virtual environment
│
├── frontend/
│   ├── public/
│   │   └── model.glb         # 3D body mesh (generated by generate_model.py)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Firebase Auth context provider
│   │   ├── components/
│   │   │   └── Sidebar.tsx       # Navigation sidebar
│   │   ├── lib/
│   │   │   └── firebase.ts       # Firebase SDK initialisation
│   │   ├── AchievementsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── App.tsx               # Root component, router
│   │   ├── App.css
│   │   ├── AvatarContext.tsx
│   │   ├── CaptureEngine.tsx     # Core: MediaPipe pose capture engine
│   │   ├── ChatInterface.tsx
│   │   ├── ClinicPage.tsx        # Medical report upload, clinic sharing
│   │   ├── CommunityPage.tsx
│   │   ├── Dashboard.tsx         # Main analytics dashboard
│   │   ├── DemoDashboard.tsx     # Public demo (no auth)
│   │   ├── DummyPages.tsx        # History, Timeline, Insights stubs
│   │   ├── HoloModel3D.tsx       # Three.js 3D body model component
│   │   ├── HoloOverlay.tsx       # AR-style overlay for heatmap
│   │   ├── LeaderboardPage.tsx
│   │   ├── LoginPage.tsx         # Auth: login + register
│   │   ├── MedicationPage.tsx
│   │   ├── MentalReadinessPage.tsx
│   │   ├── NutritionRecovery.tsx # Hevy + HealthifyMe data display
│   │   ├── Onboarding.tsx        # First-time user setup flow
│   │   ├── ProgramsPage.tsx      # Rehab / fitness program tracker
│   │   ├── SettingsPage.tsx
│   │   ├── SimulatorPanel.tsx    # What-if activity simulator
│   │   ├── TwinPage.tsx          # Full Digital Twin view + chat
│   │   ├── VitalsPage.tsx
│   │   ├── WikiPage.tsx
│   │   ├── WorkoutStrain.tsx     # Muscular strain / overuse heatmap
│   │   ├── api.ts                # Typed API client
│   │   ├── firebase.ts           # Re-export barrel
│   │   ├── index.css             # Global styles (Tailwind v4)
│   │   └── main.tsx              # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── vite.config.ts
│   └── .env                     # Firebase config (gitignored)
│
├── tunnel.js                    # Localtunnel / ngrok helper
├── ngrok.txt                    # ngrok auth notes
├── lt.txt                       # Localtunnel notes
├── package.json                 # Root: tunnel.js runner
└── DOCUMENTATION.md             # <- You are here
```

---

## 4. Backend

### 4.1 Technology Stack

| Package | Version | Purpose |
|---|---|---|
| **FastAPI** | latest | Async REST framework |
| **Uvicorn** | latest (standard) | ASGI server |
| **SQLAlchemy** | latest | ORM + query builder |
| **Pydantic** | v2 | Request/response validation |
| **groq** | latest | Groq cloud LLM client |
| **firebase-admin** | latest | (reserved for server-side Firebase operations) |
| **python-multipart** | latest | File upload support |

### 4.2 Setup & Running

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Also install groq (not listed in requirements.txt but used)
pip install groq

# Run the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs are auto-generated at `http://localhost:8000/docs`.

> **Note:** The SQLite database `physiotwin.db` is auto-created on first run by `models.Base.metadata.create_all(bind=engine)`.

### 4.3 Database Schema

All tables live in `physiotwin.db` (SQLite). Primary keys are UUIDs unless noted.

---

#### `users`

Stores user profile and consent data.

| Column | Type | Description |
|---|---|---|
| `user_id` | String (PK) | Firebase Auth UID |
| `email` | String (unique) | User email |
| `age` | Integer (nullable) | Age in years |
| `sex` | String (nullable) | Biological sex |
| `height` | Float (nullable) | Height in cm |
| `weight` | Float (nullable) | Weight in kg |
| `mode` | String | User mode (e.g. `"General Human"`) |
| `goals` | String (nullable) | Comma-separated or JSON goals |
| `consent` | Boolean | Data consent flag |
| `created_at` | DateTime | Registration timestamp |

---

#### `sensor_sessions`

Physiological sensor readings (synthetic or real ESP32).

| Column | Type | Description |
|---|---|---|
| `session_id` | String (PK) | UUID |
| `user_id` | String (FK -> users) | |
| `timestamp` | DateTime | |
| `heart_rate` | Float | BPM |
| `spo2` | Float | Blood oxygen % |
| `temperature` | Float | Skin temperature °C |
| `accel_x/y/z` | Float | IMU accelerometer axes |
| `source` | String | `"synthetic"` or `"esp32"` |
| `sensor_quality` | String | `"High"`, `"Medium"`, or `"Low"` |

---

#### `vision_sessions`

Biomechanical data from a MediaPipe capture session.

| Column | Type | Description |
|---|---|---|
| `session_id` | String (PK) | UUID |
| `user_id` | String (FK -> users) | |
| `timestamp` | DateTime | |
| `task_type` | String | `"sit-to-stand"`, `"standing-posture"`, `"squat-analysis"`, etc. |
| `pose_landmarks_json` | Text | Full MediaPipe landmark array (JSON) |
| `joint_angles_json` | Text | Computed angles dictionary (JSON) |
| `rom` | Float | Range of Motion in degrees |
| `movement_speed` | Float | Reps/min or speed metric |
| `symmetry` | Float | 0.0–1.0 bilateral symmetry |
| `stability` | Float | 0.0–1.0 postural stability |
| `camera_quality` | String | Capture quality descriptor |
| `annotated_image_url` | Text (nullable) | URL to the annotated still frame |

---

#### `fused_sessions`

Links a `sensor_session` with a `vision_session` for multi-modal fusion.

| Column | Type | Description |
|---|---|---|
| `session_id` | String (PK) | UUID |
| `user_id` | String (FK) | |
| `sensor_session_id` | String (FK -> sensor_sessions) | |
| `vision_session_id` | String (FK -> vision_sessions) | |
| `timestamp` | DateTime | |
| `fused_confidence` | String | `"Low"`, `"Medium"`, or `"High"` |

---

#### `capability_profiles`

Computed holistic physical capability score per user session.

| Column | Type | Description |
|---|---|---|
| `id` | String (PK) | UUID |
| `user_id` | String (FK) | |
| `timestamp` | DateTime | |
| `mobility` | Float | 0–100 mobility score |
| `stability` | Float | 0–100 stability score |
| `movement_quality` | Float | 0–100 quality score |
| `cardiovascular_efficiency` | Float | 0–100 cardio score |
| `recovery` | Float | 0–100 recovery score |
| `capability_reserve` | Float | 0–100 reserve score |
| `confidence` | String | `"Low"`, `"Medium"`, or `"High"` |
| `zone_risks` | Text (nullable) | JSON: `{"left_knee": 72, "lumbar": 48, ...}` |
| `trend_data` | Text (nullable) | JSON array of weekly trend data points |

---

#### `baseline_history`

Per-task rolling baseline statistics for anomaly detection.

| Column | Type | Description |
|---|---|---|
| `id` | String (PK) | |
| `user_id` | String (FK) | |
| `task_type` | String | e.g. `"sit-to-stand"` |
| `metric_name` | String | e.g. `"rom"`, `"stability"` |
| `mean` | Float | Rolling mean |
| `std` | Float | Rolling standard deviation |
| `sample_count` | Integer | Number of samples |
| `updated_at` | DateTime | |

---

#### `change_points`

Records detected statistical deviations in a user's metrics.

| Column | Type | Description |
|---|---|---|
| `id` | String (PK) | |
| `user_id` | String (FK) | |
| `metric_name` | String | The affected metric |
| `session_id` | String | The session that triggered detection |
| `detected_at` | DateTime | |
| `classification` | String | `"temporary"` or `"persistent"` |
| `magnitude` | Float | Deviation amount from baseline |

---

#### `leaderboard`

Community fitness scores.

| Column | Type | Description |
|---|---|---|
| `id` | String (PK) | |
| `user_id` | String (FK) | |
| `username` | String | Display name |
| `score` | Integer | Total points |
| `rank_change` | Integer | Position change since last update |
| `updated_at` | DateTime | |

---

#### `external_app_sessions`

Cached data imported from Hevy (workouts) and HealthifyMe (nutrition).

| Column | Type | Description |
|---|---|---|
| `id` | String (PK) | |
| `user_id` | String (FK) | |
| `app_name` | String | `"Hevy"` or `"HealthifyMe"` |
| `session_data` | Text | JSON blob with full workout or nutrition detail |
| `timestamp` | DateTime | |

---

#### `twin_notes`

LLM-generated notes and system flags attached to a user's twin.

| Column | Type | Description |
|---|---|---|
| `id` | String (PK) | |
| `user_id` | String (FK) | |
| `timestamp` | DateTime | |
| `type` | String | `"weekly_letter"`, `"user_note"`, or `"system_flag"` |
| `content` | Text | Full text content |

---

### 4.4 API Reference

Base URL: `http://localhost:8000`

---

#### `GET /`
Health check.

**Response:**
```json
{ "message": "PhysioTwin API is running" }
```

---

#### `POST /users/`
Create a new user profile.

**Request Body:**
```json
{
  "user_id": "firebase-uid-string",
  "email": "user@example.com",
  "age": 28,
  "sex": "male",
  "height": 175.0,
  "weight": 72.5,
  "mode": "General Human",
  "goals": "Weight loss, Injury recovery",
  "consent": true
}
```

**Response:** The created user object.  
**Errors:** `400` if user already exists.

---

#### `GET /users/{user_id}`
Fetch a user profile by Firebase UID.

**Response:** The user object.  
**Errors:** `404` if not found.

---

#### `GET /sensors/synthetic?exertion={0.0..1.0}`
Fetch a single simulated sensor data frame.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `exertion` | float | `0.0` | Exertion level from rest (0) to max (1) |

**Response:**
```json
{
  "timestamp": 1722432000000,
  "heart_rate": 72.3,
  "spo2": 97.8,
  "temperature": 36.52,
  "accel_x": 0.14,
  "accel_y": -0.08,
  "accel_z": 9.82,
  "source": "synthetic"
}
```

---

#### `POST /sessions/vision`
Ingest a completed vision session. **Automatically triggers capability profile recomputation.**

**Request Body:**
```json
{
  "user_id": "firebase-uid",
  "task_type": "sit-to-stand",
  "pose_landmarks_json": "[{...}]",
  "joint_angles_json": "{\"Shoulder Tilt\": 2.3}",
  "rom": 88.5,
  "movement_speed": 12.4,
  "symmetry": 0.92,
  "stability": 0.87,
  "camera_quality": "Good",
  "annotated_image_url": null
}
```

**Response:**
```json
{ "message": "Vision session logged and profile updated" }
```

---

#### `GET /sessions/history/{user_id}`
Retrieve all vision sessions for a user (most recent first).

**Response:** Array of session objects including `timestamp`, `task_type`, `rom`, `symmetry`, `stability`, `movement_speed`, `annotated_image_url`.

---

#### `GET /analytics/dashboard/{user_id}`
Returns the latest computed `CapabilityProfile` for the dashboard.

**Response:**
```json
{
  "mobility": 85.0,
  "stability": 70.0,
  "quality": 92.0,
  "cardio": 78.0,
  "recovery": 88.0,
  "reserve": 55.0,
  "confidence": "High",
  "change_point_alert": "Deterioration detected in stability over last 3 sessions.",
  "zone_risks": {
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
  },
  "trend_data": [
    { "name": "W1", "mobility": 74, "stability": 72 },
    ...
  ]
}
```

If no profile exists, returns default values with `confidence: "Low"`.

---

#### `POST /analytics/weekly-letter/{user_id}`
Generates a personalised AI weekly summary using Groq (Llama 3.1-8b-instant).

**Response:**
```json
{ "letter": "Your week was marked by strong mobility gains..." }
```

---

#### `POST /analytics/deep-insights/{user_id}`
Generates a detailed clinical-grade biomechanical report using Groq.

**Response:**
```json
{ "insights": "## Biomechanical Summary\n..." }
```

The report is formatted in Markdown with four sections:
1. Biomechanical Summary
2. Asymmetry & Imbalance Detection
3. Kinematic Risk Factors
4. Prescriptive Corrective Protocols

---

#### `POST /analytics/chat/{user_id}`
Chat with the digital twin using conversational context.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Why is my stability dropping?" }
  ]
}
```

**Response:**
```json
{ "response": "Your stability score has been influenced by..." }
```

The system prepends a context-aware system prompt with the user's latest stats to every chat call.

---

#### `POST /analytics/simulate/{user_id}`
Simulate the impact of a planned activity on recovery and reserve. **Does not persist to the database.**

**Request Body:**
```json
{
  "activity_type": "running",
  "duration_mins": 45,
  "intensity": "Hard"
}
```

**Response:**
```json
{
  "original": { "reserve": 55.0, "recovery": 88.0 },
  "simulated": { "reserve": 1.0, "recovery": 61.0 },
  "cost": 54.0
}
```

Supported activity types: `running`, `weightlifting`, `yoga`, and a generic fallback.

---

#### `POST /analytics/dynamic-risk`
Calculates updated zone risk scores based on external fitness data (Hevy workouts + Nutritionix nutrition).

**Request Body:**
```json
{
  "base_risk": { "lumbar": 48, "left_knee": 72 },
  "fit_data": {
    "workouts": [{ "name": "Leg Day (Heavy)", "load": "High" }],
    "nutrition": { "protein": "High" }
  }
}
```

**Response:** Updated risk map with adjusted zone values.

---

#### `POST /users/{user_id}/integrations/hevy`
Securely saves the user's personal Hevy API key (Hevy Pro), validating it against `https://api.hevyapp.com/v1/workouts` and storing it encrypted with AES-128-CBC / Fernet (`cryptography.fernet.Fernet`).

**Request Body:**
```json
{ "api_key": "hevy_api_..." }
```

**Response:**
```json
{ "status": "success", "message": "Hevy API key validated and securely connected" }
```

---

#### `DELETE /users/{user_id}/integrations/hevy`
Disconnects the Hevy integration and wipes the encrypted API key.

---

#### `GET /users/{user_id}/integrations/strava/authorize`
Generates the official Strava OAuth 2.0 authorization URL (`scope=read,activity:read_all`) for athlete activity, heart-rate, and suffer score data access.

**Response:**
```json
{ "url": "https://www.strava.com/oauth/authorize?client_id=...&scope=read,activity:read_all&state=usr_123", "user_id": "usr_123" }
```

---

#### `GET /oauth/strava/callback`
OAuth 2.0 callback handler that exchanges the authorization code for an access token and refresh token, symmetrically encrypts the refresh token at rest using AES-128-CBC / Fernet (`STRAVA_TOKEN_ENCRYPTION_SECRET`), fetches the initial 28 days of activity sessions, and redirects the user back to `/settings?strava_connected=true`.

---

#### `DELETE /users/{user_id}/integrations/strava`
Revokes and clears the stored Strava encrypted refresh token and cached sessions for the user.

---

#### `POST /integrations/strava/sync/{user_id}`
Triggers an on-demand live sync of the user's running, cycling, swimming, and workout sessions from Strava API v3 (`https://www.strava.com/api/v3/athlete/activities`), computes Suffer Score and TRIMP-style training load scores ($(\text{duration} \times \text{intensity}) + \text{elevation bonus}$), calculates rolling ACWR, and caches the results.

---

#### `GET /users/{user_id}/integrations/google-health/authorize`
Generates the Google OAuth 2.0 authorization URL for `health.googleapis.com` (Fitbit) activity and heart-rate data access.

**Response:**
```json
{ "url": "https://accounts.google.com/o/oauth2/v2/auth?...", "user_id": "usr_123" }
```

---

#### `GET /oauth/google-health/callback`
OAuth 2.0 redirect handler that exchanges the authorization code for an access token and refresh token, symmetrically encrypts the refresh token at rest using AES-128-CBC / Fernet (`GHA_TOKEN_ENCRYPTION_SECRET`), fetches the initial 28 days of activity sessions, and redirects the user back to `/settings`.

---

#### `DELETE /users/{user_id}/integrations/google-health`
Revokes and clears the stored Google Health encrypted tokens for the user.

---

#### `POST /integrations/google-health/sync/{user_id}`
Triggers an on-demand live sync of the user's exercise and cardiovascular activity sessions from Google Health API, calculates duration $\times$ heart-rate intensity load scores, computes true ACWR, and caches the result.

---

#### `GET /users/{user_id}/integrations/status`
Returns connection status of external integrations. **Never echoes raw API keys or tokens.**

**Response:**
```json
{
  "strava": true,
  "google_health": true,
  "hevy": true,
  "nutritionix_enabled": true
}
```


---

#### `POST /integrations/hevy/sync/{user_id}`
Triggers an on-demand live fetch of the user's workouts from Hevy API (`api.hevyapp.com/v1/workouts`), computes ACWR, and caches the result.

---

#### `POST /nutrition/log/{user_id}`
Parses a natural-language food description (e.g. `"2 scrambled eggs, 1 toast, 1 black coffee"`) via Nutritionix Natural Nutrients API (`trackapi.nutritionix.com/v2/natural/nutrients`) or offline NLP fallback. Persists calories, macros, and micronutrients (iron, calcium, magnesium, potassium, vitamin D, zinc, B12).

**Request Body:**
```json
{
  "text": "1 bowl oatmeal with blueberries and 1 scoop whey protein",
  "meal_type": "breakfast",
  "logged_at": "2026-09-10T08:30:00"
}
```

---

#### `GET /nutrition/daily/{user_id}?date=YYYY-MM-DD`
Retrieves daily total calories, macros, micronutrients, and individual food log items for a specific date.

---

#### `GET /nutrition/week/{user_id}`
Returns a 7-day rollup of daily nutrition data, food quality score, and weekly macro averages.

---

#### `GET /analytics/external-apps/{user_id}`
Retrieves synced Hevy workouts and Nutritionix nutrition logs. If Hevy is connected, fetches live data with 20-minute caching; if not connected, returns an honest empty state (`is_connected: false`) without silent mock fallbacks.

---

#### `GET /analytics/leaderboard`
Returns the leaderboard sorted by score. Seeds 5 default users if empty.

**Response:**
```json
[
  { "username": "AlexChen", "score": 940, "rank_change": 1 },
  { "username": "SarahJ", "score": 890, "rank_change": 0 }
]
```

---

#### `POST /reports/analyze/{user_id}`
Uploads a medical report file (PDF, image, etc.) for AI analysis.

**Request:** `multipart/form-data` with `file` field.

**Response:**
```json
{
  "status": "success",
  "filename": "mri_report.pdf",
  "finding": {
    "zone": "left_knee",
    "condition": "Grade 2 Meniscus Tear",
    "severity": 85,
    "recommendation": "Avoid high-impact axial loading. Prescribe stabilization protocol."
  }
}
```

> **Note:** The current implementation returns a **mocked diagnosis** to demonstrate the risk-update flow. The finding also updates the user's zone risk for `left_knee` in the database.

---

### 4.5 Analytics Engine

`analytics.py` contains four core functions:

#### `compute_capability_profile(user_id, db)`
Called automatically after every vision session is ingested.

**Algorithm:**
1. Queries all vision sessions for the user ordered by timestamp.
2. Computes core metrics from the **most recent 5 sessions**:
   - `mobility` = mean ROM across recent sessions
   - `stability` = mean stability score × 100
   - `movement_quality` = mean symmetry score × 100
3. Generates `trend_data` from the **last 30 sessions** (formatted by date).
4. Computes `zone_risks` from the **latest session's joint angles**:
   - Uses `Shoulder Tilt`, `Hip Tilt`, and `Head Forward` angles to calculate per-zone risk scores
   - Formula example: `left_knee = min(100, 20 + hip_tilt * 5)`
5. Adjusts `recovery` and `capability_reserve` based on **external app data** (Hevy heavy workout count and HealthifyMe protein status).
6. Sets `confidence`: `"High"` if >= 3 sessions, `"Medium"` if 1-2, `"Low"` if none.
7. Creates a `ChangePoint` record if stability < 60 and session count >= 3.
8. Saves the new `CapabilityProfile` to the database.

#### `generate_weekly_letter(user_id, db)`
- Fetches the latest capability profile.
- Constructs a prompt instructing Llama 3.1 to write a 2-3 paragraph supportive summary.
- Model: `llama-3.1-8b-instant`, temp `0.7`, max `300` tokens.
- Saves result as a `TwinNote` of type `"weekly_letter"`.

#### `generate_deep_insights(user_id, db)`
- Fetches the last 10 vision sessions.
- Detects whether the latest session was a `"Static-Image-Posture"` or `"sit-to-stand"` and selects the appropriate structured Markdown prompt.
- Model: `llama-3.1-8b-instant`, temp `0.35`, max `900` tokens.
- Includes deterministic **offline fallback** reports if the Groq API is unavailable.

#### `chat_with_twin(user_id, messages_history, db)`
- Fetches the latest capability profile and injects stats into a system prompt.
- Appends the user's full conversation history.
- Returns the LLM response (max 300 tokens).

#### `simulate_activity(user_id, activity_type, duration_mins, intensity, db)`
- Fetches current profile.
- Applies heuristic cost functions:

| Activity | Light | Moderate | Hard |
|---|---|---|---|
| Running | 0.5/min | 0.8/min | 1.2/min |
| Weightlifting | 0.4/min | 0.7/min | 1.0/min |
| Yoga | 0.2/min | 0.2/min | 0.2/min |
| Other | 0.5/min | 0.5/min | 0.5/min |

- `new_reserve = max(0, reserve - cost)`
- `new_recovery = max(0, recovery - cost * 0.5)`
- **Does not persist** — purely a "What-If" response.

---

### 4.6 Synthetic Sensor Generator

`mock_sensor.py` — `SyntheticSensorGenerator` class

Generates physiologically plausible sensor data with exertion-response modelling:

| Signal | Rest (exertion=0) | Max (exertion=1) | Noise per frame |
|---|---|---|---|
| Heart Rate | ~60 BPM | ~160 BPM | ±1 BPM |
| SpO2 | ~98% | ~95% | ±0.2% |
| Temperature | ~36.5°C | ~38.0°C | ±0.05°C |
| Accel X/Y | ~0 g | ±2 g (sinusoidal) | ±0.1 g |
| Accel Z | ~9.81 m/s² | varies (sinusoidal) | ±0.1 |

- Uses a **first-order lag filter** (`current += (target - current) * factor`) for realistic physiological response delay.
- IMU uses sinusoidal patterns simulating body movement.
- All values are bounded to physiological safe ranges.

---

### 4.7 3D Base Models

The application uses realistic rigged, skinned humanoid `.glb` models instead of the deprecated procedural box-mesh generator. The base models are hosted statically:

- `frontend/public/models/avatar_male.glb`
- `frontend/public/models/avatar_female.glb`

The models must contain a standard humanoid rig (e.g., Mixamo or Ready Player Me skeletons). The application uses a `ZONE_TO_BONE` lookup table in `HoloModel3D.tsx` to map the 20 anatomical zones (e.g., `left_knee`) to the corresponding bone world position to dynamically render the additive strain heatmap on top of the realistic skin.

> **Note:** The old procedural box-mesh script `backend/generate_model.py` is kept for reference but its output is deprecated. Ensure you use models with licenses permitting your intended use (e.g., CC-BY or Mixamo's base characters).

---

## 5. Frontend

### 5.1 Technology Stack

| Package | Version | Purpose |
|---|---|---|
| **React** | 19.2 | UI framework |
| **Vite** | 8.2 | Build tool + dev server |
| **TypeScript** | 6.0 | Type safety |
| **Tailwind CSS** | 4.3 | Utility-first styling |
| **Wouter** | 3.10 | Lightweight client-side router |
| **Three.js / React Three Fiber** | 0.185 / 9.7 | 3D rendering |
| **@mediapipe/tasks-vision** | 1.0.1 | On-device pose estimation |
| **Recharts** | 3.10 | Charts and analytics visualisation |
| **Framer Motion** | 12.43 | Animations |
| **Firebase** | 12.17 | Authentication |
| **React Hook Form + Zod** | 7.84 / 3.25 | Form handling and validation |
| **TanStack Query** | 5.101 | Server state management |
| **Lucide React** | 1.28 | Icon library |
| **D3.js** | 7.9 | Advanced data visualisation |

### 5.2 Setup & Running

```bash
cd frontend

# Install dependencies
npm install

# Run development server (HTTPS enabled by basicSsl plugin)
npm run dev
```

The dev server runs at `https://localhost:5173` (HTTPS is required for webcam access via `getUserMedia`).

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

> **HTTPS note:** `@vitejs/plugin-basic-ssl` automatically provisions a self-signed certificate so the browser grants webcam permissions during development.

### 5.3 Application Routes

All routes are defined in `App.tsx` using Wouter's `<Switch>` and `<Route>`.

| Path | Component | Auth Required | Description |
|---|---|---|---|
| `/` | `LandingPage` | No | Marketing landing page |
| `/login` | `LoginPage` | No | Login form |
| `/register` | `LoginPage` | No | Registration form (same component) |
| `/onboarding` | `Onboarding` | No | First-time user profile setup |
| `/capture` | `CaptureEngine` | No | MediaPipe capture engine |
| `/demo` | `DemoDashboard` | No | Demo dashboard (no auth) |
| `/dashboard` | `Dashboard` | **Yes** | Main analytics dashboard |
| `/twin` | `TwinPage` | **Yes** | Full Digital Twin 3D view + chat |
| `/history` | `TwinPage` | **Yes** | Session history view |
| `/projection` | `TwinPage` | **Yes** | Future projection view |
| `/leaderboard` | `LeaderboardPage` | **Yes** | Community leaderboard |
| `/nutrition-recovery` | `NutritionRecovery` | **Yes** | Hevy + HealthifyMe data |
| `/muscular-strain` | `WorkoutStrain` | **Yes** | Workout overuse / strain heatmap |
| `/timeline` | `TimelinePage` | **Yes** | Session timeline (stub) |
| `/insights` | `InsightsPage` | **Yes** | Insights page (stub) |
| `/settings` | `SettingsPage` | **Yes** | User settings |
| `/programs` | `ProgramsPage` | **Yes** | Rehab / fitness programs |
| `/analytics` | `AnalyticsPage` | **Yes** | Advanced analytics page |
| `/community` | `CommunityPage` | **Yes** | Community feed |
| `/clinic` | `ClinicPage` | **Yes** | Clinic data sharing + report upload |
| `/meds` | `MedicationPage` | **Yes** | Medication tracker |
| `/vitals` | `VitalsPage` | **Yes** | Vitals monitoring |
| `/readiness` | `MentalReadinessPage` | **Yes** | Mental readiness assessment |
| `/wiki` | `WikiPage` | **Yes** | Knowledge base |
| `/achievements` | `AchievementsPage` | **Yes** | Gamification achievements |

**Protected routes** use a `<ProtectedRoute>` wrapper that:
1. Checks `useAuth()` for a logged-in user.
2. Redirects to `/login` if unauthenticated.
3. Shows a loading screen while Firebase resolves auth state.

**Auto-redirect:** If the user lands on `/` while already authenticated, they are automatically redirected to `/dashboard`.

### 5.4 Authentication

Authentication is handled via **Firebase Auth** (`src/context/AuthContext.tsx`).

```typescript
interface AuthContextType {
  user: User | null;               // Firebase User object
  googleFitToken: string | null;   // Google OAuth access token (for future Google Fit)
  loading: boolean;                // Auth state resolution in progress
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Available auth methods:**
- **Google Sign-In** — popup-based OAuth. The access token is stored in `localStorage` as `googleFitToken` for potential Google Fit API integration.
- **Email/Password** — `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`.

The `AuthProvider` wraps the entire app. `useAuth()` is the consumption hook — throws if used outside the provider.

### 5.5 API Client

`src/api.ts` exports a typed `api` object with all backend calls.

All requests:
- Are routed to `http://{window.location.hostname}:8000` (automatically picks up the host, so local dev and tunnelled URLs work without config changes).
- Use a `fetchWithTimeout` wrapper with a **default 10-second timeout** (configurable per call).
- Throw an `Error` on non-OK responses.

| Method | Endpoint | Description |
|---|---|---|
| `getDashboard(userId)` | `GET /analytics/dashboard/{userId}` | Fetch capability profile |
| `getWeeklyLetter(userId)` | `POST /analytics/weekly-letter/{userId}` | Generate AI summary |
| `submitVisionSession(data)` | `POST /sessions/vision` | Ingest capture session |
| `getSessionHistory(userId)` | `GET /sessions/history/{userId}` | Fetch past sessions |
| `getDeepInsights(userId)` | `POST /analytics/deep-insights/{userId}` | Biomechanical report (15s timeout) |
| `uploadMedicalReport(userId, file)` | `POST /reports/analyze/{userId}` | Upload report file |
| `chatWithTwin(userId, messages)` | `POST /analytics/chat/{userId}` | LLM chat |
| `simulateActivity(userId, data)` | `POST /analytics/simulate/{userId}` | What-if simulation |
| `getLeaderboard()` | `GET /analytics/leaderboard` | Community scores |
| `getExternalApps(userId)` | `GET /analytics/external-apps/{userId}` | Fitness app data |
| `calculateDynamicRisk(baseRisk, fitData)` | `POST /analytics/dynamic-risk` | Risk adjustment |
| `syncExternalApps(userId, workouts, nutrition)` | `POST /analytics/external-apps/{userId}` | Sync external data |

### 5.6 Pages & Components

---

#### `CaptureEngine.tsx` — Core Vision Engine

The largest frontend component and the heart of the platform. It implements a multi-stage UI wizard for biomechanical assessments and converts standard camera feeds into a 60 FPS 3D kinematic analysis suite.

**Capture Modes:**

| Mode | Description | Key Biomechanical Metrics |
|---|---|---|
| `sit-to-stand` | Repetition counter, concentric/eccentric speed, ROM | Min/max knee angle, bilateral symmetry %, rep duration |
| `standing-posture` | Static posture hold & plumb line alignment | Shoulder tilt (°), hip tilt (°), forward head offset (px/cm) |
| `squat-analysis` | Deep squat kinematic breakdown | Knee valgus collapse (θ_valgus), lumbar flexion ("butt wink") |
| `gait-analysis` | 15-second gait assessment | Step cadence (steps/min), stride width, dynamic hip drop |
| `medical-report` | Upload clinical PDFs, MRIs, or doctor notes | Tesseract OCR scan parsing mapped to twin timeline |
| `static-image` | Upload static posture photo for analysis | Static 33-landmark 3D coordinate extractions |

**Exhaustive Data Outputs from Vision Capture:**
1. **33 3D Spatial Landmarks**: Extracted in real time via MediaPipe Tasks Vision (`pose_landmarker_heavy.task`) with WASM acceleration (0 video frames sent to server).
2. **Kinematic & Biomechanical Metrics**:
   - Knee Valgus/Varus Collapse Angle: $\theta_{valgus} = |\text{arctan2}(y_{knee}-y_{hip}, x_{knee}-x_{hip}) - \text{arctan2}(y_{ankle}-y_{knee}, x_{ankle}-x_{knee})|$
   - Bilateral Coronal Symmetry: $S_{bilateral} = 100 \times \left(1 - \frac{|\theta_L - \theta_R|}{\max(\theta_L, \theta_R)}\right)$
   - Range of Motion (ROM): Degrees of active angular excursion across repetitions.
   - Plumb Line Deviations: Lateral shoulder tilt, pelvic tilt, and cranial forward posture offset.
   - Gait Mechanics: Step cadence, stride width symmetry, and Trendelenburg dynamic hip drop ($>5^\circ$).
3. **Performance & Exertion Telemetry**:
   - Repetition counter with concentric/eccentric phase breakdown.
   - Movement speed and rep tempo.
   - Postural Stability Score ($S_{stability}$) measuring center-of-mass sway variance ($\sigma^2_{CoM}$).
   - Micro-tremor fatigue onset calculation.
4. **Digital Twin Capability Profile & Risk Updates**:
   - Recomputes 6D Capability Vector: `[Mobility, Stability, Quality, Cardiovascular, Recovery, Reserve]`.
   - Updates Anatomical Zone Risk Scores: Knee Risk ($Z_{knee}$), Lumbar Risk ($Z_{lumbar}$), Cervical Risk ($Z_{cervical}$), Shoulder Risk ($Z_{shoulder}$).
5. **Real-time Diagnostic & Coaching Outputs**:
   - **Annotated Skeleton Overlay Canvas**: Green/Amber/Red colored landmark connectors.
   - **Speech Synthesis Audio Cues**: Immediate voice feedback ("Push your knees out", "Stabilize your hips").
   - **Groq Llama 3.1 LLM Deep Insights**: Automated clinical root-cause analysis and corrective exercise prescription.
   - **IndexedDB Local Storage**: Raw session blobs stored locally in browser IndexedDB for offline video review.

**Advanced Biomechanical Sub-Components:**

- **Bilateral Symmetry Radar (`BilateralSymmetryRadar.tsx`)**: Real-time side-by-side limb angle & velocity disparity tracking across contralateral joints (hip extension, knee flexion, ankle dorsiflexion, valgus deviation). Calculates limb imbalance index: `Imbalance % = (|θ_L - θ_R| / max(θ_L, θ_R)) * 100`. Scores >12% trigger imbalance alerts.
- **Ground Reaction Force Estimator (`GRFEstimatorPanel.tsx`)**: Camera-derived vertical ground reaction force ($F_v = m \cdot (g + a_y)$) in Newtons ($N$) and Bodyweight multiples ($BW$) calculated from double-differentiation of hip landmark displacement ($a_y = d^2 y_{hip}/dt^2$). Identifies landing impact forces $> 2.5x BW$.
- **Spinal Segmental Segmenting (`SpinalSegmentationView.tsx`)**: 3-zone spinal column articulation tracking across Cervical ($0^\circ-15^\circ$), Thoracic ($20^\circ-40^\circ$), and Lumbar ($15^\circ-25^\circ$) regions, categorizing disc strain status as Optimal, Watch, or Warning.
- **Valgus Velocity Alerts (`ValgusVelocityAlert.tsx`)**: Inward knee collapse angular velocity ($\omega = d\theta_{valgus}/dt$) and acceleration ($\alpha$) tracking. Angular velocities $> 120^\circ/\text{sec}$ trigger high-priority ACL non-contact tear warnings and real-time voice prompts.
- **Form Decay Tracker (`FormDecayTracker.tsx`)**: Rep-by-rep stability decay analysis tracking symmetry %, valgus angle, and rep duration across multi-rep sets. Automatically pinpoints breakdown set limits (e.g. rep where symmetry drops below 75%) to prevent fatigue-induced soft-tissue injury.

**UI Stages:**
`landing -> options -> select -> setup -> countdown -> recording -> processing -> done`

**Session Submission:**
After recording completes, the engine submits a `VisionSession` to the backend via `api.submitVisionSession()`, which triggers automatic capability profile recomputation.

---

#### `TwinPage.tsx` — Digital Twin Hub

The full digital twin experience. Contains:
- **3D body heatmap** — Three.js/R3F model coloured by `zone_risks`
- **Capability radar chart** — Recharts RadarChart with 6 axes (mobility, stability, quality, cardio, recovery, reserve)
- **Session history table** — sortable list of past sessions
- **Twin Chat** — real-time AI conversation powered by `api.chatWithTwin()`
- **What-If Simulator** — `SimulatorPanel` integration
- **Weekly Letter** — AI-generated weekly summary
- **Deep Insights** — clinical biomechanical report rendered as Markdown

---

#### `Dashboard.tsx` — Main Dashboard

Primary logged-in landing page. Aggregates:
- Capability profile scores
- Trend charts (Recharts LineChart)
- Zone risk overview
- Quick links to capture and twin

---

#### `NutritionRecovery.tsx` — Nutrition & Recovery Tracker

Displays real-time and 7-day nutrition rollups with natural language food logging:
- **Natural Language Food Logger** — Powered by Nutritionix (`api.logNutrition()`), parses meals like "2 eggs, toast, coffee" into exact calories, macronutrients, and micronutrients.
- **Nutrition Breakdown** — Daily and 7-day macro (protein, carbs, fat) and micronutrient (iron, calcium, magnesium, potassium, vitamin D, zinc, B12) progress.
- **Dynamic Risk Adjustment** — Feeds daily protein intake into `/analytics/dynamic-risk` to compute recovery score boosts and reduce joint injury risks.

---

#### `WorkoutStrain.tsx` — Muscular Strain & ACWR View

Visualises live Google Health activity sync, muscle group strain distribution, and sports-science Acute:Chronic Workload Ratio (ACWR):
- **Live Google Health (Fitbit) Integration** — Official free Google Cloud OAuth 2.0 integration (replaces deprecated Fitbit Web API). Syncs workouts, duration, and heart-rate intensity zones.
- **Heart-Rate Intensity & Duration Load (TRIMP-Style)** — Measures cardiovascular and muscular training strain via `Duration (min) * Intensity Factor` rather than barbell lift tonnage.
- **True ACWR Gauge** — Calculates acute workload (7-day sum of session loads) vs chronic workload (28-day weekly average load). Identifies "Sweet Spot" (0.8–1.3), "Caution" (1.3–1.5), and "Danger" (>1.5) with cold-start detection.
- **Honest Connection State** — Clear empty state directing users to Settings to connect Google Health for free if not yet connected.

---

#### `ClinicPage.tsx` — Clinic Portal

- **Medical report upload:** File input -> calls `api.uploadMedicalReport()` -> shows AI diagnosis finding with severity score and recommendation.
- **Clinic sharing:** UI for sharing access with a healthcare provider.

---

#### `ProgramsPage.tsx` — Rehab Programs

Tracks structured rehabilitation protocols. Displays:
- Current program name, week, overall progress bar
- Today's session task list with completion status, duration, and clinical rationale for each exercise

Default program shown: **6-Week Knee Stabilization Protocol**.

---

#### `LoginPage.tsx` — Authentication UI

Unified login/register page with:
- Email + password form (React Hook Form + Zod validation)
- Google Sign-In button
- Toggle between Login / Register modes

---

#### `LeaderboardPage.tsx` — Community Ranking

Fetches global peer capability rankings via `api.getLeaderboard()`. Shows rank, username, capability mark, and rank change delta. Clicking any athlete row (`/profile?id=...`) opens their dedicated Athlete Profile.

---

#### `ProfilePage.tsx` — Athlete Profile & Capability Passport

Dedicated user profile hub accessible at `/profile`. Displays:
- **Biometric Grid** — Age, Sex, Height, Weight, Active Twin Mode, Primary Joint Focus, and overall Injury Risk Index (0% baseline for healthy accounts).
- **Motion Capture Activity Feed** — Historical vision capture sessions showing date, duration, bilateral symmetry %, and valgus collapse angle.
- **Connected Integrations Status** — Real-time connection indicators for Strava, Google Health (Fitbit), Hevy, and Nutritionix.
- **Clinical Badges & Milestones** — Display of unlocked trophies and rehabilitation achievements.

---

#### `AchievementsPage.tsx` — Trophy Room & Milestones

Gamified milestone tracking page featuring unlockable clinical badges and progress rings:
- 🏆 **Kinematic Pioneer** (10 Vision Capture Scans)
- 🏆 **Symmetry Master** (95%+ Bilateral Joint Symmetry)
- 🏆 **Mobility Champion** (140° Knee Flexion without Valgus Collapse)
- 🏆 **Clinical Clearance** (0% Injury Risk across all 20 anatomical zones)
- 🏆 **Fueling Consistency** (5 Consecutive Days Macro Logging)

---

#### `ExerciseLibrary.tsx` — Visual Exercise Directory

Comprehensive directory of 1,300+ exercises with animated GIF execution guides, target muscle filters, and equipment selectors. Features a prominent sticky **`← Exit to Dashboard`** header button for fluid mobile/desktop navigation.

---

#### `HoloModel3D.tsx` / `HoloOverlay.tsx` — 3D Visualisation

Components built on `@react-three/fiber` and `@react-three/drei` that:
- Load `model.glb` (the generated body mesh)
- Apply procedural obsidian compression attire shaders and risk-based color gradients (green -> yellow -> red) per mesh segment
- Feature 20 invisible raycasting hit-spheres for joint diagnostic popups

---

#### `useAutoUpdateChecker.ts` — OTA Mobile Auto-Update Pipeline

Client-side React hook that continuously polls `/api/app/version` to check for newer Android APK release builds generated automatically by GitHub Actions (`.github/workflows/build-apk.yml`). Triggers an in-app download banner whenever a new build is detected.

---

## 6. Data Flow

### Capture Session Flow

```
User opens /capture
    |
    v
CaptureEngine mounts -> MediaPipe PoseLandmarker initialised (WASM)
    |
    v
User performs movement -> requestAnimationFrame loop
    |  pose landmarks extracted
    v
Joint angles computed (Shoulder Tilt, Hip Tilt, ROM, Symmetry, Stability)
    |
    v
"Processing" stage (animated steps shown to user)
    |
    v
api.submitVisionSession(data)
    |   POST /sessions/vision
    v
Backend: VisionSession saved to DB
    |
    v
Backend: compute_capability_profile() called
    |  reads last 5 sessions, computes scores, saves CapabilityProfile
    v
Frontend redirects to /dashboard
    |
    v
api.getDashboard(userId)
    |   GET /analytics/dashboard/{userId}
    v
Dashboard renders updated capability scores and zone heatmap
```

### AI Insight Flow

```
User clicks "Generate Deep Insights"
    |
    v
api.getDeepInsights(userId)
    |   POST /analytics/deep-insights/{userId}
    v
Backend: fetches last 10 VisionSessions
    |
    v
Backend: constructs structured Markdown prompt (tailored by task type)
    |
    v
Groq API: llama-3.1-8b-instant -> professional report generated
    |
    v
Frontend: Markdown rendered in the Twin Page
```

---

## 7. Key Concepts & Algorithms

### Capability Score Computation

Six scores, each 0–100:

| Score | Computation |
|---|---|
| **Mobility** | Mean ROM (degrees) across the last 5 sessions |
| **Stability** | Mean raw stability value x 100 across the last 5 sessions |
| **Movement Quality** | Mean raw symmetry value x 100 across the last 5 sessions |
| **Cardiovascular Efficiency** | Fixed at 78.0 (sensor fusion placeholder; not yet dynamic) |
| **Recovery** | 88.0, adjusted: -5 per high-load activity session, +3 per high-protein nutrition day |
| **Capability Reserve** | 55.0, adjusted: -3 per high-load session, +2 per high-protein day |

### Zone Risk Calculation

Computed from the latest session's `joint_angles_json`:

```
left_knee      = min(100, 20 + hip_tilt * 5)
right_knee     = min(100, 20 + hip_tilt * 5)
lumbar         = min(100, 30 + (shoulder_tilt + hip_tilt) * 2)
cervical       = min(100, 30 + head_fwd * 3)
left_shoulder  = min(100, 20 + shoulder_tilt * 4)
right_shoulder = min(100, 20 + shoulder_tilt * 4)
left_ankle     = 30  (static baseline)
right_ankle    = 30  (static baseline)
left_hip       = min(100, 20 + hip_tilt * 4)
right_hip      = min(100, 20 + hip_tilt * 4)
```

### Change Point Detection

A `ChangePoint` is recorded when:
- Session count >= 3 **AND**
- Computed stability < 60

Classification is `"persistent"`. Magnitude = `stability - 70.0`.

### Confidence Levels

| Sessions logged | Confidence label |
|---|---|
| 0 | Low |
| 1–2 | Medium |
| 3 or more | High |

### ACWR (Acute:Chronic Workload Ratio)

Displayed in `WorkoutStrain.tsx` — computed using sports-science training load ($Duration \times Heart\ Rate\ Intensity$):
- **Session Load:** `duration_minutes * intensity_factor` (scaling with HR Zone 1 to 5: 1.0 to 2.5).
- **Acute Workload:** Total training load over the last 7 days (`sum(session_load over 7d)`).
- **Chronic Workload:** Weekly average training load over the last 28 days (`sum(session_load over 28d) / 4.0`).
- **Formula:** `ACWR = Acute Workload / Chronic Workload`
- **Zones:**
  - `< 0.8`: Under-training / Deload
  - `0.8 – 1.3`: **Sweet Spot** (optimal adaptation, minimal injury risk)
  - `1.3 – 1.5`: **Caution Zone** (elevated fatigue / overuse risk)
  - `> 1.5`: **Danger Zone** (high risk of soft tissue / overreach injury)
- **Cold-Start Handling:** If the user has fewer than 14 days of tracked history or chronic load is 0, the UI flags a "Baseline Building (Cold Start)" badge rather than fabricating false spikes.

---

## 8. External Integrations

### Firebase (Authentication)

- **SDK:** Firebase JS SDK v12.17
- **Methods used:** `signInWithPopup`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `onAuthStateChanged`
- **Config:** Stored in `frontend/.env` (gitignored) and loaded in `frontend/src/lib/firebase.ts`

### Groq (LLM)

- **Model:** `llama-3.1-8b-instant` (Meta Llama 3.1 8B, hosted by Groq)
- **API key:** Set via `GROQ_API_KEY` environment variable (hardcoded fallback in `analytics.py`)
- **Used for:** Weekly letters (300 tokens), deep insight reports (900 tokens), and twin chat (300 tokens)
- **Fallback:** Static deterministic reports are returned if the Groq API is unreachable

### Strava (Activities & Suffer Score — Live Integration)

- **API:** Official Strava API v3 (`https://www.strava.com/api/v3/athlete/activities`).
- **Developer App:** Registered at `https://www.strava.com/settings/api` with **Authorization Callback Domain** set to `localhost`.
- **Authentication:** OAuth 2.0 (`scope=read,activity:read_all`) with per-user encrypted refresh tokens stored in SQLite / PostgreSQL via Fernet (`STRAVA_TOKEN_ENCRYPTION_SECRET`). Short-lived access tokens refreshed on demand.
- **Strain & TRIMP Model:**
  - Computes intensity factor:
    `Intensity Factor = 1.0 + min(1.5, suffer_score / 45.0)`
    or heart rate fallback (Zone 1: 1.0, Zone 2: 1.3, Zone 3: 1.6, Zone 4: 2.0, Zone 5: 2.5).
  - Session Load Score:
    `Load Score = (Duration in mins × Intensity Factor) + (Elevation Gain in meters / 100 × 2.0)`
  - Acute:Chronic Workload Ratio (ACWR): Computes 7-day rolling acute load vs. 28-day chronic baseline with cold-start detection.

### Google Health API (Fitbit — Live Integration)

- **API:** Official Google Health API (`health.googleapis.com` / Google Fitness REST API). Direct replacement for legacy Fitbit Web API (shutting down September 2026).
- **Cost & Access:** 100% free for developers and end users. Configured via Google Cloud Console in "Testing" mode (supports up to 100 test users without requiring full OAuth verification).
- **Authentication:** OAuth 2.0 with per-user encrypted refresh token storage using AES-128-CBC via Fernet (`GHA_TOKEN_ENCRYPTION_SECRET`). Short-lived access tokens minted on-demand.
- **Strain Model:** Computes TRIMP-style cardiovascular and muscular load based on activity type, duration, and heart-rate intensity zones (Zone 1: 1.0, Zone 2: 1.3, Zone 3: 1.6, Zone 4: 2.0, Zone 5: 2.5).

### Hevy (Workout App — Live Integration)

- **API:** Official Hevy Public API (`https://api.hevyapp.com/v1/workouts`)
- **Authentication:** Per-user personal API key (requires Hevy Pro, generated at `hevy.com/settings?developer`).
- **Security:** Symmetrically encrypted at rest using AES-128-CBC via Fernet (`cryptography.fernet.Fernet`) with `HEVY_KEY_ENCRYPTION_SECRET`.

### Nutritionix (Nutrition App — Live Integration)

- **API:** Nutritionix Natural Nutrients API (`POST https://trackapi.nutritionix.com/v2/natural/nutrients`)
- **Authentication:** Application-level `NUTRITIONIX_APP_ID` and `NUTRITIONIX_API_KEY`.
- **Capabilities:** Parses natural language descriptions (e.g., *"1 cup Greek yogurt, 20g almonds, 1 scoop protein powder"*) into precise calories, protein, carbs, fat, fiber, and micronutrients (iron, calcium, magnesium, potassium, vitamin D, zinc, B12).
- **Fallback:** Built-in heuristic NLP nutritional database in `nutritionix_client.py` handles parsing seamlessly if external credentials are not supplied.

---

## 9. Tunneling & Deployment

For sharing the dev server with a mobile device or external testers over the internet:

### Localtunnel

```bash
# From root directory
node tunnel.js
```

### ngrok

See `ngrok.txt` for auth token and setup instructions.

### Root `package.json`

```json
{
  "scripts": {
    "tunnel": "node tunnel.js"
  }
}
```

---

## 10. Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

These are loaded in `frontend/src/lib/firebase.ts` via `import.meta.env`.

### Backend (`backend/.env`)

```env
# Groq LLM API
GROQ_API_KEY=gsk_...

# Google Health API (Fitbit) OAuth 2.0 (Free tier, Testing mode up to 100 users)
GOOGLE_HEALTH_CLIENT_ID=your_google_health_oauth_client_id.apps.googleusercontent.com
GOOGLE_HEALTH_CLIENT_SECRET=your_google_health_oauth_client_secret
GOOGLE_HEALTH_REDIRECT_URI=http://localhost:8000/oauth/google-health/callback
GHA_TOKEN_ENCRYPTION_SECRET=your_fernet_32_byte_secret_key

# Hevy API Key Encryption (Fernet 32-byte url-safe base64 key)
HEVY_KEY_ENCRYPTION_SECRET=your_fernet_32_byte_secret_key

# Nutritionix Natural Nutrients API (Get from developer.nutritionix.com)
NUTRITIONIX_APP_ID=your_nutritionix_app_id
NUTRITIONIX_API_KEY=your_nutritionix_api_key
```

> **Security Warning:** The Groq API key has a fallback in `analytics.py`. For production deployment, always supply environment variables.

---

## 11. Known Limitations & Future Work

### Current Limitations

| Area | Limitation |
|---|---|
| **Medical Report Analysis** | Returns a hardcoded mocked finding. No real OCR or AI medical parsing is implemented. |
| **Sensor Data** | The `/sensors/synthetic` endpoint returns simulated data. No real ESP32 hardware integration is connected. |
| **Cardiovascular Score** | Fixed at 78.0; not dynamically computed from sensor data. |
| **Gait Analysis** | Mode exists in the UI but full analysis pipeline is not implemented. |
| **Zone Risk Model** | Based on linear formulas from joint angles combined with Google Health activity load & Nutritionix protein intake. |
| **Database** | Uses SQLite (single-file, auto-migrated schema). Should be migrated to PostgreSQL for multi-user production use. |
| **CORS** | Set to `allow_origins=["*"]` — should be restricted to the frontend origin in production. |

### Roadmap / Future Work

- [ ] **Real sensor integration** — ESP32 BLE data streaming to the backend
- [ ] **Real medical AI** — OCR + LLM-based medical report parsing (e.g., Google Document AI)
- [x] **Google Health live sync** — Official free Google Cloud OAuth integration with TRIMP load & ACWR (superseding deprecated Fitbit Web API)
- [x] **Hevy live sync** — Personal API key integration with Fernet encryption and true ACWR
- [x] **Nutritionix live logging** — Natural-language meal logging and micronutrient breakdown
- [ ] **ML-based injury prediction** — Train a model on kinematic data to predict injury probability
- [ ] **Multi-user PostgreSQL backend** — Replace SQLite with PostgreSQL + Alembic migrations
- [ ] **Progressive Web App offline mode** — Service worker caching for offline dashboard access
- [ ] **Video export** — Allow users to download annotated session recordings
- [ ] **Clinician portal** — Separate role-based view for physiotherapists to review patient data
- [ ] **Push notifications** — Remind users to log sessions or alert on detected deterioration
- [ ] **ESP32 firmware** — Companion IoT firmware for the sensor hardware integration

---

*This documentation was generated from complete source code analysis of the PhysioTwin codebase — August 2026.*

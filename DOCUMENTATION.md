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
Calculates updated zone risk scores based on external fitness data (Hevy workouts + HealthifyMe nutrition).

**Request Body:**
```json
{
  "base_risk": { "lumbar": 48, "left_knee": 72 },
  "fit_data": {
    "workouts": [{ "name": "Leg Day (Heavy)", "load": "High" }],
    "nutrition": { "protein": "Low" }
  }
}
```

**Response:** Updated risk map with adjusted zone values.

---

#### `POST /analytics/external-apps/{user_id}`
Syncs workout and nutrition data from external apps, replacing existing entries.

**Request Body:**
```json
{
  "workouts": [...],
  "nutrition": {...}
}
```

---

#### `GET /analytics/external-apps/{user_id}`
Retrieves stored external app data. If empty, seeds realistic sample data for Hevy (7 workout sessions across Mon–Sun) and HealthifyMe (7 days of nutrition logs).

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

### 4.7 3D Model Generator

`generate_model.py` — run once to generate `frontend/public/model.glb`.

Uses `trimesh` to create a segmented box-mesh human body with the following named segments:

`head`, `neck`, `chest`, `lumbar`, `left_shoulder`, `right_shoulder`, `left_arm`, `right_arm`, `left_forearm`, `right_forearm`, `left_hip`, `right_hip`, `left_thigh`, `right_thigh`, `left_knee`, `right_knee`, `left_shin`, `right_shin`, `left_ankle`, `right_ankle`

Each segment name maps directly to `zone_risks` keys, allowing the 3D viewer to colour-code segments by injury risk.

```bash
# Run from backend/ directory
pip install trimesh
python generate_model.py
# Outputs: ../frontend/public/model.glb
```

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

The largest file (1,597 lines) and the heart of the platform. It implements a multi-stage UI wizard for biomechanical assessments.

**Capture Modes:**

| Mode | Description |
|---|---|
| `sit-to-stand` | Counts sit-to-stand reps; measures ROM, speed, symmetry |
| `standing-posture` | Static posture analysis via live video |
| `squat-analysis` | Squat depth and symmetry analysis |
| `gait-analysis` | Walking gait pattern analysis (reserved) |
| `medical-report` | Upload a medical report PDF/image |
| `static-image` | Upload a static posture photo for analysis |

**UI Stages:**
`landing -> options -> select -> setup -> countdown -> recording -> processing -> done`

**MediaPipe Integration:**
- Uses `@mediapipe/tasks-vision` with the **full** model (`pose_landmarker_full.task`).
- Processes video frames in a `requestAnimationFrame` loop.
- Draws landmarks on a `<canvas>` overlay using `DrawingUtils`.
- Computes joint angles from 3D landmark coordinates.

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

#### `NutritionRecovery.tsx` — External App Integration

Displays data fetched from `api.getExternalApps()`:
- **Hevy workouts** — weekly workout summary, per-exercise breakdown, muscle group distribution, PR tracking
- **HealthifyMe nutrition** — daily macro/micronutrient breakdown, per-meal detail, hydration, food quality score

Also calls `api.calculateDynamicRisk()` to update the body heatmap based on workout load and nutrition quality.

---

#### `WorkoutStrain.tsx` — Muscular Strain View

Visualises cumulative muscular overuse and ACWR (Acute:Chronic Workload Ratio) from Hevy data. Colour-codes muscle groups by strain risk.

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

Fetches and displays the leaderboard via `api.getLeaderboard()`. Shows username, score, and rank change indicator.

---

#### `HoloModel3D.tsx` / `HoloOverlay.tsx` — 3D Visualisation

Components built on `@react-three/fiber` and `@react-three/drei` that:
- Load `model.glb` (the generated body mesh)
- Apply risk-based colour gradients (green -> yellow -> red) per mesh segment
- Optionally add holographic overlay effects

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
| **Recovery** | 88.0, adjusted: -5 per heavy Hevy workout, +3 per high-protein nutrition day |
| **Capability Reserve** | 55.0, adjusted: -3 per heavy workout, +2 per high-protein day |

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

Displayed in `WorkoutStrain.tsx` — sourced from Hevy's `weekly_stats.acwr`. A value > 1.3 is the "caution zone" and > 1.5 is "danger zone" for overuse injury risk.

---

## 8. External Integrations

### Firebase (Authentication)

- **SDK:** Firebase JS SDK v12.17
- **Methods used:** `signInWithPopup`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `onAuthStateChanged`
- **Config:** Stored in `frontend/.env` (gitignored) and loaded in `frontend/src/lib/firebase.ts`
- The `googleFitToken` from Google OAuth is persisted in `localStorage` for potential Google Fit API integration (not yet implemented).

### Groq (LLM)

- **Model:** `llama-3.1-8b-instant` (Meta Llama 3.1 8B, hosted by Groq)
- **API key:** Set via `GROQ_API_KEY` environment variable (hardcoded fallback in `analytics.py`)
- **Used for:** Weekly letters (300 tokens), deep insight reports (900 tokens), and twin chat (300 tokens)
- **Fallback:** Static deterministic reports are returned if the Groq API is unreachable

### Hevy (Workout App)

Currently implemented as **seeded mock data** within the API. Real integration would use Hevy's webhook or export API. Seeded data includes 7 workouts (Mon–Sun) with full exercise-level detail, volume, PRs, and weekly stats.

### HealthifyMe (Nutrition App)

Implemented as **seeded mock data**. Provides 7-day nutrition logs with macros (calories, protein, carbs, fat), micronutrients (iron, calcium, Vit D, B12, magnesium, potassium), and per-meal breakdowns.

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

### Backend

```env
GROQ_API_KEY=gsk_...   # Set in shell environment or a .env file
```

> **Security Warning:** The Groq API key is currently hardcoded as a fallback in `analytics.py`. For production deployment, always use environment variables and remove the hardcoded key.

---

## 11. Known Limitations & Future Work

### Current Limitations

| Area | Limitation |
|---|---|
| **Medical Report Analysis** | Returns a hardcoded mocked finding. No real OCR or AI medical parsing is implemented. |
| **Sensor Data** | The `/sensors/synthetic` endpoint returns simulated data. No real ESP32 hardware integration is connected. |
| **External App Data** | Hevy and HealthifyMe data is seeded from static JSON, not from live API connections. |
| **Cardiovascular Score** | Fixed at 78.0; not dynamically computed from sensor data. |
| **Gait Analysis** | Mode exists in the UI but full analysis pipeline is not implemented. |
| **Zone Risk Model** | Based on simple linear formulas from joint angles; no ML-based injury prediction model is integrated. |
| **Groq API Key** | Hardcoded fallback in source code — should be moved to environment variables before any public deployment. |
| **Database** | Uses SQLite (single-file, not production-grade). Should be migrated to PostgreSQL for multi-user production use. |
| **CORS** | Set to `allow_origins=["*"]` — should be restricted to the frontend origin in production. |

### Roadmap / Future Work

- [ ] **Real sensor integration** — ESP32 BLE data streaming to the backend
- [ ] **Real medical AI** — OCR + LLM-based medical report parsing (e.g., Google Document AI)
- [ ] **Hevy / HealthifyMe live sync** — Live OAuth-based data sync via webhooks or official APIs
- [ ] **Google Fit integration** — Use the stored `googleFitToken` to pull step count, HRV, sleep data
- [ ] **ML-based injury prediction** — Train a model on kinematic data to predict injury probability
- [ ] **Multi-user PostgreSQL backend** — Replace SQLite with PostgreSQL + Alembic migrations
- [ ] **Progressive Web App offline mode** — Service worker caching for offline dashboard access
- [ ] **Video export** — Allow users to download annotated session recordings
- [ ] **Clinician portal** — Separate role-based view for physiotherapists to review patient data
- [ ] **Push notifications** — Remind users to log sessions or alert on detected deterioration
- [ ] **ESP32 firmware** — Companion IoT firmware for the sensor hardware integration

---

*This documentation was generated from complete source code analysis of the PhysioTwin codebase — August 2026.*

# PhysioTwin — Full Project Documentation

> **Generated:** September 2026  
> **Project Location:** `c:\projects\regi-twin`  
> **Status:** Active Development — MVP Feature-Complete

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema](#4-database-schema)
5. [Backend API — All Endpoints](#5-backend-api--all-endpoints)
6. [Frontend Pages & Routes](#6-frontend-pages--routes)
7. [AI & Model Details](#7-ai--model-details)
8. [Analytics & Scoring Engines](#8-analytics--scoring-engines)
9. [Implemented Features](#9-implemented-features)
10. [Todo / Pending Work](#10-todo--pending-work)
11. [Known Issues & Limitations](#11-known-issues--limitations)
12. [Running the Project](#12-running-the-project)

---

## 1. Project Overview

**PhysioTwin** (internally `regi-twin`) is a full-stack biomechanical diagnostics platform that democratizes elite sports-science tools for everyday users. It replaces $150,000 motion-capture lab rigs with:

- **Markerless computer vision** running in-browser via MediaPipe / YOLOv8-Pose + ONNX Runtime Web.
- **Consumer smartwatch integration** (Google Fit, Garmin, Fitbit, Apple Health, Samsung Health) via platform APIs.
- **A living "Digital Twin"** that tracks the user's biomechanical state over time and predicts injury risk.

The target users are:
- **Athletes / general public** — tracking their own movement quality and recovery.
- **Physiotherapists / clinicians** — monitoring a roster of patients through the Clinic Portal.

---

## 2. Technology Stack

### Backend
| Component | Technology |
|---|---|
| Web framework | **FastAPI** (Python 3.11+) |
| ORM | **SQLAlchemy** |
| Database | **SQLite** (`physiotwin.db`) — Render/production uses the same |
| LLM provider | **Groq** (`groq/compound-mini`) — for AI Twin chat, weekly letters, deep insights, rehab programs, medical report analysis |
| Pose model (server-side) | **YOLOv8n-Pose** (`yolov8n-pose.pt`, 6.83 MB) — optional fine-tuning script |
| Auth platform | **Firebase Admin SDK** (token verification stub) |
| Data validation | **Pydantic v2** |
| CSV parsing | Python stdlib `csv` |
| Server | **Uvicorn** |

### Frontend
| Component | Technology |
|---|---|
| Framework | **React 19** + **TypeScript 6** |
| Build tool | **Vite 8** |
| Routing | **Wouter** |
| Styling | **TailwindCSS v4** |
| Animations | **Framer Motion** |
| Charts | **Recharts**, **D3.js** |
| 3D Rendering | **Three.js**, **React Three Fiber**, **@react-three/drei** |
| Computer Vision | **MediaPipe Tasks-Vision** (`@mediapipe/tasks-vision ^1.0.1`) |
| ONNX Inference | **ONNX Runtime Web** (`onnxruntime-web ^1.27.0`) |
| Auth | **Firebase SDK v12** |
| State / API | **TanStack React Query v5** |
| Forms | **React Hook Form** + **Zod** |
| Icons | **Lucide React** |
| PWA | **vite-plugin-pwa** |
| SSL (dev) | **vite-plugin-mkcert** |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌──────────────────┐   ┌──────────────────────────────────┐   │
│  │  React 19 SPA    │   │   CaptureEngine.tsx              │   │
│  │  (Vite / TS)     │   │   - MediaPipe Pose Landmarker    │   │
│  │                  │   │   - ONNX Runtime Web             │   │
│  │  20+ Pages       │   │   - Joint angle computation      │   │
│  │  TailwindCSS v4  │   │   - Kinematics time-series       │   │
│  │  Framer Motion   │   │   - Anomaly detection (client)   │   │
│  │  React 3 Fiber   │   │   - Video processed LOCALLY      │   │
│  └───────┬──────────┘   └──────────────┬───────────────────┘   │
│          │                             │                        │
└──────────┼─────────────────────────────┼────────────────────────┘
           │  REST API calls             │  POST /sessions/vision
           │  (TanStack React Query)     │  (kinematic metrics only, no video)
           ▼                             ▼
┌──────────────────────────────────────────────────────────────────┐
│               FastAPI Backend  (Uvicorn)                         │
│                                                                  │
│  main.py  (1,917 lines)   analytics.py (597 lines)              │
│  ─────────────────────    ────────────────────────              │
│  40+ REST endpoints       compute_capability_profile()          │
│  CORS: allow_all           generate_weekly_letter()             │
│  Auth: Firebase (stub)    generate_deep_insights()              │
│  File uploads: multipart  chat_with_twin()                      │
│  PDF reports: HTMLResponse simulate_activity()                  │
│  CSV import: stdlib csv   compute_injury_risk()                 │
│                           detect_anomalies()                    │
│           │                                                      │
│           ▼                                                      │
│  ┌───────────────────────┐   ┌──────────────────────────────┐  │
│  │  SQLAlchemy ORM       │   │  Groq LLM API                │  │
│  │  SQLite: physiotwin.db│   │  model: groq/compound-mini   │  │
│  │  16 tables            │   │  • Weekly letter             │  │
│  └───────────────────────┘   │  • Deep insight report       │  │
│                              │  • Chat with twin            │  │
│                              │  • Rehab program             │  │
│                              │  • Medical report analysis   │  │
│                              └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Privacy-first design:** Raw video frames are **never transmitted**. All computer-vision inference runs client-side (MediaPipe WASM). Only computed numeric metrics (ROM, symmetry, stability, joint angles JSON, kinematics JSON) are sent to the server.

---

## 4. Database Schema

The backend uses SQLite via SQLAlchemy with 16 tables:

| Table | Description |
|---|---|
| `users` | User profiles — age, sex, height, weight, mode, goals, consent |
| `wearable_sessions` | Vitals snapshots from smartwatch APIs — HR, HRV, SpO2, steps, sleep |
| `vision_sessions` | Each CV capture — ROM, symmetry, stability, task type, annotated image URL |
| `kinematics_data` | Frame-by-frame joint angles & muscle stress per vision session |
| `anomaly_events` | Flagged events per session (knee valgus, hip drop, etc.) |
| `capability_profiles` | Aggregated 6-axis scores computed after each session |
| `baseline_history` | Per-user, per-task rolling baselines for z-score change-point detection |
| `change_points` | Detected metric deteriorations (temporary vs persistent) |
| `leaderboard` | Community capability mark rankings |
| `external_app_sessions` | Hevy workout & HealthifyMe nutrition sync data |
| `twin_notes` | Weekly letters, chat messages, case notes (polymorphic via `type`) |
| `pain_logs` | Daily subjective pain (1–10 scale) per joint zone |
| `kinesiophobia_records` | TSK-11 (Tampa Scale for Kinesiophobia) survey responses |
| `medications` | User medication & supplement tracker |
| `community_posts` | Community recovery support feed posts |
| `workout_logs` | Manual workout logs with exercises, sets, reps, weight |
| `nutrition_logs` | Manual daily nutrition entries with macros |
| `readiness_surveys` | RESTQ-Sport + ACL-RSI psychological readiness scores |

---

## 5. Backend API — All Endpoints

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | API health check |

### Users
| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/` | Create a new user profile |
| GET | `/users/{user_id}` | Get user profile |
| POST | `/users/triage/{user_id}` | Submit TSK-11 kinesiophobia triage |

### Wearables
| Method | Endpoint | Description |
|---|---|---|
| POST | `/wearables/sync/{user_id}` | Sync vitals snapshot from smartwatch API |
| GET | `/wearables/latest/{user_id}` | Get latest wearable vitals |
| GET | `/wearables/history/{user_id}` | Get 7-day wearable history |
| POST | `/wearable/import-csv/{user_id}` | Import CSV from Garmin/Fitbit/Apple Health |

### Vision Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/sessions/vision` | Ingest a CV capture session (triggers profile recompute) |
| GET | `/sessions/history/{user_id}` | Get session history with badges (PB, Improved, Watchpoint) |
| GET | `/captures/{session_id}/replay` | Get session kinematics replay data |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/dashboard/{user_id}` | Main dashboard: 6 capability scores, ACWR, recovery, zone risks, trend |
| POST | `/analytics/weekly-letter/{user_id}` | Generate LLM weekly progress letter |
| POST | `/analytics/deep-insights/{user_id}` | Generate LLM deep insight report |
| POST | `/analytics/chat/{user_id}` | Chat with AI Twin (LLM, context-aware) |
| GET | `/analytics/chat/history/{user_id}` | Get last 20 chat messages |
| DELETE | `/analytics/chat/history/{user_id}` | Clear chat history |
| POST | `/analytics/simulate/{user_id}` | Simulate activity impact on reserve/recovery |
| POST | `/analytics/dynamic-risk` | Calculate dynamic zone risk from Hevy + nutrition data |
| POST | `/analytics/external-apps/{user_id}` | Sync Hevy workout + HealthifyMe nutrition data |
| GET | `/analytics/external-apps/{user_id}` | Get synced external app data |
| GET | `/analytics/leaderboard` | Get global leaderboard |
| GET | `/analytics/injury-risk/{user_id}` | Compute multi-factor 7-day injury risk |
| GET | `/analytics/summary/{user_id}` | ROM trend, capability trend, pain overlay, zone heatmap |
| GET | `/analytics/projections/{user_id}` | 3/6/12-month risk projections (with/without treatment) |
| GET | `/analytics/report/pdf/{user_id}` | Generate printable HTML/PDF capability report |
| GET | `/analytics/readiness/{user_id}` | Get latest readiness survey |
| POST | `/analytics/readiness/survey/{user_id}` | Submit readiness survey |
| GET | `/analytics/achievements/{user_id}` | Get achievement badge unlock status |

### Programs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/programs/generate/{user_id}` | Generate AI-personalized 4-week rehab program |

### Pain
| Method | Endpoint | Description |
|---|---|---|
| POST | `/pain/log/{user_id}` | Log pain score for a joint zone |
| GET | `/pain/history/{user_id}` | Get pain history |

### Clinic
| Method | Endpoint | Description |
|---|---|---|
| GET | `/clinic/roster` | Therapist roster view (admin key protected) |
| GET | `/clinic/patient/{user_id}` | Patient detail drill-down (admin key protected) |
| POST | `/clinic/casenotes/{user_id}` | Create clinical case note |
| GET | `/clinic/casenotes/{user_id}` | Get case notes |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| POST | `/reports/analyze/{user_id}` | Upload & AI-analyze medical report (filename-based region detection) |

### Medications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/medications/{user_id}` | Get medications list |
| POST | `/medications/{user_id}` | Add medication/supplement |
| PATCH | `/medications/{med_id}/toggle` | Mark medication as taken/untaken |
| DELETE | `/medications/{med_id}` | Delete medication |

### Community
| Method | Endpoint | Description |
|---|---|---|
| GET | `/community/posts` | Get community posts |
| POST | `/community/posts/{user_id}` | Create community post |
| POST | `/community/posts/{post_id}/like` | Like a post |

### Workouts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/workouts/{user_id}` | Get workout logs |
| POST | `/workouts/log/{user_id}` | Log a workout |
| DELETE | `/workouts/{log_id}` | Delete workout log |

### Nutrition
| Method | Endpoint | Description |
|---|---|---|
| GET | `/nutrition/{user_id}` | Get nutrition logs |
| POST | `/nutrition/log/{user_id}` | Log a nutrition entry |
| DELETE | `/nutrition/{log_id}` | Delete nutrition log |

---

## 6. Frontend Pages & Routes

All pages behind `/dashboard` and beyond require Firebase authentication.

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Marketing landing page with feature grid and democratization table |
| `/login` | `LoginPage` | Login / Registration form (Firebase Auth) |
| `/register` | `LoginPage` | Same component — register mode |
| `/onboarding` | `Onboarding` | Multi-step onboarding: profile setup, goals, consent |
| `/capture` | `CaptureEngine` | Live biomechanical capture engine (webcam / photo) |
| `/demo` | `DemoDashboard` | Full demo dashboard without auth (uses seed data) |
| `/dashboard` | `Dashboard` | Main user dashboard: 6 capability scores, digital twin preview |
| `/twin` | `TwinPage` | Digital Twin 3D model, chat interface, simulation panel, projections |
| `/history` | `CapturesPage` | Capture history with badge overlays |
| `/analytics` | `AnalyticsPage` | ROM trend, capability trend, pain overlay, zone heatmap charts |
| `/muscular-strain` | `WorkoutStrain` | Hevy/manual workout sync, ACWR, strain analysis |
| `/nutrition-recovery` | `NutritionRecovery` | HealthifyMe/manual nutrition sync, recovery dashboard |
| `/vitals` | `VitalsPage` | Wearable vitals (HR, HRV, SpO2, sleep), CSV import |
| `/readiness` | `MentalReadinessPage` | RESTQ-Sport + ACL-RSI readiness survey and history |
| `/meds` | `MedicationPage` | Medication & supplement adherence tracker |
| `/programs` | `ProgramsPage` | AI-generated 4-week rehab program |
| `/community` | `CommunityPage` | Recovery support community feed (group posts, likes) |
| `/clinic` | `ClinicPage` | Clinic portal: pain logging, medical report upload, case notes |
| `/clinic/roster` | `ClinicRosterPage` | Therapist patient roster with risk flagging |
| `/leaderboard` | `LeaderboardPage` | Global capability mark leaderboard |
| `/achievements` | `AchievementsPage` | Achievement badge progress tracker |
| `/settings` | `SettingsPage` | User settings, profile update |
| `/wiki` | `WikiPage` | Glossary / knowledge base |
| `/timeline` | `TimelinePage` | Timeline dummy (placeholder) |
| `/insights` | `InsightsPage` | Insights dummy (placeholder) |

---

## 7. AI & Model Details

### 7.1 Pose Estimation Model — MediaPipe + YOLOv8

The system uses a **two-track** approach:

#### Track A — Live Webcam (Primary)
- **Model:** MediaPipe Pose Landmarker WASM (runs entirely in the browser)
- **Output:** 33 body keypoints (x, y, z, visibility) at 30fps
- **Inference location:** Client-side (no server round-trip)
- **Framework:** `@mediapipe/tasks-vision ^1.0.1`

#### Track B — Static Photo / ONNX
- **Model:** YOLOv8n-Pose (nano), exported as ONNX (`yolov8n-pose.pt` → ONNX)
- **File size:** 6.83 MB
- **Input size:** 640×640
- **Keypoints:** 17 COCO keypoints
- **Inference:** `onnxruntime-web ^1.27.0` (WASM backend)
- **Export script:** `backend/scripts/train_pose_model.py` — exports to ONNX with `opset=12, simplify=True` for onnxruntime-web compatibility
- **Fine-tuning script:** `backend/scripts/auto_train.py` — supports additional clinical images via the Ultralytics YOLO training API

#### YOLOv8n-Pose Baseline Accuracy (COCO val2017)
| Metric | Value |
|---|---|
| Pose mAP@0.5 | **50.4** |
| Pose mAP@0.5:0.95 | **32.8** |
| Detection mAP@0.5 | **63.4** |
| Inference speed (CPU, 640px) | ~80ms / frame |
| Inference speed (GPU, 640px) | ~6ms / frame |

> **Note:** PhysioTwin uses the **pretrained weights directly** without domain-specific fine-tuning yet (see §10 Todo). The custom training script (`train_pose_model.py`) is scaffolded but requires a curated clinical dataset (`custom_pose_data.yaml`) to run.

### 7.2 Joint Angle Computation

Angles are computed from 2D landmark vectors using standard dot-product / arctangent methods client-side:

| Angle | Landmarks Used |
|---|---|
| Knee Valgus | Hip → Knee → Ankle vector deviation in frontal plane |
| Hip Drop | Bilateral iliac crest lateral deviation |
| Shoulder Tilt | Left shoulder Y vs right shoulder Y |
| Hip Tilt | Left hip Y vs right hip Y |
| Head Forward | Ear → shoulder horizontal offset |
| Trunk Lean | Shoulder midpoint vs hip midpoint horizontal offset |

Anomaly thresholds:
- **Knee Valgus** > 15° → flagged as `knee_valgus`
- **Hip Drop** > 10° → flagged as `hip_drop`

### 7.3 LLM — Groq compound-mini

All generative text features use **Groq** with the `groq/compound-mini` model:

| Feature | Temperature | Max Tokens |
|---|---|---|
| Weekly Letter | 0.7 | 300 |
| Deep Insight Report | 0.35 | 900 |
| AI Twin Chat | 0.7 | 300 |
| Rehab Program Generation | 0.4 | 1000 |
| Medical Report Analysis | 0.5 | 200 |

The system prompt for the AI Twin includes:
- User's latest 6 capability scores
- Last 3 clinical case notes

Fallback behavior: If Groq is unavailable, all functions return deterministic, clinical-quality hardcoded fallback text.

---

## 8. Analytics & Scoring Engines

### 8.1 Capability Profile (6 Axes)

Computed by `compute_capability_profile()` in `analytics.py`, triggered after every vision session ingestion:

| Axis | Source | Computation |
|---|---|---|
| **Mobility** | Vision sessions (ROM) | Mean ROM of last 5 sessions (0–180°) |
| **Stability** | Vision sessions | Mean stability score × 100 of last 5 sessions |
| **Movement Quality** | Vision sessions | Mean symmetry × 100 of last 5 sessions |
| **Cardiovascular Efficiency** | Wearable sessions | `HR score (60%) + HRV score (40%)` — see formula below |
| **Recovery** | External apps (Hevy/HealthifyMe) | `88 – (heavy_workouts × 5) + (protein_days × 3)` |
| **Capability Reserve** | External apps | `55 – (heavy_workouts × 3) + (protein_days × 2)` |

**Cardio formula:**
```
hr_score  = max(0, min(100, 130 - resting_HR))
hrv_score = max(0, min(100, HRV_ms))
cardio    = (hr_score × 0.6) + (hrv_score × 0.4)
```

**Confidence level:**
- `"High"` — ≥ 3 vision sessions
- `"Medium"` — 1–2 sessions
- `"Low"` — 0 sessions

### 8.2 Capability Mark (0–1000 Scale)

Weighted composite score used for the leaderboard:

```
Capability Mark = (
  Mobility   × 0.20 +
  Stability  × 0.25 +
  Quality    × 0.20 +
  Cardio     × 0.20 +
  Recovery   × 0.15
) × 10
```

### 8.3 Acute-to-Chronic Workload Ratio (ACWR)

| ACWR | Classification |
|---|---|
| < 0.8 | Under-training |
| 0.8 – 1.5 | Sweet Spot (safe) |
| > 1.5 | Danger Zone |

Computed from `ExternalAppSession` workout volumes over rolling 7-day (acute) and 28-day (chronic) windows.

### 8.4 Recovery Score

```
hrv_component  = min(100, HRV × 1.3)
hr_component   = max(0, min(100, 130 - resting_HR))
recovery_score = (sleep_score × 0.40) + (hrv_component × 0.40) + (hr_component × 0.20)
```

Range: 10–100.

### 8.5 Multi-Factor Injury Risk Model

Computed by `compute_injury_risk()` with weights sourced from sports-science literature:

| Factor | Weight | Input Signal |
|---|---|---|
| Workload Spike (ACWR) | 35% | Vision session ROM as proxy load |
| Subjective Pain | 25% | 7-day mean pain score (0–10) |
| Kinesiophobia (TSK-11) | 15% | Tampa Scale score (11–44) |
| Bilateral Asymmetry | 15% | 14-day mean symmetry from CV sessions |
| Sleep Deficit | 10% | 7-day mean sleep hours vs 7h threshold |

**Risk levels:**
- 0–30 → **Low** — proceed with training
- 31–60 → **Moderate** — reduce intensity 20%, prioritize sleep
- 61–100 → **High** — rest day, consult physio

### 8.6 Change-Point Detection

After every profile recompute: if **stability < 60** and **session count ≥ 3**, a `ChangePoint` record is created with `classification = "persistent"`. This surfaces as a banner alert in the dashboard.

### 8.7 Dynamic Risk Projections (3/6/12 months)

Driven by current zone risks, ACWR, and recovery score:

```
monthly_escalation = acwr_factor × recovery_factor

Without treatment: zone_risk = min(100, current + months × monthly_escalation × 3)
With treatment:    zone_risk = max(5,   current − months × monthly_escalation × 2)
```

---

## 9. Implemented Features

All features listed below are fully implemented in code and wired end-to-end (frontend → backend → DB).

### 9.1 Core Capture Engine (`CaptureEngine.tsx` — 89 KB)
- [x] Live webcam pose estimation via MediaPipe Pose Landmarker
- [x] Static photo pose estimation via ONNX Runtime Web (YOLOv8n-Pose)
- [x] Two movement tasks: **Sit-to-Stand** and **Static Posture**
- [x] Real-time joint angle overlay on canvas
- [x] Movement speed (reps/min) computation
- [x] Bilateral symmetry computation
- [x] Postural stability scoring
- [x] Range of motion (ROM) measurement in degrees
- [x] Kinematics time-series recording (frame-by-frame angles)
- [x] Anomaly detection: knee valgus (>15°), hip drop (>10°) — with 1s debounce
- [x] Camera quality assessment
- [x] Annotated image capture (base64 → URL)
- [x] Automatic POST to `/sessions/vision` on session completion
- [x] Wearable session linkage (joint capture + vitals in one session)
- [x] Personal best badge detection

### 9.2 Dashboard (`Dashboard.tsx` — 32 KB)
- [x] 6-axis radar/ring charts (Mobility, Stability, Quality, Cardio, Recovery, Reserve)
- [x] Capability Mark display (0–1000)
- [x] ACWR indicator with Sweet Spot / Danger Zone badge
- [x] Recovery score from wearable data
- [x] Change-point alert banner
- [x] Session history preview with badge overlays
- [x] Zone risk heatmap (20-zone anatomical body)
- [x] Trend charts (30-session history)
- [x] Quick-action buttons (Capture, Twin Chat, Programs)

### 9.3 Digital Twin Page (`TwinPage.tsx` — 31 KB)
- [x] Interactive 3D body model with zone-risk color coding (Three.js / R3F)
- [x] Holographic overlay with joint annotations (`HoloOverlay.tsx`)
- [x] AI Twin chat interface (`ChatInterface.tsx`) — context-aware with capability profile
- [x] Activity simulator (What-If mode): running/weightlifting/yoga intensity × duration
- [x] Dynamic 3/6/12-month risk projections (with and without treatment)
- [x] Weekly letter generation (LLM)
- [x] Deep insight report generation (LLM)

### 9.4 Wearables & Vitals (`VitalsPage.tsx`)
- [x] Manual vitals sync (HR, HRV, SpO2, steps, sleep, readiness)
- [x] CSV import (auto-detects Garmin / Fitbit / Apple Health format)
- [x] 7-day HRV and resting HR trend charts
- [x] Sleep quality visualization
- [x] `WearableImportModal.tsx` — drag-and-drop CSV upload modal

### 9.5 Workout Strain (`WorkoutStrain.tsx` — 28 KB)
- [x] Manual workout logging (exercise, sets, reps, weight)
- [x] Hevy app integration (simulated sync)
- [x] Volume (kg) auto-calculation
- [x] Load level classification (Low / Medium / High)
- [x] ACWR visualization
- [x] Affected zone impact mapping
- [x] Dynamic risk endpoint integration (`/analytics/dynamic-risk`)

### 9.6 Nutrition & Recovery (`NutritionRecovery.tsx` — 15 KB)
- [x] Manual nutrition entry (meal name, items, calories, protein, carbs, fat)
- [x] HealthifyMe integration (simulated sync)
- [x] Macro tracking charts
- [x] Protein adequacy scoring

### 9.7 Mental Readiness (`MentalReadinessPage.tsx` — 24 KB)
- [x] Full RESTQ-Sport questionnaire (general stress, emotional stress, social stress, fatigue, energy deficit, physical complaints, success, social recovery, physical recovery, well-being)
- [x] ACL-RSI sport confidence score
- [x] Kinesiophobia score (TSK-11 proxy)
- [x] Survey history and trend visualization

### 9.8 Analytics Page (`AnalyticsPage.tsx` — 12 KB)
- [x] ROM trend chart (per session)
- [x] Capability trend chart (multi-line: mobility, stability, quality, recovery)
- [x] Pain overlay chart (by zone over time)
- [x] Zone heatmap (sessions by task type)
- [x] CSV export of session data

### 9.9 Clinic Portal (`ClinicPage.tsx`, `ClinicRosterPage.tsx`)
- [x] Pain log input (20 anatomical zones, 1–10 slider)
- [x] Medical report upload + AI analysis (filename-based region detection → Groq)
- [x] Clinical case notes (CRUD)
- [x] Therapist roster view (all patients, recovery scores, ACWR, pain max, risk level, last session)
- [x] Patient detail drill-down (capability history, pain logs, case notes, injury risk)
- [x] Admin-key protected endpoints

### 9.10 Programs (`ProgramsPage.tsx` — 10 KB)
- [x] AI-generated 4-week rehab program (personalized by high-risk zones from capability profile)
- [x] Fallback deterministic 4-week program when Groq unavailable
- [x] Week-by-week task display with biomechanical rationale

### 9.11 Medications (`MedicationPage.tsx` — 11 KB)
- [x] Add medication / supplement
- [x] Daily taken/untaken toggle with timestamp
- [x] Dosage and time-of-day tracking
- [x] Delete medication

### 9.12 Community (`CommunityPage.tsx` — 11 KB)
- [x] Recovery support group posts
- [x] Create post with group selection
- [x] Like posts
- [x] Chronological feed

### 9.13 Leaderboard (`LeaderboardPage.tsx`)
- [x] Global capability mark rankings
- [x] Rank change indicators (+/−)
- [x] Auto-seeded with 5 default players if empty

### 9.14 Achievements (`AchievementsPage.tsx`)
- [x] "First 10 Sessions" — unlocks at 10 vision sessions
- [x] "100 Rehab Sessions" — unlocks at 100 sessions
- [x] "Perfect Symmetry" — unlocks at ≥95% symmetry
- [x] "Iron Consistency" — unlocks at 30-day consecutive pain logging streak
- [x] "Full Range of Motion" — unlocks at ≥140° ROM
- [x] "Cleared for Sport" — unlocks when all 4 core metrics ≥85%
- [x] Progress bars for all achievements

### 9.15 Session Replay
- [x] `GET /captures/{session_id}/replay` — returns kinematics frame array + anomaly timestamps + linked wearable vitals
- [x] Used by `CaptureDashboard.tsx` component

### 9.16 Printable PDF Report
- [x] `GET /analytics/report/pdf/{user_id}` — renders styled HTML with print CSS overrides
- [x] Sections: Biomechanical Base Scores, Kinematic Capture History, Subjective Pain Logs
- [x] Print / Save PDF button embedded

### 9.17 Auth & Onboarding
- [x] Firebase Authentication (email + Google sign-in via `LoginPage.tsx`)
- [x] `AuthContext.tsx` providing `user` and `loading` state
- [x] `ProtectedRoute` HOC — redirects unauthenticated users to `/login`
- [x] Multi-step onboarding: profile setup (age, sex, height, weight), goal selection, consent gate

### 9.18 PWA
- [x] `vite-plugin-pwa` configured — service worker and manifest
- [x] HTTPS-enabled dev server via `vite-plugin-mkcert`

### 9.19 Tunnel / Deployment
- [x] `tunnel.js` — ngrok tunnel setup for local → public HTTPS exposure
- [x] FastAPI serves built frontend `dist/` as static SPA in production
- [x] `frontend/dist` mounted at `/assets`, with SPA fallback to `index.html`

---

## 10. Todo / Pending Work

### High Priority

- [ ] **Real Firebase token verification on backend** — `main.py` accepts any user_id string without verifying Firebase JWT. The `firebase-admin` package is installed but not wired into any middleware or endpoint. Need to add a `firebase_admin.auth.verify_id_token()` check to all protected endpoints.

- [ ] **Real wearable OAuth integration** — Wearable sync (`/wearables/sync`) accepts manually entered data. Google Fit, Garmin Connect, and Fitbit all require OAuth 2.0 flows. These are not implemented; the UI simulates the sync.

- [ ] **Domain-specific YOLOv8 fine-tuning** — `backend/scripts/train_pose_model.py` and `auto_train.py` are scaffolded and ready, but `custom_pose_data.yaml` and the curated clinical image dataset (200–500 images) have not been created. Running the fine-tune requires annotated clinical pose images in YOLO keypoint format.

- [ ] **Real Hevy API integration** — Workout sync uses a simulated data structure. [Hevy](https://hevy.com/) has a public API. Needs OAuth token + endpoint calls to pull real workout history.

- [ ] **Real HealthifyMe API integration** — Nutrition sync is simulated. HealthifyMe API requires partnership access.

- [ ] **Change-point detection improvement** — The current change-point detection is a simple threshold (`stability < 60`). Replace with a proper CUSUM or PELT algorithm that detects step changes in any metric across all sessions, not just stability.

- [ ] **Persistent wearable linkage** — The `wearable_session_id` FK in `vision_sessions` is accepted but the frontend does not always correctly populate it at capture time.

### Medium Priority

- [ ] **Timeline page** — `/timeline` route loads `TimelinePage` from `DummyPages.tsx` (placeholder). Needs a real timeline/calendar view of all sessions and events.

- [ ] **Insights page** — `/insights` loads `InsightsPage` from `DummyPages.tsx` (placeholder). Needs population with the LLM insight pipeline.

- [ ] **Projection page** — `/projection` maps to `TwinPage`. Should have its own dedicated route with the 3/6/12 month comparison UI.

- [ ] **Database migration to PostgreSQL** — SQLite is used for both dev and production (Render). Under concurrent load, SQLite will be a bottleneck. Migration to PostgreSQL (via Render's managed Postgres) is planned.

- [ ] **Session de-duplication** — Wearable CSV import deduplicates by exact `(user_id, timestamp)` match. But near-duplicate rows with millisecond differences will be imported multiple times.

- [ ] **Real Apple Health export parsing** — The CSV import heuristic checks for `"source name"` in headers (a known Apple Health export column). Testing against real Apple Health `.csv` exports needed.

- [ ] **Medical report image analysis** — The `/reports/analyze/{user_id}` endpoint uses only the **filename** to detect body region (via keyword lookup). Actual imaging (X-ray, MRI) is never read. True medical image analysis requires a DICOM/NifTI parsing library + a vision model.

- [ ] **Admin key hardening** — The clinic roster admin key is hardcoded as `"physiotwin-admin-2026"`. Move to environment variable and implement proper role-based access control.

- [ ] **Rate limiting** — No rate limiting on LLM endpoints. Users can spam `/analytics/chat/`, `/analytics/weekly-letter/`, etc., exhausting the Groq API quota.

- [ ] **Error boundaries in React** — Large components like `CaptureEngine.tsx` and `TwinPage.tsx` lack React error boundaries, meaning any runtime crash propagates to a blank screen.

### Low Priority

- [ ] **Wiki page content** — `WikiPage.tsx` is a shell. Needs biomechanics glossary content.

- [ ] **Settings page** — `SettingsPage.tsx` has UI but profile update `PATCH /users/{user_id}` endpoint doesn't exist in the backend. Needs to be added.

- [ ] **HoloModel3D avatar customization** — The 3D avatar in `HoloModel3D.tsx` is generic. Avatar customization (skin tone, body proportions matching user's height/weight) is scaffolded in `AvatarContext.tsx` but not implemented.

- [ ] **Offline mode** — PWA is configured but there's no offline data caching strategy. Service worker doesn't cache API responses.

- [ ] **iOS Safari webcam permission UX** — HTTPS is required for camera access on iOS. `vite-plugin-mkcert` handles this in dev but the production Render deployment needs `X-Forwarded-Proto` headers checked.

- [ ] **Unit test coverage** — `test_features.py` and `test_new_features.py` exist but coverage is minimal. Need tests for all analytics functions, especially `compute_injury_risk()` and `compute_capability_profile()`.

- [ ] **Seed data cleanup** — `seed_data.py` seeds the DB for demo purposes. In production, a proper migration + seeding strategy is needed.

---

## 11. Known Issues & Limitations

| Issue | Impact | Notes |
|---|---|---|
| ACWR uses ROM as proxy workload | Medium | ROM (degrees) is not a true training load unit. Actual load (kg·m/s, session RPE) would be more accurate |
| Cardio score formula is uncalibrated | Low–Medium | `130 – resting_HR` can give negative scores for athletes with HR > 130 (unlikely but possible). Clamped to 0 |
| Zone risks only set for ~10 zones | Low | `compute_capability_profile()` only sets risk for 10 zones; the full 20-zone model defaults to 0 for the rest |
| Groq model name mismatch | Medium | Code references `"groq/compound-mini"` but Groq's actual model IDs are `"llama-3.1-8b-instant"` etc. This needs to be verified against the Groq API docs |
| `statistics.mean()` throws on empty list | Low | Some analytics calls guard this, but not all. Needs defensive `if list` checks everywhere |
| SQLite under concurrent load | Medium | Multiple simultaneous users can trigger `OperationalError: database is locked` |
| No video recording | By design | Raw video is never stored — only kinematic metrics persist |

---

## 12. Running the Project

### Prerequisites
- Python 3.11+
- Node.js 20+
- Groq API key

### Backend

```powershell
cd c:\projects\regi-twin\backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Set environment variables
copy .env.example .env
# Edit .env: add GROQ_API_KEY=your_key_here

# Run server
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```powershell
cd c:\projects\regi-twin\frontend

# Install dependencies
npm install

# Set environment variables
copy .env.example .env
# Edit .env: set VITE_API_URL=http://localhost:8000

# Run dev server (HTTPS with mkcert for camera access)
npm run dev
```

Frontend will be available at `https://localhost:5173`

### Model Fine-tuning (Optional)

```powershell
cd c:\projects\regi-twin\backend

# Requires: custom_pose_data.yaml + curated clinical image dataset
python scripts/train_pose_model.py

# Copy exported ONNX to frontend
copy runs\pose\clinical_finetune\weights\best.onnx ..\frontend\public\
```

### ngrok Tunnel (for mobile testing)

```powershell
cd c:\projects\regi-twin
node tunnel.js
```

---

## Appendix — Key File Sizes & Line Counts

| File | Lines | Size |
|---|---|---|
| `backend/main.py` | 1,917 | 84 KB |
| `frontend/src/CaptureEngine.tsx` | ~2,200 | 89 KB |
| `frontend/src/Dashboard.tsx` | ~800 | 33 KB |
| `frontend/src/TwinPage.tsx` | ~800 | 32 KB |
| `frontend/src/WorkoutStrain.tsx` | ~700 | 28 KB |
| `frontend/src/DummyPages.tsx` | ~700 | 27 KB |
| `frontend/src/MentalReadinessPage.tsx` | ~600 | 24 KB |
| `frontend/src/DemoDashboard.tsx` | ~600 | 24 KB |
| `backend/analytics.py` | 597 | 31 KB |
| `frontend/src/App.tsx` | 248 | 14 KB |
| `backend/models.py` | 257 | 11 KB |

---

*This document was auto-generated from source analysis. Last updated: September 2026.*

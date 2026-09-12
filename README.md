# 🧬 PhysioTwin — The Digital Twin of Physical Health & Recovery

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose_Estimation-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Heatmap-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Groq LLM](https://img.shields.io/badge/Groq-Llama_3.1_8B-F05A28?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_v12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## 📽️ Demo & Quick Links

- **Video Demonstration:** [Watch the PhysioTwin Video Demo on Google Drive](https://drive.google.com/file/d/1Gyfq_DeAfjbFYifYRk9BRmKfBbe_jCRK/view?usp=drivesdk)
- **Interactive Swagger API Docs:** `http://localhost:8000/docs` (when backend is running)
- **Complete Technical Specification:** [DOCUMENTATION.md](file:///c:/projects/regi-twin/DOCUMENTATION.md)
- **Pitch Deck & Product Strategy:** [PITCH_DECK.md](file:///c:/projects/regi-twin/PITCH_DECK.md)

---

## 📑 Table of Contents

1. [Executive Summary & Vision](#-executive-summary--vision)
2. [Key Capabilities & Features](#-key-capabilities--features)
3. [System Architecture & Data Pipeline](#-system-architecture--data-pipeline)
4. [Tech Stack Breakdown](#-tech-stack-breakdown)
5. [Repository Structure](#-repository-structure)
6. [Biomechanical Models & Mathematical Foundations](#-biomechanical-models--mathematical-foundations)
7. [Database Architecture & Schema](#-database-architecture--schema)
8. [Complete REST API Reference](#-complete-rest-api-reference)
9. [Frontend Architecture & Application Routes](#-frontend-architecture--application-routes)
10. [Step-by-Step Installation & Local Setup](#-step-by-step-installation--local-setup)
11. [Environment Variables Configuration](#-environment-variables-configuration)
12. [Production Deployment & Tunneling](#-production-deployment--tunneling)
13. [Limitations & Future Roadmap](#-limitations--future-roadmap)
14. [License & Medical Disclaimer](#-license--medical-disclaimer)

---

## 🌟 Executive Summary & Vision

**PhysioTwin** is an end-to-end **Digital Twin platform for human biomechanics, physical therapy, and proactive injury prevention**. It creates a dynamic, continuously updating 3D digital avatar of an individual's musculoskeletal system by synchronizing computer vision pose kinematics, physiological sensor telemetry, workout load ratios, and nutrition intake.

### Why PhysioTwin?
- **Zero-Hardware Movement Analysis:** No markers, suits, or specialized cameras. Uses client-side WebAssembly computer vision (MediaPipe) to track 33 kinematic landmarks in real time via any standard webcam or smartphone camera.
- **Privacy-First By Design:** Video streams are processed purely within the user's browser runtime. **No raw video or image frames are ever transmitted to or stored on servers** — only computed anonymized biomechanical vectors.
- **Multi-Modal Clinical Intelligence:** Fuses movement symmetry, Range of Motion (ROM), Acute-to-Chronic Workload Ratios (ACWR), and physiological recovery markers using Groq-accelerated LLaMA 3.1 LLM inference.
- **Interactive 3D Anatomical Heatmap:** Automatically highlights muscular overuse and articular stress across 20 discrete anatomical zones in real-time.
- **Predictive "What-If" Simulation:** Simulates the physiological drain and capability depletion of planned athletic activities before the user performs them.

---

## ⚡ Key Capabilities & Features

### 1. 📷 Computer Vision Kinematics & Capture Engine
- **33-Point 3D Pose Tracking:** Sub-millisecond landmark extraction using Google MediaPipe Pose WASM.
- **Dynamic Movement Assessment Modes:**
  - `sit-to-stand`: Automatically counts repetitions, measures peak velocity, Range of Motion (ROM), and bilateral symmetry.
  - `standing-posture`: Real-time sagittal and coronal plane postural alignment detection (shoulder tilt, pelvic tilt, forward head posture).
  - `squat-analysis`: Measures knee flexion depth, hip tracking, valgus/varus knee collapse, and spinal neutral alignment.
  - `static-image`: Uploads diagnostic clinical posture photographs for instant biomechanical assessment.
  - `gait-analysis`: Dynamic step timing, cadence, and stride symmetry tracking.

### 2. 🩻 Interactive 3D Digital Twin & Holo View
- **Segmented Anatomical Model:** Custom GLTF/GLB 3D body mesh rendered with Three.js and React Three Fiber.
- **Dynamic 20-Zone Heatmap:** Real-time color-coded shader mapping (Green = Optimal, Yellow = Moderate Strain, Red = High Risk) across:
  - Cervical, Lumbar, Chest, Left/Right Shoulder, Arm, Forearm, Hip, Thigh, Knee, Shin, Ankle.
- **6-Axis Capability Radar:** Holistic capability profiling across **Mobility**, **Stability**, **Movement Quality**, **Cardiovascular Efficiency**, **Recovery State**, and **Capability Reserve**.

### 3. 🤖 AI Clinical Insights & Twin Chat (Groq + LLaMA 3.1)
- **Conversational Digital Twin:** Interactive chat agent equipped with the user's complete kinematic history, recent baseline shifts, and risk levels to answer questions like *"Why is my right knee aching after yesterday's run?"*
- **Clinical Deep Insights:** Multi-section Markdown diagnostic reports detailing kinematic dysfunctions, load distribution, and prescriptive corrective exercises.
- **Automated Weekly Letters:** Proactive AI-generated summaries celebrating gains, pointing out emerging asymmetries, and guiding weekly recovery goals.

### 4. 🔮 "What-If" Activity Simulator
- **Physiological Drain Modeling:** Test planned workouts (Running, Weightlifting, HIIT, Yoga) at various intensities and durations.
- **Predictive Reserve Depletion:** Calculates exact impact on recovery reserve score and alerts if a planned workout will push an athlete into the injury danger zone.

### 5. 🏋️ External Fitness & Nutrition Ecosystem
- **Hevy Workout Integration:** Ingests set-by-set resistance training volume, muscle group distribution, and ACWR calculations.
- **HealthifyMe Nutrition Integration:** Tracks protein adequacy, micronutrient sufficiency (Magnesium, Vitamin D, Calcium), hydration, and caloric balance to compute physical tissue repair readiness.
- **Dynamic Risk Adjustment:** Automatically elevates joint strain scores when high mechanical loading coincides with poor nutritional recovery.

### 6. 🏥 Clinic Portal & Medical Diagnostic Ingestion
- **Medical Report Analysis:** Ingests MRI, X-ray, and CT diagnostic summaries, automatically extracting anatomical findings, severity ratings, and clinical contraindications.
- **Clinician Sharing:** Facilitates secure profile sharing between patients and licensed physical therapists.

### 7. 🏆 Gamification, Vitals & Community Hub
- **Leaderboard:** Dynamic community scoring based on consistency, movement symmetry, and rehabilitation protocol compliance.
- **Achievements System:** Unlockable badges recognizing recovery milestones and movement quality improvements.
- **Mental Readiness & Medication Tracker:** Correlates cognitive stress, sleep perception, and medication schedules with physical performance.

---

## 🏗️ System Architecture & Data Pipeline

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER (Browser)                           |
|                                                                                   |
|  +--------------------+   +---------------------------+   +--------------------+  |
|  |     React 19       |   |      MediaPipe Pose       |   |    Three.js 3D     |  |
|  |   SPA & Routing    |   |    (WASM On-Device CV)    |   |   Body Heatmap     |  |
|  +---------+----------+   +-------------+-------------+   +---------+----------+  |
|            |                            |                           |             |
|            | REST (JSON via fetch)      | Kinematic Angles / ROM    | Renders GLB |
+------------|----------------------------|---------------------------|-------------+
             |                            |                           |
             +----------------------------+                           |
                                          |                           |
                                          v                           v
+-----------------------------------------------------------------------------------+
|                             BACKEND LAYER (FastAPI :8000)                         |
|                                                                                   |
|  +--------------------+   +---------------------------+   +--------------------+  |
|  |   User & Session   |   |     Analytics Engine      |   | Synthetic Sensor   |  |
|  |     Controllers    |   | (Capability, Baselines)   |   |     Telemetry      |  |
|  +---------+----------+   +-------------+-------------+   +--------------------+  |
|            |                            |                                         |
|            v                            v                                         |
|  +--------------------+   +---------------------------+   +--------------------+  |
|  |    SQLite ORM      |   |   Groq Cloud Inference    |   | Medical Diagnostic |  |
|  |  (physiotwin.db)   |   |   (LLaMA 3.1-8B-Instant)  |   |   Report Intake    |  |
|  +--------------------+   +---------------------------+   +--------------------+  |
+-----------------------------------------------------------------------------------+
             |
             v
+------------------------------------+
|       AUTHENTICATION PROVIDER      |
|    Firebase Auth (OAuth / Email)   |
+------------------------------------+
```

### End-to-End Data Flow
1. **Kinematic Capture:** The user starts a movement session at `/capture`. The browser activates the camera via `getUserMedia` and runs `@mediapipe/tasks-vision` at 30+ FPS.
2. **Feature Extraction:** Real-time geometric math computes joint angles, coronal symmetry, and postural stability.
3. **Session Ingestion:** On completion, anonymous telemetry is POSTed to `/sessions/vision`.
4. **Holistic Capability Recomputation:** `compute_capability_profile()` calculates rolling baselines, detects statistical change points, and updates the 20-zone risk scores.
5. **3D Avatar Rendering:** The client fetches updated scores from `/analytics/dashboard/{user_id}` and shades the 3D anatomical mesh in real time.
6. **AI Synthesis:** When requested, Groq LLaMA 3.1 produces clinical-grade insights and responds dynamically in the Twin Chat interface.

---

## 💻 Tech Stack Breakdown

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2 | Core declarative user interface framework |
| **Vite** | 8.2 | Next-generation frontend build tooling and HMR dev server |
| **TypeScript** | 6.0 | End-to-end static typing and interface contracts |
| **Tailwind CSS** | 4.3 | High-performance atomic CSS styling engine |
| **Wouter** | 3.10 | Minimalist, low-overhead client-side routing |
| **Three.js / React Three Fiber** | 0.185 / 9.7 | WebGL 3D rendering pipeline for the anatomical avatar |
| **@mediapipe/tasks-vision** | 1.0.1 | Client-side WebAssembly pose landmark estimation |
| **Recharts** | 3.10 | Composable SVG data visualizations & radar charts |
| **Framer Motion** | 12.43 | Fluid UI micro-interactions and route animations |
| **Firebase SDK** | 12.17 | Client-side OAuth (Google) and Email/Password authentication |
| **React Hook Form + Zod** | 7.84 / 3.25 | Schema-validated high performance forms |
| **TanStack Query** | 5.101 | Server state caching and asynchronous mutation management |
| **Lucide React** | 1.28 | Modern clean iconography system |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.110+ | High-performance asynchronous Python REST framework |
| **Uvicorn** | Standard | High-throughput ASGI server implementation |
| **SQLAlchemy** | 2.0+ | Object Relational Mapping (ORM) and schema modeling |
| **SQLite** | 3 | Embedded zero-configuration relational database (`physiotwin.db`) |
| **Pydantic** | v2 | Request/response data validation and serialization |
| **Groq SDK** | Latest | Ultra-low latency inference for Meta LLaMA 3.1 8B |
| **Trimesh** | Latest | Programmatic 3D anatomical mesh synthesis (`model.glb`) |
| **Python-Multipart** | Latest | Streaming multipart file upload handling for medical reports |

---

## 📁 Repository Structure

```
regi-twin/
├── backend/
│   ├── analytics.py          # LLM engine (Groq), capability computations, and what-if simulation
│   ├── database.py           # SQLAlchemy database engine and scoped session factory
│   ├── generate_model.py     # Procedural 3D box-mesh generator producing model.glb
│   ├── main.py               # FastAPI application entrypoint, CORS configuration, and REST routes
│   ├── mock_sensor.py        # First-order lag synthetic physiological telemetry generator
│   ├── models.py             # SQLAlchemy database models & relational schema definitions
│   ├── physiotwin.db         # SQLite database file (automatically created on first boot)
│   └── requirements.txt      # Python backend dependencies
│
├── frontend/
│   ├── public/
│   │   ├── model.glb         # Pre-compiled 3D human body mesh with named anatomical zones
│   │   └── favicon.ico       # Application icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx   # Responsive application navigation sidebar
│   │   │   └── ui/           # Reusable UI primitives (buttons, modals, cards)
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Firebase authentication state provider & hooks
│   │   ├── lib/
│   │   │   └── firebase.ts   # Firebase client app initialization
│   │   ├── AchievementsPage.tsx # Gamified recovery badges and milestones
│   │   ├── AnalyticsPage.tsx    # In-depth trend analytics & baseline shift charts
│   │   ├── App.tsx              # Application root, router configuration & protected route wrappers
│   │   ├── CaptureEngine.tsx    # MediaPipe pose capture wizard & real-time CV analytics
│   │   ├── ChatInterface.tsx    # Conversational Twin Chat component
│   │   ├── ClinicPage.tsx       # Medical document analysis & provider sharing portal
│   │   ├── CommunityPage.tsx    # Peer recovery feed & social sharing
│   │   ├── Dashboard.tsx        # Central health telemetry dashboard & quick metrics
│   │   ├── DemoDashboard.tsx    # Unauthenticated interactive demonstration view
│   │   ├── HoloModel3D.tsx      # Three.js Canvas component applying risk shaders to model.glb
│   │   ├── HoloOverlay.tsx      # AR-style holographic visual overlay
│   │   ├── LeaderboardPage.tsx  # Community movement & rehab score ranking
│   │   ├── LoginPage.tsx        # Authentication interface (Google Sign-In + Email/Password)
│   │   ├── MedicationPage.tsx   # Medication and anti-inflammatory adherence tracker
│   │   ├── MentalReadinessPage.tsx # Psychometric readiness & perceived exertion check
│   │   ├── NutritionRecovery.tsx# Hevy workout volume + HealthifyMe nutritional logs
│   │   ├── Onboarding.tsx       # First-time user biometric onboarding wizard
│   │   ├── ProgramsPage.tsx     # Structured multi-week physical therapy protocols
│   │   ├── SettingsPage.tsx     # User preferences & account configuration
│   │   ├── SimulatorPanel.tsx   # Interactive what-if activity simulation drawer
│   │   ├── TwinPage.tsx         # Comprehensive Digital Twin hub (3D model, radar, insights)
│   │   ├── VitalsPage.tsx       # Resting heart rate, HRV, SpO2, and skin temperature logs
│   │   ├── WikiPage.tsx         # Physical therapy & sports-science knowledge repository
│   │   ├── WorkoutStrain.tsx    # Muscular strain & ACWR heatmap viewer
│   │   ├── api.ts               # Typed frontend HTTP client interfacing backend API
│   │   ├── index.css            # Global CSS styles & Tailwind v4 token configurations
│   │   └── main.tsx             # React application entrypoint
│   ├── package.json             # Frontend dependencies and development scripts
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript compiler configuration
│   └── vite.config.ts           # Vite configuration with basic-ssl HTTPS plugin
│
├── .env.example                 # Example environment variable specifications
├── DOCUMENTATION.md             # Complete technical architecture specification
├── PITCH_DECK.md                # Product pitch, commercial strategy & presentation deck
├── README.md                    # Project documentation & setup guide (this file)
└── tunnel.js                    # Localtunnel developer helper script for mobile testing
```

---

## 🧮 Biomechanical Models & Mathematical Foundations

PhysioTwin combines quantitative kinematics with sports-science load formulas:

### 1. Kinematic Joint Angle Calculation
For three consecutive 3D joint landmarks A(x1, y1, z1), B(x2, y2, z2) (vertex), and C(x3, y3, z3), the joint angle θ is computed via vector dot product:

- Vector u = A - B = (x1 - x2, y1 - y2, z1 - z2)
- Vector v = C - B = (x3 - x2, y3 - y2, z3 - z2)
- θ = arccos( (u · v) / (|u| × |v|) ) × (180 / π)

### 2. Bilateral Coronal Symmetry (S_bilateral)
Evaluates asymmetry between contralateral joint pairs (e.g. left vs. right knee flexion or shoulder elevation):

- S_bilateral = 1.0 - min( 1.0, |θ_left - θ_right| / max(θ_left, θ_right) )

A score of `1.0` represents perfect bilateral symmetry.

### 3. Postural Stability Score (S_stability)
Measures center-of-mass sway variance during static holds or dynamic transitions:

- S_stability = max( 0.0, 1.0 - k × σ²_CoM )

where σ²_CoM is the spatial variance of midpoint hip/shoulder coordinates across video frames.

### 4. Holistic Capability Profile (6-Dimensional Vector)
The capability state vector C = [Mobility, Stability, Quality, Cardiovascular, Recovery, Reserve] is computed over rolling sessions:
- **Mobility (M):** Mean active Range of Motion normalized to normative physiological ranges (0 to 100).
- **Stability (S):** Mean stability score × 100.
- **Quality (Q):** Mean bilateral symmetry score × 100.
- **Cardiovascular Efficiency (C):** Exertion response vs. recovery baseline (0 to 100).
- **Recovery State (R):** Base recovery modified by nutritional support and workout strain:
  - R = clamp(0, 100, R_base - 5 × N_heavy_workouts + 3 × N_high_protein_days)
- **Capability Reserve (Reserve):** Metabolic energy buffer available before fatigue-induced kinematic breakdown occurs:
  - Reserve = clamp(0, 100, Reserve_base - 3 × N_heavy_workouts + 2 × N_high_protein_days)

### 5. Anatomical Zone Risk Formulas
Joint risks are computed dynamically from angular deviations:
- **Knee Joint Risk:** Z_knee = min(100, 20 + θ_hip_tilt × 5)
- **Lumbar Spine Risk:** Z_lumbar = min(100, 30 + (θ_shoulder_tilt + θ_hip_tilt) × 2)
- **Cervical Spine Risk:** Z_cervical = min(100, 30 + θ_forward_head × 3)
- **Shoulder Girdle Risk:** Z_shoulder = min(100, 20 + θ_shoulder_tilt × 4)

### 6. Acute-to-Chronic Workload Ratio (ACWR)
Used to monitor training load progression from connected workout apps (Hevy):

- ACWR = (Acute Workload: Last 7 Days Rolling Volume) / (Chronic Workload: Last 28 Days Rolling Volume / 4)

- **Less than 0.8:** Under-training / fitness decay
- **0.8 to 1.3:** Optimal "Sweet Spot" (minimal injury risk)
- **1.3 to 1.5:** Elevated Caution Zone
- **Greater than 1.5:** "Danger Zone" (exponentially increased soft-tissue injury risk)

---

## 🗄️ Database Architecture & Schema

All application data is persisted in SQLite via SQLAlchemy ORM (`backend/models.py`):

```
+------------------+         +--------------------+         +------------------------+
|      users       |1       *|  sensor_sessions   |1       *|     fused_sessions     |
|------------------|---------|--------------------|---------|------------------------|
| user_id (PK)     |         | session_id (PK)    |         | session_id (PK)        |
| email            |         | user_id (FK)       |         | sensor_session_id (FK) |
| age, sex         |         | heart_rate, spo2   |         | vision_session_id (FK) |
| height, weight   |         | temperature        |         | fused_confidence       |
| mode, goals      |         | accel_x, y, z      |         +------------------------+
+--------+---------+         +--------------------+                     ^
         |1                                                             |
         |                   +--------------------+                     |
         |                  *|  vision_sessions   |1                    |
         +-------------------|--------------------|---------------------+
         |                   | session_id (PK)    |
         |                   | user_id (FK)       |
         |                   | task_type, rom     |
         |                   | symmetry, stability|
         |                   | joint_angles_json  |
         |                   +--------------------+
         |1
         |                   +-------------------------+
         +------------------*|   capability_profiles   |
         |                   |-------------------------|
         |                   | id (PK), user_id (FK)   |
         |                   | mobility, stability     |
         |                   | quality, recovery       |
         |                   | zone_risks (JSON)       |
         |                   +-------------------------+
         |1
         |                   +-------------------------+    +------------------------+
         +------------------*|  external_app_sessions  |    |       twin_notes       |
                             |-------------------------|    |------------------------|
                             | id (PK), user_id (FK)   |    | id (PK), user_id (FK)  |
                             | app_name (Hevy/Health)  |    | type (weekly/insights) |
                             | session_data (JSON)     |    | content (Markdown)     |
                             +-------------------------+    +------------------------+
```

### Table Definitions
- **`users`:** Core user profiles, physical demographics (height, weight, age, sex), mode, and consent flags.
- **`sensor_sessions`:** Raw physiological telemetry (Heart rate, blood oxygen $\text{SpO}_2$, temperature, 3-axis accelerometer).
- **`vision_sessions`:** Computer vision assessment records (task type, landmark vectors, joint angles, measured ROM, symmetry, stability).
- **`fused_sessions`:** Interlinked multimodal records joining sensor and vision sessions with confidence indices.
- **`capability_profiles`:** Snapshot records of physical capability scores, zone risk JSON maps, and weekly trend points.
- **`baseline_history`:** Rolling historical mean and standard deviation per metric for anomaly detection.
- **`change_points`:** Recorded persistent deviations and kinematic regressions triggering automated clinical alerts.
- **`external_app_sessions`:** Cached sync blobs from external providers (Hevy workouts & HealthifyMe nutrition).
- **`twin_notes`:** Persistent LLM-generated weekly summaries, clinician case notes, and automated system flags.
- **`leaderboard`:** Gamified community scoring and rank progression.

---

## 🔌 Complete REST API Reference

Base URL: `http://localhost:8000`  
Interactive OpenAPI Explorer: `http://localhost:8000/docs`

### 1. System & Authentication
| Method | Endpoint | Description | Request Payload |
|---|---|---|---|
| `GET` | `/` | API Health check | *None* |
| `POST` | `/users/` | Create or register user profile | `UserCreate` (user_id, email, age, sex, height, weight, mode, goals, consent) |
| `GET` | `/users/{user_id}` | Retrieve user profile by Firebase UID | *None* |

### 2. Biomechanical & Vision Ingestion
| Method | Endpoint | Description | Request Payload |
|---|---|---|---|
| `POST` | `/sessions/vision` | Ingest completed CV session & trigger profile recalculation | `VisionSessionCreate` (task_type, pose_landmarks_json, joint_angles_json, rom, symmetry, stability, camera_quality) |
| `GET` | `/sessions/history/{user_id}` | Retrieve chronological list of past movement sessions | *None* |

### 3. Analytics & Clinical Intelligence
| Method | Endpoint | Description | Request Payload |
|---|---|---|---|
| `GET` | `/analytics/dashboard/{user_id}` | Fetch current capability scores, 20-zone risks & trends | *None* |
| `POST` | `/analytics/weekly-letter/{user_id}` | Generate AI weekly summary via Groq LLaMA 3.1 | *None* |
| `POST` | `/analytics/deep-insights/{user_id}` | Generate full clinical biomechanical report | *None* |
| `POST` | `/analytics/chat/{user_id}` | Interactive chat with the context-aware Digital Twin | `{"messages": [{"role": "user", "content": "string"}]}` |
| `POST` | `/analytics/simulate/{user_id}` | Simulate capability & recovery drain of a planned activity | `{"activity_type": "running", "duration_mins": 45, "intensity": "Hard"}` |
| `POST` | `/analytics/dynamic-risk` | Calculate dynamic risk adjustments from fit/nutrition data | `{"base_risk": {...}, "fit_data": {...}}` |

### 4. External Integrations & Diagnostics
| Method | Endpoint | Description | Request Payload |
|---|---|---|---|
| `GET` | `/sensors/synthetic` | Fetch single simulated physiological sensor reading | `?exertion=0.0..1.0` |
| `GET` | `/analytics/external-apps/{user_id}` | Fetch synced Hevy and HealthifyMe fitness/nutrition data | *None* |
| `POST` | `/analytics/external-apps/{user_id}` | Sync external workout and nutrition data | `{"workouts": [...], "nutrition": {...}}` |
| `GET` | `/analytics/leaderboard` | Retrieve community leaderboard rankings | *None* |
| `POST` | `/reports/analyze/{user_id}` | Ingest and analyze medical diagnostics (PDF/Image) | `multipart/form-data` with `file` |

---

## 🖥️ Frontend Architecture & Application Routes

### Route Matrix
All routes are declared in `frontend/src/App.tsx`:

| Path | Component | Protected | Purpose |
|---|---|---|---|
| `/` | `LandingPage` | No | Marketing hero, feature breakdown, live previews |
| `/login` | `LoginPage` | No | Google Sign-In & Email/Password authentication |
| `/register` | `LoginPage` | No | Account registration interface |
| `/onboarding` | `Onboarding` | No | Demographics, baseline setup, and goals selection |
| `/capture` | `CaptureEngine` | No | Real-time MediaPipe computer vision assessment wizard |
| `/demo` | `DemoDashboard` | No | Interactive unauthenticated sandbox demonstration |
| `/dashboard` | `Dashboard` | **Yes** | Primary dashboard with capability metrics & quick links |
| `/twin` | `TwinPage` | **Yes** | Full 3D Digital Twin avatar, Holo heatmap, radar & chat |
| `/history` | `TwinPage` | **Yes** | Chronological historical session telemetry |
| `/projection` | `TwinPage` | **Yes** | Predictive recovery trajectory view |
| `/nutrition-recovery`| `NutritionRecovery` | **Yes** | Hevy workout logs + HealthifyMe nutrition analytics |
| `/muscular-strain` | `WorkoutStrain` | **Yes** | ACWR calculation & muscular overuse map |
| `/programs` | `ProgramsPage` | **Yes** | Prescribed rehabilitation & corrective protocols |
| `/clinic` | `ClinicPage` | **Yes** | Medical report intake & clinician data sharing |
| `/leaderboard` | `LeaderboardPage` | **Yes** | Community fitness & consistency leaderboards |
| `/achievements` | `AchievementsPage` | **Yes** | Unlockable recovery & performance milestones |
| `/analytics` | `AnalyticsPage` | **Yes** | Deep longitudinal kinematic trend graphs |
| `/vitals` | `VitalsPage` | **Yes** | Physiological vitals and baseline monitoring |
| `/readiness` | `MentalReadinessPage` | **Yes** | Psychometric readiness and fatigue assessment |
| `/meds` | `MedicationPage` | **Yes** | Medication and anti-inflammatory schedule tracker |
| `/wiki` | `WikiPage` | **Yes** | Biomechanics, anatomy, and physical therapy wiki |
| `/settings` | `SettingsPage` | **Yes** | User account, preferences, and privacy controls |

---

## 🚀 Step-by-Step Installation & Local Setup

### System Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** 3.11.0 or higher
- **Git:** Installed and on system `PATH`
- **Webcam:** Connected (required for MediaPipe capture)

---

### 1. Clone the Repository
```bash
git clone https://github.com/kamaleshramesh7275-cloud/regi-twin.git
cd regi-twin
```

---

### 2. Backend Setup
Navigate to the `backend` folder, create a Python virtual environment, install dependencies, and start the FastAPI server:

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (cmd):
venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install groq trimesh

# (Optional) Generate the 3D human body mesh if model.glb is missing
python generate_model.py

# Start the FastAPI ASGI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
> The API server will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup
Open a new terminal window, navigate to the `frontend` folder, install dependencies, and launch Vite:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server with HTTPS (required for webcam permissions)
npm run dev
```
> The web application will be accessible at `https://localhost:5173`. Accept the self-signed SSL certificate provided by `@vitejs/plugin-basic-ssl` to enable webcam capture in your browser.

---

## 🔐 Environment Variables Configuration

### Frontend Configuration (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

### Backend Configuration (`backend/.env` or Shell Environment)
```env
GROQ_API_KEY="gsk_your_groq_api_key_here"
PYTHON_VERSION="3.11.0"
```

---

## 🌐 Production Deployment & Tunneling

### Unified Deployment on Render
PhysioTwin is engineered for unified deployment as a single Web Service on [Render](https://render.com):

1. Link your GitHub repository to a new **Web Service** on Render.
2. Select **Python 3** as the runtime environment.
3. Configure the build and start commands:
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt && pip install groq trimesh && cd frontend && npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
4. Add your `GROQ_API_KEY` and Firebase `VITE_*` environment variables in the Render dashboard.

### Mobile Testing via Tunnels
To test real-time camera capture on a physical smartphone or tablet:

#### Option A: Localtunnel
```bash
# Run from repository root
node tunnel.js
```

#### Option B: ngrok
```bash
# Forward port 5173 with valid HTTPS
ngrok http https://localhost:5173 --host-header="localhost:5173"
```

---

## 🔬 Limitations & Future Roadmap

| Domain | Current Implementation | Production Roadmap |
|---|---|---|
| **Sensor Hardware** | Synthetic first-order lag generator (`mock_sensor.py`) | ESP32 BLE firmware with MAX30102 (HR/SpO2) and MPU6050 (IMU) streaming |
| **Medical Reports** | Mocked diagnostic parser | Document AI / OCR pipeline parsing DICOM metadata and radiology PDFs |
| **Database** | Embedded SQLite (`physiotwin.db`) | Managed PostgreSQL instance with Alembic schema migration pipelines |
| **External Apps** | Seeded realistic JSON structures | Live OAuth2 webhooks directly syncing with Hevy & Apple Health / Google Health Connect |
| **Injury Prediction** | Heuristic kinematic risk formulas | Deep learning temporal CNN trained on normative clinical kinematic datasets |
| **Offline Support** | Standard Vite PWA caching | Complete offline WebAssembly pose processing and local IndexedDB queuing |

---

## 📜 License & Medical Disclaimer

### License
This project is open-source and available under the **MIT License**.

### ⚠️ Medical Disclaimer
> **IMPORTANT NOTICE:** PhysioTwin is an experimental sports-science, biomechanical analysis, and educational platform. It is **not** a certified medical diagnostic device and is **not intended** to replace professional clinical evaluation, medical diagnosis, surgery recommendations, or individualized physical therapy treatment plans. Always consult a qualified physician, orthopedic surgeon, or licensed physical therapist before beginning any new rehabilitation or exercise protocol.

---

<p align="center">
  <b>Built with ❤️ by Kamalesh Ramesh & the PhysioTwin Team</b><br>
  <i>Empowering recovery through human-centric digital twins.</i>
</p>
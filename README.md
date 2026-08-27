# PhysioTwin 

The Digital Twin of Your Recovery. PhysioTwin is an advanced sports-science and physiotherapy platform that builds a 3D biomechanical model of your body to predict injuries, optimize tissue repair, and return athletes to sport faster.

##  Video Demo
[Watch the PhysioTwin Video Demo here](https://drive.google.com/file/d/1Gyfq_DeAfjbFYifYRk9BRmKfBbe_jCRK/view?usp=drivesdk)

---

##  Key Features

- **Computer Vision Diagnostics**: Real-time pose estimation using MediaPipe to measure Range of Motion (ROM), joint symmetry, and movement stability directly from a smartphone camera.
- **Wearable Data Integration**: Syncs with Google Fit, Apple Health, Garmin, and Fitbit to track heart rate, HRV, sleep, and recovery metrics.
- **AI Injury Risk Prediction**: Utilizes LLMs (Groq) to analyze acute-to-chronic workload ratios (ACWR), biomechanical flaws, and recovery data to predict injury probabilities for specific joints.
- **Dynamic Rehab Programs**: Automatically generates personalized, multi-week corrective exercise protocols based on identified weak points.
- **Clinic Dashboard**: A centralized roster for physiotherapists to monitor multiple athletes, prioritize high-risk patients, and review AI-generated case notes.
- **Progressive Web App (PWA)**: Installable on mobile devices with offline capabilities and caching.

---

##  Tech Stack

**Frontend:**
- React 18 & TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling & Animations)
- Recharts (Data Visualization)
- Firebase Auth (Authentication)
- Vite PWA (Service Workers)

**Backend:**
- FastAPI (Python Web Framework)
- SQLAlchemy & SQLite (Database & ORM)
- Groq API (High-speed LLM inference for medical analysis)
- MediaPipe (Computer Vision)

---

##  Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python 3.11+

### 1. Clone the repository
```bash
git clone https://github.com/kamaleshramesh7275-cloud/regi-twin.git
cd regi-twin
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

---

## Environment Variables

For the application to function fully, you need to configure the following environment variables.

**Frontend (`frontend/.env`):**
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-domain.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-bucket.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

**Backend (Render / Production):**
```env
GROQ_API_KEY="your-groq-api-key"
PYTHON_VERSION="3.11.0"
```

---


PhysioTwin is configured to be deployed as a unified Web Service on Render. 

1. Create a new **Web Service** on Render connected to this repository.
2. Leave the **Root Directory** blank.
3. Set the Environment to **Python 3**.
4. **Build Command:**
   ```bash
   pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
   ```
5. **Start Command:**
   ```bash
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Add your environment variables (Firebase + Groq) in the Render dashboard.

---

##  License
This project is for demonstration and educational purposes. Not intended for actual medical diagnosis. Always consult a qualified healthcare professional.
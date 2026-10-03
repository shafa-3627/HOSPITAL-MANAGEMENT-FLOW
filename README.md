# YODHA 2.0 — Predictive Hospital Flow Management System

> **Track:** AI for Healthcare  
> **Institution:** V.S.B. Engineering College, Karur  
> **Team:** The Crew (RITHISH T, RITHIKAN T, RAMJI S, SHAFAAT Muhammad S)  
> **Tagline:** *"Don't wait for hospital congestion. Predict it. Explain it. Simulate it. Act before it happens."*

---

## 🏥 Product Vision

YODHA 2.0 is a **predictive and prescriptive hospital-flow control tower** designed to forecast demand and operational congestion **4–24 hours ahead**, explain the root causes using Machine Learning, simulate intervention strategies in a Digital Twin environment, recommend corrective actions, and enforce human decision approval with full audit logging.

### Core Philosophy
- **AI recommends. Human decides.**
- Decision-support prototype, NOT an autonomous clinical decision-making system.
- Synthetic and anonymized operational demo dataset.

---

## 🔄 End-to-End Operational Lifecycle

```
INGEST ➔ FORECAST ➔ OPTIMIZE ➔ EXPLAIN ➔ ALERT ➔ SIMULATE ➔ RECOMMEND ➔ HUMAN APPROVAL ➔ ACT ➔ AUDIT ➔ LEARN
```

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, React Router v6, Zustand State Management
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0
- **Database:** SQLite (zero-config local development, PostgreSQL ready)
- **AI/ML Engine:** Python, `scikit-learn` (Gradient Boosting Flow Predictor), `pandas`, `numpy`, Modular `BaseForecastModel` abstraction layer (LSTM/TFT ready)

---

## 📁 Repository Structure

```
yodha2/
├── backend/
│   ├── app/
│   │   ├── api/          # 27 REST API Endpoints (auth, beds, forecast, simulation, copilot, etc.)
│   │   ├── models/       # SQLAlchemy Data Models (User, Bed, Patient, Forecast, Audit, etc.)
│   │   ├── schemas/      # Pydantic Schemas
│   │   ├── config.py     # Application Configuration
│   │   ├── database.py   # Database Session & Engine setup
│   │   └── main.py       # FastAPI Entry Point & CORS Middleware
│   ├── tests/            # Pytest test suite
│   ├── seed.py           # Deterministic Synthetic Data Generator
│   ├── pytest.ini        # Pytest Configuration
│   └── requirements.txt  # Python Backend Dependencies
├── ml/
│   ├── forecast_engine.py # GradientBoosting & MovingAverage Predictors
│   └── models.py
└── frontend/
    ├── src/
    │   ├── components/   # UI Primitives, Layout (Sidebar/Header), Charts & Shared Badges
    │   ├── pages/        # 30 Functional Pages (CommandCenter, DigitalTwin, AICopilot, etc.)
    │   ├── services/     # Axios API Client
    │   ├── stores/       # Zustand State Management (authStore, themeStore, demoStore, etc.)
    │   ├── types/        # TypeScript Interfaces
    │   └── utils/        # Utility Functions & Formatters
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API server will run at: `http://127.0.0.1:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will run at: `http://localhost:5173`*

### 3. Verification & Testing
```bash
# Run Backend Pytest Suite
cd backend
python -m pytest

# Build Production Frontend
cd frontend
npm run build
```

---

## 🔐 Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Hospital Administrator** | `admin` | `admin123` |
| **Doctor** | `doctor` | `doctor123` |
| **Nurse / Staff** | `nurse` | `nurse123` |
| **Bed Manager** | `bedmgr` | `bedmgr123` |
| **Emergency Coordinator** | `emergency` | `emerg123` |

---

## 🎯 Hackathon Judge Demo Workflow (13-Step Guided Tour)

1. **Step 1: Command Center** — View YODHA Flow Health Score (85/100) & dynamic department capacity gauges.
2. **Step 2: Simulate ICU Surge** — Click "Simulate ICU Surge" scenario from the banner/judge demo trigger.
3. **Step 3: Forecast Horizon** — AI Forecast engine detects upcoming 97% ICU saturation in 6 hours.
4. **Step 4: Crisis Center** — Crisis alert automatically triggers with probability score and key drivers.
5. **Step 5: Explainable AI** — Open SHAP-style explanation panel showing root cause contributions (ED arrivals +18%, low discharge rate -25%).
6. **Step 6: Digital Twin** — Open What-If Simulator to evaluate interventions before deploying.
7. **Step 7: Test Intervention** — Adjust extra beds (+3) and nurse reallocation (+2) sliders.
8. **Step 8: AI Optimization** — View ranked prescriptive recommendations with expected risk reduction.
9. **Step 9: Human Approval** — Click "Approve Recommendation".
10. **Step 10: State Update** — Operational state updates dynamically across Bed Management and Capacity cards.
11. **Step 11: Audit Trail** — Action is recorded in immutable Audit Trail with user role, timestamp, before/after states.
12. **Step 12: Morning Brief & Reports** — Inspect AI-generated operational summary.
13. **Step 13: Impact Estimator** — View projected annual operational savings and boarding reduction.

---

## ⚠️ Healthcare & Safety Disclaimer

*YODHA 2.0 is a hackathon prototype developed for decision-support demonstration using synthetic data. It is not a medical device, diagnostic tool, or substitute for qualified clinical judgment.*

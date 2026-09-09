# কৃষি ফলন ব্যবস্থাপনা সিস্টেম (CropYield)

**AI-Based Crop Production and Yield Forecasting Management System**

A full-stack thesis project for Prime University (Apurba Sarker, ID 201030101033).

- **Frontend:** React.js (Vite) + Tailwind CSS + Leaflet map + Recharts — fully in Bengali
- **Backend:** Node.js (Express) + PostgreSQL
- **ML Service:** Python (FastAPI + Scikit-learn + XGBoost)
- **Roles:** কৃষক (Farmer) · কৃষি কর্মকর্তা (Agriculture Officer) · অ্যাডমিন (Admin)

> **Status:** Production-ready with AI/ML features. The yield forecasting, disease
> detection, and crop recommendation modules are backed by a Python ML microservice
> with graceful fallback to rule-based estimation when the ML service is unavailable.

## Modules

Dashboard · Farmer management · Land management (with map) · Crop management ·
Weather (live API or simulated) · **AI yield forecast** · **AI crop recommendation** ·
Soil analysis · **AI disease detection** (photo upload) · Fertilizer & irrigation advice ·
Market prices (with trend charts) · Notifications · Reports · Admin/user management ·
**AI monitoring** · Bengali UI

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend   │ ──▶ │   Backend (Node) │ ──▶ │  PostgreSQL DB   │
│  React/Vite  │ ◀── │  Express :5000   │ ◀── │                  │
└──────────────┘     └────────┬─────────┘     └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ML Service      │
                    │ Python :8001     │
                    │ FastAPI          │
                    │ XGBoost          │
                    │ Scikit-learn     │
                    └──────────────────┘
```

## Setup

### 1. Database

Requires PostgreSQL. Create the database and load schema + seed data:

```bash
cd backend
cp .env.example .env
# edit .env → set DATABASE_URL (default: postgresql://postgres@127.0.0.1:5433/cropyield)
npm install
npm run db:init          # schema + seed (seed only if empty)
npm run db:init -- --force   # wipe and re-seed (only default accounts)
```

### 2. ML Service (Python)

```bash
cd ml-service
bash setup.sh                # creates venv + installs deps
source venv/bin/activate
uvicorn main:app --reload --port 8001   # http://localhost:8001
```

### 3. Backend

```bash
cd backend
npm run dev               # http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### 5. One-command start

```bash
./start-services.sh        # starts ML + backend + frontend
```

## Default accounts

| Role | Email | Password |
| --- | --- | --- |
| অ্যাডমিন | admin@cropyield.com | admin123 |
| কৃষি কর্মকর্তা | officer@cropyield.com | officer123 |
| কৃষক | farmer@cropyield.com | farmer123 |

> **Note:** The complete demo/seed data (crops, lands, reports, etc.) has been removed.
> All data is now entered through the application by real users.

## ML Features

### AI Yield Forecasting
- Uses XGBoost / Random Forest / Gradient Boosting (per thesis)
- Trains on historical production data (`yield_training_data` table)
- Falls back to rule-based estimation when model is untrained
- Shows confidence score and method (AI vs rule-based)

### AI Disease Detection
- Upload leaf/fruit photos for instant disease identification
- Knowledge base of 11 common Bangladesh crop diseases
- Returns disease name, symptoms, treatment, severity, confidence
- Model can be trained with labeled image data

### AI Crop Recommendation
- Recommends best crop for a given land based on soil, weather, season
- Supports 13 common Bangladesh crops
- Knowledge-base + ML classifier hybrid approach
- Stores recommendation history per land

### AI Monitoring (Admin)
- View ML service health
- Track all AI predictions with confidence scores
- Model usage summary

## Project structure

```
cropyield/
├── backend/
│   ├── db/              schema.sql, seed.sql
│   ├── src/
│   │   ├── routes/      Express API routes (17 modules)
│   │   ├── services/    weather, advisories, forecast, ML bridge
│   │   ├── middleware/  JWT + role guard
│   │   └── scripts/     initDb.js
│   └── .env.example
├── ml-service/
│   ├── models/          yield, disease, crop recommendation models
│   ├── routers/         FastAPI endpoints
│   ├── training/        model training scripts
│   ├── saved_models/    trained model files
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/       17 Bangla pages (incl. AI)
        ├── components/  Layout, MapPicker, UI kit
        ├── context/     AuthContext (JWT)
        └── api/         axios client
```

## Weather API (optional)

The system works offline with simulated weather. To use a live third-party API, set
values in `backend/.env`:

```
WEATHER_API_URL=https://api.openweathermap.org/data/2.5
WEATHER_API_KEY=your_key_here
```

No key ⇒ simulated weather is used automatically.

## Training the ML models

Once enough production/harvest data is collected via the app, train the yield model:

```bash
cd ml-service
source venv/bin/activate
python training/train_models.py     # trains global + per-crop yield models
```

To train the disease classifier, collect labeled leaf images and post them to
`POST /api/disease/train` (through the AI monitoring admin panel or API).

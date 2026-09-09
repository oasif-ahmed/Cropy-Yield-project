import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import yield_router, disease_router, recommend_router

app = FastAPI(
    title="CropYield ML Service",
    description="AI-Based Crop Production and Yield Forecasting - ML Microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(yield_router.router)
app.include_router(disease_router.router)
app.include_router(recommend_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "cropyield-ml", "version": "1.0.0"}


@app.get("/")
def root():
    return {
        "service": "CropYield ML Microservice",
        "endpoints": [
            "/api/yield/predict",
            "/api/yield/train",
            "/api/disease/detect",
            "/api/disease/diseases",
            "/api/recommend/crop",
        ],
    }

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from models.yield_model import YieldModel

router = APIRouter(prefix="/api/yield", tags=["yield"])


class YieldRequest(BaseModel):
    crop_name: str
    area_bigha: Optional[float] = 1.0
    season: Optional[str] = ""
    soil_ph: Optional[float] = None
    soil_nitrogen: Optional[float] = None
    soil_phosphorus: Optional[float] = None
    soil_potassium: Optional[float] = None
    soil_organic_matter: Optional[float] = None
    avg_temperature_c: Optional[float] = None
    total_rainfall_mm: Optional[float] = None
    avg_humidity: Optional[int] = None


@router.get("/health")
def health():
    return {"status": "ok", "service": "yield-prediction"}


@router.post("/predict")
def predict_yield(req: YieldRequest):
    model = YieldModel(req.crop_name)
    data = req.dict()
    result = model.predict(data)
    result["crop_name"] = req.crop_name
    result["area_bigha"] = req.area_bigha
    result["total_kg"] = round(result["per_bigha_kg"] * (req.area_bigha or 1.0), 1)
    return result


@router.post("/train")
def train_model(payload: dict):
    """Train model from collected data (called by admin)."""
    samples = payload.get("samples", [])
    if not samples:
        return {"error": "No training samples provided"}

    from models.yield_model import build_feature_vector

    X = [build_feature_vector(s) for s in samples]
    y = [float(s.get("yield_per_bigha_kg", 0)) for s in samples if s.get("yield_per_bigha_kg")]

    if len(y) < 10:
        return {"error": "Need at least 10 training samples"}

    model_type = payload.get("model_type", "xgboost")
    # Filter out invalid rows
    X_valid, y_valid = [], []
    for xi, yi in zip(X, y):
        if yi > 0:
            X_valid.append(xi)
            y_valid.append(yi)

    if len(y_valid) < 10:
        return {"error": "Need at least 10 valid training samples"}

    import numpy as np
    crop = payload.get("crop_name")
    m = YieldModel(crop)
    res = m.train(np.array(X_valid), np.array(y_valid), model_type=model_type)
    return res

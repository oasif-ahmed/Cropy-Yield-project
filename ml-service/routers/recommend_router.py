from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from models.crop_recommendation_model import CropRecommendationModel

router = APIRouter(prefix="/api/recommend", tags=["recommend"])

recommender = CropRecommendationModel()


class RecommendRequest(BaseModel):
    soil_ph: Optional[float] = None
    soil_nitrogen: Optional[float] = None
    soil_phosphorus: Optional[float] = None
    soil_potassium: Optional[float] = None
    soil_organic_matter: Optional[float] = None
    soil_type: Optional[str] = ""
    season: Optional[str] = ""
    avg_temperature_c: Optional[float] = None
    total_rainfall_mm: Optional[float] = None
    avg_humidity: Optional[int] = None
    water_availability: Optional[str] = ""


@router.get("/health")
def health():
    return {"status": "ok", "service": "crop-recommendation"}


@router.post("/crop")
def recommend_crop(req: RecommendRequest):
    return recommender.predict(req.dict())


@router.post("/train")
def train_recommender(payload: dict):
    """Train the recommender from labeled samples."""
    samples = payload.get("samples", [])
    if not samples:
        return {"error": "No training samples provided"}

    from models.yield_model import build_feature_vector

    X = [build_feature_vector(s) for s in samples]
    y = [s.get("recommended_crop") for s in samples if s.get("recommended_crop")]

    if len(y) < 5:
        return {"error": "Need at least 5 valid samples"}

    import numpy as np
    from sklearn.ensemble import RandomForestClassifier

    model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
    model.fit(np.array(X), y)
    classes = model.classes_.tolist()

    import joblib
    from config import MODELS_DIR
    import os
    joblib.dump({"model": model, "classes": classes},
                os.path.join(MODELS_DIR, "crop_recommender.joblib"))
    return {"status": "trained", "classes": classes, "n_samples": len(y)}

from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from models.disease_model import DiseaseModel

router = APIRouter(prefix="/api/disease", tags=["disease"])

disease_model = DiseaseModel()


@router.get("/health")
def health():
    return {"status": "ok", "service": "disease-detection"}


@router.get("/diseases")
def list_diseases():
    from models.disease_model import DISEASE_KNOWLEDGE
    return {
        "diseases": [
            {"name": name, **info} for name, info in DISEASE_KNOWLEDGE.items()
        ]
    }


@router.post("/detect")
async def detect_disease(
    file: UploadFile = File(...),
    crop_name: Optional[str] = Form(None),
):
    image_bytes = await file.read()
    result = disease_model.predict(image_bytes, crop_name)
    return result


@router.post("/train")
def train_disease_model(payload: dict):
    """Train disease classifier from extracted features."""
    samples = payload.get("samples", [])
    if not samples:
        return {"error": "No training samples provided"}

    import numpy as np
    from models.disease_model import extract_image_features

    X = []
    y = []
    # Samples are expected to be dicts with 'image_bytes' (base64) and 'label'
    for s in samples:
        import base64
        try:
            img_bytes = base64.b64decode(s.get("image_base64", ""))
            feats = extract_image_features(img_bytes)
            X.append(feats)
            y.append(s["label"])
        except Exception:
            continue

    if len(y) < 5:
        return {"error": "Need at least 5 valid training samples"}

    res = disease_model.train(np.array(X), np.array(y))
    return res

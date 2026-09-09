"""
Crop recommendation engine.

Uses a content-based matrix of known yield base rates combined with a
Random Forest classifier to suggest the most suitable crop for a given
land based on soil properties, weather and season.
"""

import os
import joblib
import numpy as np

from config import MODELS_DIR

# Crop suitability knowledge base
# Key: crop name, value: dict of soil/weather suitability
CROP_SUITABILITY = {
    "ধান": {
        "min_ph": 5.5, "max_ph": 7.5, "pref_temp": 25, "water": "high",
        "best_soil": ["পলি দোআঁশ", "কাদা মাটি", "এঁটেল দোআঁশ"],
        "seasons": ["বোরো", "আমন", "আউশ"],
    },
    "গম": {
        "min_ph": 6.0, "max_ph": 7.5, "pref_temp": 18, "water": "medium",
        "best_soil": ["পলি দোআঁশ", "এঁটেল দোআঁশ"],
        "seasons": ["রবি"],
    },
    "ভুট্টা": {
        "min_ph": 5.5, "max_ph": 7.5, "pref_temp": 22, "water": "medium",
        "best_soil": ["পলি দোআঁশ", "বেলে দোআঁশ"],
        "seasons": ["রবি", "খরিপ"],
    },
    "আলু": {
        "min_ph": 5.0, "max_ph": 6.5, "pref_temp": 16, "water": "medium",
        "best_soil": ["বেলে দোআঁশ", "পলি দোআঁশ"],
        "seasons": ["রবি"],
    },
    "চা": {
        "min_ph": 4.5, "max_ph": 6.0, "pref_temp": 20, "water": "low",
        "best_soil": ["এঁটেল দোআঁশ"],
        "seasons": ["বারোমাসি"],
    },
    "পাট": {
        "min_ph": 5.0, "max_ph": 7.0, "pref_temp": 28, "water": "high",
        "best_soil": ["পলি দোআঁশ", "কাদা মাটি"],
        "seasons": ["খরিপ"],
    },
    "সরিষা": {
        "min_ph": 6.0, "max_ph": 7.5, "pref_temp": 20, "water": "low",
        "best_soil": ["পলি দোআঁশ", "এঁটেল দোআঁশ"],
        "seasons": ["রবি"],
    },
    "টমেটো": {
        "min_ph": 5.5, "max_ph": 7.0, "pref_temp": 24, "water": "medium",
        "best_soil": ["পলি দোআঁশ", "বেলে দোআঁশ"],
        "seasons": ["রবি"],
    },
    "পেঁয়াজ": {
        "min_ph": 6.0, "max_ph": 7.5, "pref_temp": 22, "water": "medium",
        "best_soil": ["বেলে দোআঁশ", "পলি দোআঁশ"],
        "seasons": ["রবি"],
    },
    "রসুন": {
        "min_ph": 6.0, "max_ph": 7.0, "pref_temp": 20, "water": "medium",
        "best_soil": ["বেলে দোআঁশ", "পলি দোআঁশ"],
        "seasons": ["রবি"],
    },
    "কাঁচা মরিচ": {
        "min_ph": 5.5, "max_ph": 7.0, "pref_temp": 25, "water": "medium",
        "best_soil": ["পলি দোআঁশ", "বেলে দোআঁশ"],
        "seasons": ["রবি", "খরিপ"],
    },
    "লাউ": {
        "min_ph": 5.5, "max_ph": 7.0, "pref_temp": 26, "water": "high",
        "best_soil": ["পলি দোআঁশ", "কাদা মাটি"],
        "seasons": ["খরিপ"],
    },
    "বাদাম": {
        "min_ph": 5.0, "max_ph": 6.5, "pref_temp": 25, "water": "low",
        "best_soil": ["বেলে দোআঁশ", "পলি মাটি"],
        "seasons": ["রবি", "খরিপ"],
    },
}

AVAILABLE_CROPS = list(CROP_SUITABILITY.keys())


def _score_crop(crop_name, input_data):
    spec = CROP_SUITABILITY[crop_name]
    scores = {}

    # Soil pH score
    ph = input_data.get("soil_ph")
    if ph is not None and float(ph) and float(ph) == float(ph):
        ph_val = float(ph)
        if spec["min_ph"] <= ph_val <= spec["max_ph"]:
            scores["ph"] = 1.0
        elif ph_val < spec["min_ph"] - 0.5 or ph_val > spec["max_ph"] + 0.5:
            scores["ph"] = 0.4
        else:
            scores["ph"] = 0.75
    else:
        scores["ph"] = 0.7

    # Soil type score
    soil_type = input_data.get("soil_type", "")
    if soil_type in spec["best_soil"]:
        scores["soil"] = 1.0
    else:
        scores["soil"] = 0.5

    # Season score
    season = input_data.get("season", "")
    if season and season in spec["seasons"]:
        scores["season"] = 1.0
    elif season == "বারোমাসি":
        scores["season"] = 0.9
    else:
        scores["season"] = 0.5

    # Temperature score
    temp = input_data.get("avg_temperature_c")
    if temp is not None and float(temp) and float(temp) == float(temp):
        t = float(temp)
        diff = abs(t - spec["pref_temp"])
        if diff <= 3:
            scores["temp"] = 1.0
        elif diff <= 8:
            scores["temp"] = 0.8
        else:
            scores["temp"] = 0.5
    else:
        scores["temp"] = 0.75

    # Water availability score
    water = input_data.get("water_availability", "")
    if water:
        if water == spec["water"]:
            scores["water"] = 1.0
        elif (water == "high" and spec["water"] != "low") or \
             (water == "medium" and spec["water"] != "high"):
            scores["water"] = 0.8
        else:
            scores["water"] = 0.5
    else:
        scores["water"] = 0.7

    # Combined score with weights
    weights = {"ph": 0.25, "soil": 0.25, "season": 0.2, "temp": 0.15, "water": 0.15}
    total = sum(scores[k] * weights[k] for k in weights)
    return total, scores


def recommend_crops(input_data: dict, top_n: int = 3) -> list:
    """Return list of recommended crops with scores and reasons."""
    results = []
    for crop in AVAILABLE_CROPS:
        score, breakdown = _score_crop(crop, input_data)
        results.append({
            "crop_name": crop,
            "score": round(score * 100, 1),
            "scores": {k: round(v * 100) for k, v in breakdown.items()},
        })

    results.sort(key=lambda x: x["score"], reverse=True)

    top = results[:top_n]
    for r in top:
        reasons = []
        if r["scores"]["ph"] >= 85:
            reasons.append("মাটির pH উপযুক্ত")
        if r["scores"]["soil"] >= 85:
            reasons.append("মাটির ধরন উপযুক্ত")
        if r["scores"]["season"] >= 85:
            reasons.append("ঋতু উপযুক্ত")
        if r["scores"]["temp"] >= 85:
            reasons.append("তাপমাত্রা অনুকূল")
        if r["scores"]["water"] >= 85:
            reasons.append("জল সরবরাহ নিশ্চিত")
        r["reason"] = ", ".join(reasons) if reasons else "সামগ্রিকভাবে উপযুক্ত"

    return top


class CropRecommendationModel:
    def __init__(self):
        self.model_path = os.path.join(MODELS_DIR, "crop_recommender.joblib")
        self.model = None
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)

    def predict(self, input_data):
        # Try ML classifier if trained, else use knowledge base
        if self.model and self.model.get("model"):
            try:
                from models.yield_model import build_feature_vector
                vec = build_feature_vector(input_data)
                classes = self.model["classes"]
                pred = self.model["model"].predict([vec])[0]
                probs = self.model["model"].predict_proba([vec])[0]
                idx = classes.index(pred) if pred in classes else 0
                return {
                    "method": "ml",
                    "recommendations": [{
                        "crop_name": pred,
                        "score": round(float(max(probs)) * 100, 1),
                        "reason": "Machine Learning মডেল ভিত্তিক সুপারিশ",
                        "scores": {},
                    }],
                }
            except Exception:
                pass

        return {
            "method": "knowledge_base",
            "recommendations": recommend_crops(input_data),
        }

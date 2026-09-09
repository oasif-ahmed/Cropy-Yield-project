"""
Training scripts for the ML models.
Used to train yield prediction, disease detection, and crop recommendation
models from collected data stored in the PostgreSQL database.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
import psycopg2

from config import DATABASE_URL
from models.yield_model import YieldModel, build_feature_vector, CROP_FEATURES
from models.disease_model import DiseaseModel


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def load_yield_training_data(conn):
    query = """
        SELECT
            yt.crop_name, yt.area_bigha, yt.season,
            yt.soil_ph, yt.soil_nitrogen, yt.soil_phosphorus,
            yt.soil_potassium, yt.soil_organic_matter,
            yt.avg_temperature_c, yt.total_rainfall_mm, yt.avg_humidity,
            yt.yield_per_bigha_kg
        FROM yield_training_data yt
        WHERE yt.yield_per_bigha_kg > 0
    """
    return pd.read_sql_query(query, conn)


def train_yield_models():
    conn = get_db_connection()
    df = load_yield_training_data(conn)
    conn.close()

    if df.empty or len(df) < 10:
        print(f"Not enough training data ({len(df)} rows). Need at least 10.")
        return

    print(f"Loaded {len(df)} training samples")

    # Train global model
    X = []
    y = []
    for _, row in df.iterrows():
        feat = build_feature_vector({
            "area_bigha": row["area_bigha"],
            "season": row["season"],
            "soil_ph": row["soil_ph"],
            "soil_nitrogen": row["soil_nitrogen"],
            "soil_phosphorus": row["soil_phosphorus"],
            "soil_potassium": row["soil_potassium"],
            "soil_organic_matter": row["soil_organic_matter"],
            "avg_temperature_c": row["avg_temperature_c"],
            "total_rainfall_mm": row["total_rainfall_mm"],
            "avg_humidity": row["avg_humidity"],
        })
        y_val = row["yield_per_bigha_kg"]
        if y_val and y_val > 0:
            X.append(feat)
            y.append(float(y_val))

    if len(y) >= 10:
        model = YieldModel(None)
        res = model.train(np.array(X), np.array(y), model_type="xgboost")
        print(f"Global model: {res}")

        # Per-crop models
        for crop in df["crop_name"].unique():
            crop_df = df[df["crop_name"] == crop]
            if len(crop_df) < 10:
                continue
            Xc, yc = [], []
            for _, row in crop_df.iterrows():
                feat = build_feature_vector({
                    "area_bigha": row["area_bigha"],
                    "season": row["season"],
                    "soil_ph": row["soil_ph"],
                    "soil_nitrogen": row["soil_nitrogen"],
                    "soil_phosphorus": row["soil_phosphorus"],
                    "soil_potassium": row["soil_potassium"],
                    "soil_organic_matter": row["soil_organic_matter"],
                    "avg_temperature_c": row["avg_temperature_c"],
                    "total_rainfall_mm": row["total_rainfall_mm"],
                    "avg_humidity": row["avg_humidity"],
                })
                yc.append(float(row["yield_per_bigha_kg"]))
            cm = YieldModel(crop)
            res = cm.train(np.array(Xc), np.array(yc))
            print(f"  {crop}: {res}")
    else:
        print("Not enough valid samples for training")


if __name__ == "__main__":
    train_yield_models()
    print("Done.")

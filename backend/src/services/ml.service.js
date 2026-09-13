// ============================================================
// ML Service Bridge
// Bridges the Node.js backend to the Python FastAPI ML service.
// Handles yield prediction, disease detection, and crop recommendations.
// Falls back gracefully if the ML service is unavailable.
// ============================================================

import { config } from '../config.js';
import { query } from '../db.js';

const ML_BASE = config.ml.url || 'http://127.0.0.1:8001';
const ML_ENABLED = config.ml.enabled === true || config.ml.enabled === 'true';

const MODEL_VERSION = '1.0.0';

async function mlFetch(path, options = {}) {
  if (!ML_ENABLED) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${ML_BASE}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function logPrediction({ modelType, entityType, entityId, prediction, confidence, inputFeatures }) {
  try {
    return query(
      `INSERT INTO ai_predictions (model_type, entity_type, entity_id, prediction, confidence, model_version, input_features)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        modelType,
        entityType,
        entityId || null,
        JSON.stringify(prediction),
        confidence != null ? confidence : null,
        MODEL_VERSION,
        inputFeatures ? JSON.stringify(inputFeatures) : null,
      ]
    );
  } catch {
    // Non-fatal: prediction logging should never break a request
    return Promise.resolve();
  }
}

// ------------------------------------------------------------
// Yield prediction
// ------------------------------------------------------------
export async function predictYield(crop, soil = null, weatherData = null) {
  const input = {
    crop_name: crop.name,
    area_bigha: Number(crop.area_bigha ?? crop.area_bigha ?? 0),
    season: crop.season || '',
    soil_ph: soil?.ph ?? null,
    soil_nitrogen: soil?.nitrogen ?? null,
    soil_phosphorus: soil?.phosphorus ?? null,
    soil_potassium: soil?.potassium ?? null,
    soil_organic_matter: soil?.organic_matter ?? null,
    avg_temperature_c: weatherData?.temperature_c ?? null,
    total_rainfall_mm: weatherData?.rainfall_mm ?? null,
    avg_humidity: weatherData?.humidity ?? null,
  };

  const mlResult = await mlFetch('/api/yield/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (mlResult && mlResult.per_bigha_kg) {
    logPrediction({
      modelType: 'yield',
      entityType: 'crop',
      entityId: crop.id,
      prediction: mlResult,
      confidence: Math.round(Number(mlResult.confidence) * 100),
      inputFeatures: input,
    });
    return mlResult;
  }

  return null;
}

// ------------------------------------------------------------
// Disease detection from image
// ------------------------------------------------------------
export async function detectDisease(imageMultipart, cropName) {
  if (!ML_ENABLED) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const formData = new FormData();
    let blob;
    if (imageMultipart.buffer) {
      blob = new Blob([imageMultipart.buffer], { type: imageMultipart.mimetype || 'image/jpeg' });
    } else {
      const fs = await import('node:fs');
      const buf = fs.readFileSync(imageMultipart.path);
      blob = new Blob([buf], { type: imageMultipart.mimetype || 'image/jpeg' });
    }
    formData.append('file', blob, imageMultipart.originalname || 'upload.jpg');
    if (cropName) formData.append('crop_name', cropName);

    const res = await fetch(`${ML_BASE}/api/disease/detect`, {
      method: 'POST',
      body: formData,
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const result = await res.json();
    if (result.disease_name) {
      logPrediction({
        modelType: 'disease',
        entityType: 'disease_report',
        entityId: null,
        prediction: result,
        confidence: result.confidence,
      });
    }
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------
// Crop recommendation
// ------------------------------------------------------------
export async function recommendCrops(land, soil, weatherData) {
  const input = {
    soil_ph: soil?.ph ?? null,
    soil_nitrogen: soil?.nitrogen ?? null,
    soil_phosphorus: soil?.phosphorus ?? null,
    soil_potassium: soil?.potassium ?? null,
    soil_organic_matter: soil?.organic_matter ?? null,
    soil_type: land?.soil_type || '',
    season: land?.season || '',
    avg_temperature_c: weatherData?.temperature_c ?? null,
    total_rainfall_mm: weatherData?.rainfall_mm ?? null,
    avg_humidity: weatherData?.humidity ?? null,
    water_availability: land?.irrigation_source ? 'medium' : '',
  };

  const mlResult = await mlFetch('/api/recommend/crop', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (mlResult && mlResult.recommendations) {
    logPrediction({
      modelType: 'recommendation',
      entityType: 'land',
      entityId: land?.id,
      prediction: mlResult,
      confidence: mlResult.recommendations[0]?.score ?? null,
      inputFeatures: input,
    });
    return mlResult;
  }

  return null;
}

// ------------------------------------------------------------
// Health check
// ------------------------------------------------------------
export async function checkMLHealth() {
  if (!ML_ENABLED) return { enabled: false, reachable: false, reason: 'disabled' };
  const result = await mlFetch('/api/health');
  return { enabled: true, reachable: !!result, ...result };
}

// ------------------------------------------------------------
// Available disease list from knowledge base
// ------------------------------------------------------------
export async function getDiseaseCatalog() {
  const result = await mlFetch('/api/disease/diseases');
  return result?.diseases || [];
}

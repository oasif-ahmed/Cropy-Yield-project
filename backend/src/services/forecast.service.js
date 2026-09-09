import { queryOne } from '../db.js';
import { predictYield } from './ml.service.js';

// ---------------------------------------------------------------------------
// Yield estimation with AI-first strategy.
// 1. Tries the ML model (Random Forest / XGBoost / ANN) via the Python service.
// 2. Falls back to a rule-based estimator when ML is not yet trained/available.
// ---------------------------------------------------------------------------

function baseYieldPerBigha(crop) {
  const name = (crop.name || '').trim();
  const season = (crop.season || '').trim();
  if (name === 'ধান') {
    if (season.includes('বোরো')) return 2100;
    if (season.includes('আমন')) return 1500;
    if (season.includes('আউশ')) return 1300;
    return 1800;
  }
  const table = {
    'গম': 1200, 'ভুট্টা': 2100, 'আলু': 2200, 'চা': 900, 'পাট': 950,
    'সরিষা': 450, 'টমেটো': 1900, 'পেঁয়াজ': 1500, 'রসুন': 900,
    'কাঁচা মরিচ': 1200, 'বেগুন': 1800, 'লাউ': 1600, 'বাদাম': 600,
    'ধান (বোরো)': 2100, 'ধান (আমন)': 1500, 'ধান (আউশ)': 1300,
  };
  return table[name] || 1500;
}

function seasonFactor(crop) {
  const season = (crop.season || '').trim();
  if (season.includes('বোরো')) return 1.05;
  if (season.includes('আমন')) return 0.95;
  if (season.includes('আউশ')) return 0.85;
  if (season.includes('খরিপ')) return 0.95;
  return 1.0;
}

function soilFactor(soil) {
  if (!soil) return { factor: 0.88, detail: 'মৃত্তিকা পরীক্ষার তথ্য নেই' };
  const factors = [];
  if (soil.ph) {
    const ph = Number(soil.ph);
    factors.push(ph >= 5.5 && ph <= 7.0 ? 1.0 : ph < 5.0 || ph > 7.5 ? 0.8 : 0.9);
  }
  if (soil.nitrogen != null) {
    const n = Number(soil.nitrogen);
    factors.push(n >= 0.3 && n <= 0.55 ? 1.0 : n < 0.25 ? 0.82 : 0.95);
  }
  if (soil.phosphorus != null) {
    const p = Number(soil.phosphorus);
    factors.push(p >= 10 && p <= 25 ? 1.0 : p < 8 ? 0.8 : 0.92);
  }
  if (soil.potassium != null) {
    const k = Number(soil.potassium);
    factors.push(k >= 60 && k <= 150 ? 1.0 : k < 50 ? 0.85 : 0.95);
  }
  const avg = factors.length
    ? factors.reduce((a, b) => a + b, 0) / factors.length
    : 0.9;
  return { factor: avg, detail: 'মৃত্তিকা পরীক্ষার ভিত্তিতে' };
}

function weatherFactor(weather) {
  if (!weather) return { factor: 0.92, detail: 'আবহাওয়া তথ্য নেই' };
  const t = Number(weather.temperature_c);
  if (!t) return { factor: 0.95, detail: 'আবহাওয়ার ভিত্তিতে' };
  if (t < 12) return { factor: 0.78, detail: 'কম তাপমাত্রা' };
  if (t > 38) return { factor: 0.8, detail: 'অতিরিক্ত তাপ' };
  return { factor: 1.0, detail: 'স্বাভাবিক তাপমাত্রা' };
}

function costPerBigha(crop) {
  const name = (crop.name || '').trim();
  if (name === 'আলু') return 30000;
  if (name === 'ধান') return 24000;
  if (name === 'চা') return 18000;
  if (name === 'গম') return 15000;
  if (name === 'ভুট্টা') return 16000;
  return 20000;
}

export async function estimateCropYield(crop, soil = null, district = null) {
  let latestWeather = null;
  try {
    latestWeather = await queryOne(
      'SELECT * FROM weather_records ORDER BY record_date DESC LIMIT 1'
    );
  } catch { /* ignore */ }

  // ---- Step 1: Try the AI/ML model ----
  const ml = await predictYield(crop, soil, latestWeather);

  const base = baseYieldPerBigha(crop);
  const sF = seasonFactor(crop);
  const soilRes = soilFactor(soil);
  const wF = weatherFactor(latestWeather);

  const area = Number(crop.area_bigha ?? 0);
  let perBigha;

  if (ml && ml.per_bigha_kg && ml.per_bigha_kg > 0) {
    // ML prediction available
    perBigha = Math.round(Number(ml.per_bigha_kg) * 10) / 10;
  } else {
    // Fallback to rule-based
    perBigha = Math.round(base * sF * soilRes.factor * wF.factor * 10) / 10;
  }

  const totalKg = Math.round(perBigha * area * 10) / 10;

  let unitPrice = null;
  try {
    const priceRow = await queryOne(
      `SELECT price FROM market_prices
       WHERE crop_name = $1 ${district ? 'OR district = $2' : ''}
       ORDER BY price_date DESC LIMIT 1`,
      district ? [crop.name, district] : [crop.name]
    );
    if (priceRow) unitPrice = Number(priceRow.price);
  } catch { /* ignore */ }

  const cost = Math.round(area * costPerBigha(crop));
  const revenue = unitPrice ? Math.round(totalKg * unitPrice) : null;
  const profit = revenue != null ? revenue - cost : null;

  let confidence;
  if (ml && ml.confidence) {
    confidence = `${Math.round(Number(ml.confidence) * 100)}%`;
  } else {
    confidence = Math.max(
      55,
      Math.min(95, Math.round(100 * (0.4 + (sF + soilRes.factor + wF.factor) / 3 - 0.6) * 1.8))
    ) + '%';
  }

  return {
    method: ml?.method === 'ml' ? 'ai' : 'rule_based',
    model: ml?.method === 'ml'
      ? `স্মার্ট মডেল (${ml.model_type || ml.model || 'AI'})`
      : 'সূত্রভিত্তিক অনুমান (ML মডেল প্রশিক্ষণ হওয়া মাত্র AI ব্যবহার হবে)',
    mlAvailable: !!ml,
    baseYieldPerBigha: base,
    seasonFactor: Math.round(sF * 100) / 100,
    soilFactor: Math.round((ml ? 1 : soilRes.factor) * 100) / 100,
    weatherFactor: Math.round((ml ? 1 : wF.factor) * 100) / 100,
    perBighaKg: perBigha,
    areaBigha: area,
    totalKg,
    unitPrice,
    estimatedCostTaka: cost,
    estimatedRevenueTaka: revenue,
    estimatedProfitTaka: profit,
    confidence,
    notes: [soilRes.detail, wF.detail],
  };
}

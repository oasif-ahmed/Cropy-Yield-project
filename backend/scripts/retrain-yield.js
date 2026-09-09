import { pool } from '../src/db.js';

const ML = 'http://localhost:8001/api/yield/train';

const seasonOf = (s = '') => {
  const v = (s || '').toLowerCase();
  if (v.includes('boro')) return 'boro';
  if (v.includes('amon') || v.includes('আমন')) return 'amon';
  if (v.includes('aush') || v.includes('আউশ')) return 'aush';
  if (v.includes('rabi') || v.includes('রবি')) return 'rabi';
  if (v.includes('kharip') || v.includes('খরিপ')) return 'kharip';
  return '';
};

async function main() {
  const { rows } = await pool.query(
    'SELECT * FROM yield_training_data WHERE yield_per_bigha_kg > 0 ORDER BY crop_name'
  );
  console.log(`Total training rows: ${rows.length}`);

  const byCrop = {};
  for (const r of rows) {
    (byCrop[r.crop_name] = byCrop[r.crop_name] || []).push(r);
  }

  const cropList = Object.keys(byCrop).sort();
  console.log(`Crops with data: ${cropList.join(', ')}`);

  for (const crop of cropList) {
    const samples = byCrop[crop].map((r) => ({
      crop_name: crop,
      area_bigha: Number(r.area_bigha) || 1,
      soil_ph: r.soil_ph == null ? null : Number(r.soil_ph),
      soil_nitrogen: r.soil_nitrogen == null ? null : Number(r.soil_nitrogen),
      soil_phosphorus: r.soil_phosphorus == null ? null : Number(r.soil_phosphorus),
      soil_potassium: r.soil_potassium == null ? null : Number(r.soil_potassium),
      soil_organic_matter: r.soil_organic_matter == null ? null : Number(r.soil_organic_matter),
      avg_temperature_c: r.avg_temperature_c == null ? null : Number(r.avg_temperature_c),
      total_rainfall_mm: r.total_rainfall_mm == null ? null : Number(r.total_rainfall_mm),
      avg_humidity: r.avg_humidity == null ? null : Number(r.avg_humidity),
      season: seasonOf(r.season),
      yield_per_bigha_kg: Number(r.yield_per_bigha_kg),
    }));

    const n = samples.filter((s) => s.yield_per_bigha_kg > 0).length;
    if (n < 10) {
      console.log(`${crop}: SKIP (only ${n} valid samples < 10)`);
      continue;
    }

    try {
      const res = await fetch(ML, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples, crop_name: crop, model_type: 'xgboost' }),
      });
      const out = await res.json();
      console.log(`${crop}: ${JSON.stringify(out)}`);
    } catch (e) {
      console.log(`${crop}: ERROR ${e.message}`);
    }
  }
  await pool.end();
}

main();
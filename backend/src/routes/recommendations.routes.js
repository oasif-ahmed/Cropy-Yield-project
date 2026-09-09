import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { recommendCrops } from '../services/ml.service.js';
import { getWeatherNow } from '../services/weather.service.js';

const router = Router();
router.use(requireAuth);

async function ownFarmerId(user) {
  if (user.role !== 'FARMER') return null;
  const row = await queryOne('SELECT id FROM farmers WHERE user_id = $1', [user.id]);
  return row ? row.id : null;
}

// GET /api/recommendations?land_id=xxx
router.get('/', async (req, res) => {
  try {
    const landId = req.query.land_id;
    if (!landId) return res.status(400).json({ error: 'জমি নির্বাচন করুন' });

    const land = await queryOne('SELECT * FROM lands WHERE id = $1', [landId]);
    if (!land) return res.status(404).json({ error: 'জমি পাওয়া যায়নি' });

    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== land.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }

    const soil = await queryOne(
      'SELECT * FROM soil_tests WHERE land_id = $1 ORDER BY tested_at DESC LIMIT 1',
      [landId]
    );

    // Get farmer division for weather
    const farmer = await queryOne('SELECT division FROM farmers WHERE id = $1', [land.farmer_id]);
    const weather = await getWeatherNow(farmer?.division || 'ঢাকা').catch(() => null);

    // Try AI recommendation, fall back to rule-based
    const ai = await recommendCrops(land, soil, weather?.current);

    let recommendations;
    if (ai && ai.recommendations) {
      recommendations = ai.recommendations;
    } else {
      // Simple rule-based fallback
      recommendations = [
        {
          crop_name: 'ধান',
          score: 78,
          reason: 'সাধারণত এই ধরনের মাটিতে ধান ভালো হয়',
          method: 'rule_based',
        },
        {
          crop_name: 'গম',
          score: 65,
          reason: 'শীতকালীন ফসল হিসেবে উপযুক্ত',
          method: 'rule_based',
        },
      ];
    }

    // Store recommendations
    for (const rec of recommendations.slice(0, 3)) {
      try {
        await query(
          `INSERT INTO crop_recommendations
            (land_id, recommended_crop, confidence, reason, season, soil_ph, soil_nitrogen,
             soil_phosphorus, soil_potassium, weather_condition, model_version)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            landId,
            rec.crop_name,
            rec.score != null ? Math.min(rec.score, 99) : null,
            rec.reason || null,
            land.season || null,
            soil?.ph ?? null,
            soil?.nitrogen ?? null,
            soil?.phosphorus ?? null,
            soil?.potassium ?? null,
            weather?.current?.condition || null,
            ai?.method || 'rule_based',
          ]
        );
      } catch { /* non-fatal */ }
    }

    res.json({
      land,
      soil,
      weather: weather?.current ?? null,
      method: ai?.method || 'rule_based',
      recommendations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফসল সুপারিশ পাওয়া যায়নি' });
  }
});

// GET /api/recommendations/history?land_id=xxx
router.get('/history', async (req, res) => {
  try {
    const landId = req.query.land_id;
    if (!landId) return res.status(400).json({ error: 'জমি নির্বাচন করুন' });
    const result = await query(
      'SELECT * FROM crop_recommendations WHERE land_id = $1 ORDER BY created_at DESC LIMIT 20',
      [landId]
    );
    res.json({ recommendations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'সুপারিশ ইতিহাস পাওয়া যায়নি' });
  }
});

export default router;

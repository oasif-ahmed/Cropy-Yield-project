import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { fertilizerAdvice, irrigationAdvice } from '../services/advisories.service.js';
import { getWeatherNow } from '../services/weather.service.js';

const router = Router();
router.use(requireAuth);

async function ownFarmerId(user) {
  if (user.role !== 'FARMER') return null;
  const row = await queryOne('SELECT id FROM farmers WHERE user_id = $1', [user.id]);
  return row ? row.id : null;
}

// GET /api/advisories?crop_id=xxx  or  /api/advisories?land_id=xxx
router.get('/', async (req, res) => {
  try {
    let crop = null;
    let land = null;
    if (req.query.crop_id) {
      crop = await queryOne('SELECT * FROM crops WHERE id = $1', [req.query.crop_id]);
      if (crop) land = await queryOne('SELECT * FROM lands WHERE id = $1', [crop.land_id]);
    } else if (req.query.land_id) {
      land = await queryOne('SELECT * FROM lands WHERE id = $1', [req.query.land_id]);
      crop = await queryOne(
        "SELECT * FROM crops WHERE land_id = $1 AND status <> 'HARVESTED' ORDER BY planting_date DESC LIMIT 1",
        [req.query.land_id]
      );
    }
    if (!land && !crop) return res.status(404).json({ error: 'জমি বা ফসল পাওয়া যায়নি' });

    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if ((land && land.farmer_id !== ownId) || (crop && crop.farmer_id !== ownId)) {
        return res.status(403).json({ error: 'অনুমতি নেই' });
      }
    }

    const soil = land ? await queryOne('SELECT * FROM soil_tests WHERE land_id = $1 ORDER BY tested_at DESC LIMIT 1', [land.id]) : null;
    const weather = await getWeatherNow(land?.farmer_id ? await queryOne('SELECT division FROM farmers WHERE id = $1', [land.farmer_id]).then(r => r?.division) || 'ঢাকা' : 'ঢাকা').catch(() => ({ current: null }));

    const fertilizer = fertilizerAdvice(soil, crop);
    const irrigation = irrigationAdvice(crop, land, weather.current);

    res.json({ crop, land, soil, fertilizer, irrigation, weather: weather.current });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'পরামর্শ তৈরি করা যায়নি' });
  }
});

export default router;

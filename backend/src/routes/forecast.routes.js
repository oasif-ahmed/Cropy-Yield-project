import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { estimateCropYield } from '../services/forecast.service.js';

const router = Router();
router.use(requireAuth);

async function ownFarmerId(user) {
  if (user.role !== 'FARMER') return null;
  const row = await queryOne('SELECT id FROM farmers WHERE user_id = $1', [user.id]);
  return row ? row.id : null;
}

// GET /api/forecast?crop_id=xxx  — single crop estimate
router.get('/', async (req, res) => {
  const cropId = req.query.crop_id;
  if (!cropId) return res.status(400).json({ error: 'ফসল নির্বাচন করুন' });
  try {
    const crop = await queryOne(
      `SELECT c.*, l.area_bigha, l.label AS land_label, f.name AS farmer_name, f.district
       FROM crops c LEFT JOIN lands l ON l.id = c.land_id LEFT JOIN farmers f ON f.id = c.farmer_id
       WHERE c.id = $1`,
      [cropId]
    );
    if (!crop) return res.status(404).json({ error: 'ফসল পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== crop.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const soil = await queryOne('SELECT * FROM soil_tests WHERE land_id = $1 ORDER BY tested_at DESC LIMIT 1', [crop.land_id]);
    const forecast = await estimateCropYield(crop, soil, crop.district);
    res.json({ crop, forecast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফলন পূর্বাভাস পাওয়া যায়নি' });
  }
});

// GET /api/forecast/all — all growing crops with estimates
router.get('/all', async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      clauses.push('c.farmer_id = $' + (params.length + 1));
      params.push(ownId);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const crops = await query(
      `SELECT c.*, l.area_bigha, l.label AS land_label, f.name AS farmer_name, f.district
       FROM crops c LEFT JOIN lands l ON l.id = c.land_id LEFT JOIN farmers f ON f.id = c.farmer_id
       ${where} ORDER BY c.created_at DESC`,
      params
    );
    const results = [];
    for (const crop of crops.rows) {
      const soil = await queryOne('SELECT * FROM soil_tests WHERE land_id = $1 ORDER BY tested_at DESC LIMIT 1', [crop.land_id]);
      const forecast = await estimateCropYield(crop, soil, crop.district);
      results.push({ crop, forecast });
    }
    res.json({ forecasts: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফলন পূর্বাভাস পাওয়া যায়নি' });
  }
});

export default router;

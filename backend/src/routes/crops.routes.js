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

router.get('/', async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      clauses.push('c.farmer_id = $' + (params.length + 1));
      params.push(ownId);
    }
    if (req.query.land_id) {
      clauses.push('c.land_id = $' + (params.length + 1));
      params.push(req.query.land_id);
    }
    if (req.query.status) {
      clauses.push('c.status = $' + (params.length + 1));
      params.push(req.query.status);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT c.*, l.label AS land_label, f.name AS farmer_name, f.division
       FROM crops c
       LEFT JOIN lands l ON l.id = c.land_id
       LEFT JOIN farmers f ON f.id = c.farmer_id
       ${where} ORDER BY c.created_at DESC`,
      params
    );
    res.json({ crops: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফসলের তালিকা পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { land_id, name, variety, season, planting_date, expected_harvest_date, status, care_notes } = req.body;
  if (!land_id || !name) return res.status(400).json({ error: 'জমি ও ফসলের নাম আবশ্যক' });
  try {
    const land = await queryOne('SELECT * FROM lands WHERE id = $1', [land_id]);
    if (!land) return res.status(400).json({ error: 'জমি পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== land.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const result = await query(
      `INSERT INTO crops (land_id, farmer_id, name, variety, season, planting_date, expected_harvest_date, status, care_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [land.id, land.farmer_id, name, variety, season, planting_date, expected_harvest_date, status || 'GROWING', care_notes]
    );
    res.status(201).json({ crop: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফসল যোগ করা যায়নি' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const crop = await queryOne(
      `SELECT c.*, l.label AS land_label, l.area_bigha, f.name AS farmer_name, f.division, f.district
       FROM crops c
       LEFT JOIN lands l ON l.id = c.land_id
       LEFT JOIN farmers f ON f.id = c.farmer_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!crop) return res.status(404).json({ error: 'ফসল পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== crop.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const soil = await queryOne(
      'SELECT * FROM soil_tests WHERE land_id = $1 ORDER BY tested_at DESC LIMIT 1',
      [crop.land_id]
    );
    const diseases = await query('SELECT * FROM disease_logs WHERE crop_id = $1 ORDER BY reported_at DESC', [crop.id]);
    const forecast = await estimateCropYield(crop, soil, req.user.role === 'FARMER' ? req.user.district : null);
    res.json({ crop, soil, diseases: diseases.rows, forecast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফসলের তথ্য পাওয়া যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { name, variety, season, planting_date, expected_harvest_date, status, care_notes } = req.body;
  try {
    const crop = await queryOne('SELECT * FROM crops WHERE id = $1', [req.params.id]);
    if (!crop) return res.status(404).json({ error: 'ফসল পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== crop.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const result = await query(
      `UPDATE crops SET
        name = COALESCE($1, name),
        variety = COALESCE($2, variety),
        season = COALESCE($3, season),
        planting_date = COALESCE($4, planting_date),
        expected_harvest_date = COALESCE($5, expected_harvest_date),
        status = COALESCE($6, status),
        care_notes = COALESCE($7, care_notes)
       WHERE id = $8 RETURNING *`,
      [name, variety, season, planting_date, expected_harvest_date, status, care_notes, req.params.id]
    );
    res.json({ crop: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  try {
    const crop = await queryOne('SELECT * FROM crops WHERE id = $1', [req.params.id]);
    if (!crop) return res.status(404).json({ error: 'ফসল পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== crop.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    await query('DELETE FROM crops WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

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
      clauses.push('p.farmer_id = $' + (params.length + 1));
      params.push(ownId);
    }
    if (req.query.farmer_id) {
      clauses.push('p.farmer_id = $' + (params.length + 1));
      params.push(req.query.farmer_id);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT p.*, c.name AS crop_name, l.label AS land_label, f.name AS farmer_name
       FROM crop_production p
       LEFT JOIN crops c ON c.id = p.crop_id
       LEFT JOIN lands l ON l.id = p.land_id
       LEFT JOIN farmers f ON f.id = p.farmer_id
       ${where} ORDER BY p.harvested_at DESC`,
      params
    );
    res.json({ productions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফলন রেকর্ড পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { crop_id, land_id, area_bigha, total_quantity_kg, cost_taka, revenue_taka, harvested_at } = req.body;
  if (!land_id || total_quantity_kg == null) {
    return res.status(400).json({ error: 'জমি ও মোট পরিমাণ আবশ্যক' });
  }
  try {
    const land = await queryOne('SELECT * FROM lands WHERE id = $1', [land_id]);
    if (!land) return res.status(400).json({ error: 'জমি পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== land.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const area = area_bigha ?? land.area_bigha;
    const yieldPerBigha = area > 0 ? Math.round((total_quantity_kg / area) * 100) / 100 : null;
    const result = await query(
      `INSERT INTO crop_production (crop_id, land_id, farmer_id, area_bigha, total_quantity_kg, yield_per_bigha_kg, cost_taka, revenue_taka, harvested_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [crop_id, land.id, land.farmer_id, area, total_quantity_kg, yieldPerBigha, cost_taka || 0, revenue_taka || 0, harvested_at || new Date().toISOString().slice(0, 10)]
    );
    if (crop_id) {
      await query("UPDATE crops SET status = 'HARVESTED' WHERE id = $1", [crop_id]);
    }

    // Capture data for ML training (yield_training_data)
    try {
      if (crop_id && yieldPerBigha != null) {
        const crop = await queryOne('SELECT * FROM crops WHERE id = $1', [crop_id]);
        const farmer = await queryOne('SELECT division, district FROM farmers WHERE id = $1', [land.farmer_id]);
        const soil = await queryOne(
          'SELECT * FROM soil_tests WHERE land_id = $1 ORDER BY tested_at DESC LIMIT 1',
          [land_id]
        );
        const weather = await queryOne(
          `SELECT ROUND(AVG(temperature_c)::numeric, 1) AS avg_temp,
                  ROUND(SUM(rainfall_mm)::numeric, 2) AS total_rain,
                  ROUND(AVG(humidity)::numeric) AS avg_humidity
           FROM weather_records WHERE division = $1`,
          [farmer?.division || null]
        );
        await query(
          `INSERT INTO yield_training_data
            (crop_name, variety, season, land_id, division, district, area_bigha,
             actual_yield_kg, yield_per_bigha_kg, soil_ph, soil_nitrogen,
             soil_phosphorus, soil_potassium, soil_organic_matter,
             avg_temperature_c, total_rainfall_mm, avg_humidity,
             cost_taka, revenue_taka, planting_date, harvest_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [
            crop?.name || null, crop?.variety || null, crop?.season || null, land_id,
            farmer?.division || null, farmer?.district || null, area,
            total_quantity_kg, yieldPerBigha,
            soil?.ph ?? null, soil?.nitrogen ?? null, soil?.phosphorus ?? null,
            soil?.potassium ?? null, soil?.organic_matter ?? null,
            weather?.avg_temp ?? null, weather?.total_rain ?? null, weather?.avg_humidity ?? null,
            cost_taka || 0, revenue_taka || 0,
            crop?.planting_date || null, harvested_at || new Date().toISOString().slice(0, 10),
          ]
        );
      }
    } catch { /* non-fatal: training data capture */ }

    res.status(201).json({ production: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফলন রেকর্ড যোগ করা যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { area_bigha, total_quantity_kg, cost_taka, revenue_taka, harvested_at } = req.body;
  try {
    const existing = await queryOne('SELECT * FROM crop_production WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'রেকর্ড পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== existing.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const area = area_bigha ?? existing.area_bigha;
    const qty = total_quantity_kg ?? existing.total_quantity_kg;
    const yieldPerBigha = area > 0 ? Math.round((qty / area) * 100) / 100 : existing.yield_per_bigha_kg;
    const result = await query(
      `UPDATE crop_production SET
        area_bigha = COALESCE($1, area_bigha),
        total_quantity_kg = COALESCE($2, total_quantity_kg),
        yield_per_bigha_kg = $3,
        cost_taka = COALESCE($4, cost_taka),
        revenue_taka = COALESCE($5, revenue_taka),
        harvested_at = COALESCE($6, harvested_at)
       WHERE id = $7 RETURNING *`,
      [area_bigha, total_quantity_kg, yieldPerBigha, cost_taka, revenue_taka, harvested_at, req.params.id]
    );
    res.json({ production: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM crop_production WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'রেকর্ড পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== existing.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    await query('DELETE FROM crop_production WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

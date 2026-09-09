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
    const params = [];
    let where = '';
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      where = 'WHERE l.farmer_id = $1';
      params.push(ownId);
    } else if (req.query.farmer_id) {
      where = 'WHERE l.farmer_id = $1';
      params.push(req.query.farmer_id);
    }
    const result = await query(
      `SELECT l.*, f.name AS farmer_name,
         (SELECT COUNT(*) FROM crops c WHERE c.land_id = l.id AND c.status <> 'HARVESTED')::int AS active_crops
       FROM lands l JOIN farmers f ON f.id = l.farmer_id ${where}
       ORDER BY l.created_at DESC`,
      params.filter(Boolean)
    );
    res.json({ lands: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'জমির তালিকা পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { farmer_id, label, area_bigha, soil_type, irrigation_source, lat, lng, address } = req.body;
  let owner = farmer_id;
  if (req.user.role === 'FARMER') {
    owner = await ownFarmerId(req.user);
    if (!owner) return res.status(400).json({ error: 'কৃষক প্রোফাইল পাওয়া যায়নি' });
  }
  if (!label || area_bigha == null) return res.status(400).json({ error: 'জমির নাম ও আয়তন আবশ্যক' });
  try {
    const result = await query(
      `INSERT INTO lands (farmer_id, label, area_bigha, soil_type, irrigation_source, lat, lng, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [owner, label, area_bigha, soil_type, irrigation_source, lat, lng, address]
    );
    await query('UPDATE farmers SET total_land_bigha = total_land_bigha + $1 WHERE id = $2', [area_bigha, owner]);
    res.status(201).json({ land: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'জমি যোগ করা যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { label, area_bigha, soil_type, irrigation_source, lat, lng, address } = req.body;
  try {
    const land = await queryOne('SELECT * FROM lands WHERE id = $1', [req.params.id]);
    if (!land) return res.status(404).json({ error: 'জমি পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== land.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const oldArea = Number(land.area_bigha || 0);
    const newArea = area_bigha != null ? Number(area_bigha) : oldArea;
    const result = await query(
      `UPDATE lands SET
        label = COALESCE($1, label),
        area_bigha = COALESCE($2, area_bigha),
        soil_type = COALESCE($3, soil_type),
        irrigation_source = COALESCE($4, irrigation_source),
        lat = COALESCE($5, lat),
        lng = COALESCE($6, lng),
        address = COALESCE($7, address)
       WHERE id = $8 RETURNING *`,
      [label, area_bigha, soil_type, irrigation_source, lat, lng, address, req.params.id]
    );
    await query('UPDATE farmers SET total_land_bigha = total_land_bigha + $1 WHERE id = $2', [newArea - oldArea, land.farmer_id]);
    res.json({ land: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  try {
    const land = await queryOne('SELECT * FROM lands WHERE id = $1', [req.params.id]);
    if (!land) return res.status(404).json({ error: 'জমি পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== land.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    await query('DELETE FROM lands WHERE id = $1', [req.params.id]);
    await query('UPDATE farmers SET total_land_bigha = GREATEST(total_land_bigha - $1, 0) WHERE id = $2', [land.area_bigha, land.farmer_id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

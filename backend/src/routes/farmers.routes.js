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
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      const result = await query(
        `SELECT f.*, COUNT(l.id)::int AS land_count
         FROM farmers f LEFT JOIN lands l ON l.farmer_id = f.id
         WHERE f.id = $1 GROUP BY f.id`,
        [ownId]
      );
      return res.json({ farmers: result.rows });
    }
    const result = await query(
      `SELECT f.*, COUNT(l.id)::int AS land_count
       FROM farmers f LEFT JOIN lands l ON l.farmer_id = f.id
       GROUP BY f.id ORDER BY f.created_at DESC`
    );
    res.json({ farmers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'কৃষক তালিকা পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  const { name, phone, address, division, district, upazila, union_name, total_land_bigha } = req.body;
  if (!name) return res.status(400).json({ error: 'নাম আবশ্যক' });
  try {
    const result = await query(
      `INSERT INTO farmers (name, phone, address, division, district, upazila, union_name, total_land_bigha)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, phone, address, division, district, upazila, union_name, total_land_bigha || 0]
    );
    res.status(201).json({ farmer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'কৃষক যোগ করা যায়নি' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const farmer = await queryOne('SELECT * FROM farmers WHERE id = $1', [req.params.id]);
    if (!farmer) return res.status(404).json({ error: 'কৃষক পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== farmer.id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const lands = await query('SELECT * FROM lands WHERE farmer_id = $1', [farmer.id]);
    res.json({ farmer, lands: lands.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'কৃষকের তথ্য পাওয়া যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  const { name, phone, address, division, district, upazila, union_name, total_land_bigha } = req.body;
  try {
    const result = await query(
      `UPDATE farmers SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        division = COALESCE($4, division),
        district = COALESCE($5, district),
        upazila = COALESCE($6, upazila),
        union_name = COALESCE($7, union_name),
        total_land_bigha = COALESCE($8, total_land_bigha)
       WHERE id = $9 RETURNING *`,
      [name, phone, address, division, district, upazila, union_name, total_land_bigha, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'কৃষক পাওয়া যায়নি' });
    res.json({ farmer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    await query('DELETE FROM farmers WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

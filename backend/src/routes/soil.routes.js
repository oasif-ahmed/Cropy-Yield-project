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

async function canAccessLand(user, landId) {
  if (user.role !== 'FARMER') return true;
  const ownId = await ownFarmerId(user);
  const land = await queryOne('SELECT farmer_id FROM lands WHERE id = $1', [landId]);
  return land && land.farmer_id === ownId;
}

router.get('/', async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    if (req.query.land_id) {
      clauses.push('s.land_id = $' + (params.length + 1));
      params.push(req.query.land_id);
    }
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      clauses.push('l.farmer_id = $' + (params.length + 1));
      params.push(ownId);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT s.*, l.label AS land_label, f.name AS farmer_name
       FROM soil_tests s
       JOIN lands l ON l.id = s.land_id
       JOIN farmers f ON f.id = l.farmer_id
       ${where} ORDER BY s.tested_at DESC`,
      params
    );
    res.json({ tests: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মৃত্তিকা পরীক্ষার তথ্য পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { land_id, tested_at, ph, nitrogen, phosphorus, potassium, organic_matter, recommendation } = req.body;
  if (!land_id) return res.status(400).json({ error: 'জমি আবশ্যক' });
  try {
    if (!(await canAccessLand(req.user, land_id))) {
      return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const result = await query(
      `INSERT INTO soil_tests (land_id, tested_at, ph, nitrogen, phosphorus, potassium, organic_matter, recommendation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [land_id, tested_at || new Date().toISOString().slice(0, 10), ph, nitrogen, phosphorus, potassium, organic_matter, recommendation]
    );
    res.status(201).json({ test: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মৃত্তিকা পরীক্ষা যোগ করা যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { tested_at, ph, nitrogen, phosphorus, potassium, organic_matter, recommendation } = req.body;
  try {
    const test = await queryOne('SELECT * FROM soil_tests WHERE id = $1', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'পরীক্ষা পাওয়া যায়নি' });
    if (!(await canAccessLand(req.user, test.land_id))) {
      return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const result = await query(
      `UPDATE soil_tests SET
        tested_at = COALESCE($1, tested_at),
        ph = COALESCE($2, ph),
        nitrogen = COALESCE($3, nitrogen),
        phosphorus = COALESCE($4, phosphorus),
        potassium = COALESCE($5, potassium),
        organic_matter = COALESCE($6, organic_matter),
        recommendation = COALESCE($7, recommendation)
       WHERE id = $8 RETURNING *`,
      [tested_at, ph, nitrogen, phosphorus, potassium, organic_matter, recommendation, req.params.id]
    );
    res.json({ test: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  try {
    const test = await queryOne('SELECT * FROM soil_tests WHERE id = $1', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'পরীক্ষা পাওয়া যায়নি' });
    if (!(await canAccessLand(req.user, test.land_id))) {
      return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    await query('DELETE FROM soil_tests WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

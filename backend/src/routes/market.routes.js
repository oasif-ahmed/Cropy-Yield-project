import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    if (req.query.crop_name) {
      clauses.push('crop_name = $' + (params.length + 1));
      params.push(req.query.crop_name);
    }
    if (req.query.district) {
      clauses.push('district = $' + (params.length + 1));
      params.push(req.query.district);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT * FROM market_prices ${where} ORDER BY price_date DESC, created_at DESC LIMIT 200`,
      params
    );
    res.json({ prices: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'বাজারদর পাওয়া যায়নি' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (crop_name) crop_name, district, unit, price, price_date
       FROM market_prices ORDER BY crop_name, price_date DESC`
    );
    res.json({ prices: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'সর্বশেষ বাজারদর পাওয়া যায়নি' });
  }
});

router.get('/history', async (req, res) => {
  const cropName = req.query.crop_name;
  if (!cropName) return res.status(400).json({ error: 'ফসলের নাম দিন' });
  try {
    const result = await query(
      'SELECT price_date, price, unit, district FROM market_prices WHERE crop_name = $1 ORDER BY price_date',
      [cropName]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'দর ইতিহাস পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  const { crop_name, district, unit, price, price_date } = req.body;
  if (!crop_name || price == null) return res.status(400).json({ error: 'ফসলের নাম ও দর আবশ্যক' });
  try {
    const result = await query(
      `INSERT INTO market_prices (crop_name, district, unit, price, price_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [crop_name, district, unit || 'kg', price, price_date || new Date().toISOString().slice(0, 10)]
    );
    res.status(201).json({ price: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'দর যোগ করা যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  const { crop_name, district, unit, price, price_date } = req.body;
  try {
    const result = await query(
      `UPDATE market_prices SET
        crop_name = COALESCE($1, crop_name),
        district = COALESCE($2, district),
        unit = COALESCE($3, unit),
        price = COALESCE($4, price),
        price_date = COALESCE($5, price_date)
       WHERE id = $6 RETURNING *`,
      [crop_name, district, unit, price, price_date, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'দর পাওয়া যায়নি' });
    res.json({ price: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    await query('DELETE FROM market_prices WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

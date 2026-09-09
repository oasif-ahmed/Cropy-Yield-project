import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getWeatherNow, simulateForecast } from '../services/weather.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    if (req.query.division) {
      clauses.push('division = $' + (params.length + 1));
      params.push(req.query.division);
    }
    if (req.query.district) {
      clauses.push('district = $' + (params.length + 1));
      params.push(req.query.district);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT * FROM weather_records ${where} ORDER BY record_date DESC LIMIT 100`,
      params
    );
    res.json({ records: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আবহাওয়ার তথ্য পাওয়া যায়নি' });
  }
});

router.get('/now', async (req, res) => {
  const division = req.query.division || req.user.division || 'ঢাকা';
  try {
    const data = await getWeatherNow(division);
    res.json({ division, ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আবহাওয়ার তথ্য পাওয়া যায়নি' });
  }
});

router.get('/forecast', async (req, res) => {
  const division = req.query.division || req.user.division || 'ঢাকা';
  const days = Math.min(parseInt(req.query.days || '7', 10) || 7, 14);
  try {
    const data = await getWeatherNow(division);
    res.json({ division, source: data.source, forecast: (data.forecast || simulateForecast(division, days)).slice(0, days) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'পূর্বাভাস পাওয়া যায়নি' });
  }
});

router.post('/', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  const { division, district, record_date, condition, temperature_c, humidity, wind_kph, rainfall_mm } = req.body;
  if (!division) return res.status(400).json({ error: 'বিভাগ আবশ্যক' });
  try {
    const result = await query(
      `INSERT INTO weather_records (division, district, record_date, condition, temperature_c, humidity, wind_kph, rainfall_mm, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'manual') RETURNING *`,
      [division, district, record_date || new Date().toISOString().slice(0, 10), condition, temperature_c, humidity, wind_kph, rainfall_mm]
    );
    res.status(201).json({ record: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আবহাওয়া যোগ করা যায়নি' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    await query('DELETE FROM weather_records WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  const { division, district, record_date, condition, temperature_c, humidity, wind_kph, rainfall_mm } = req.body;
  try {
    const result = await query(
      `UPDATE weather_records
       SET division=$1, district=$2, record_date=$3, condition=$4, temperature_c=$5, humidity=$6, wind_kph=$7, rainfall_mm=$8
       WHERE id=$9 RETURNING *`,
      [division, district, record_date, condition, temperature_c, humidity, wind_kph, rainfall_mm, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'রেকর্ড পাওয়া যায়নি' });
    res.json({ record: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'হালনাগাদ করা যায়নি' });
  }
});

export default router;

import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/reports/overview
router.get('/overview', async (req, res) => {
  try {
    const result = await query(
      `SELECT
        (SELECT COUNT(*)::int FROM farmers) AS farmers,
        (SELECT COUNT(*)::int FROM lands) AS lands,
        (SELECT COUNT(*)::int FROM crops WHERE status <> 'HARVESTED') AS active_crops,
        (SELECT COUNT(*)::int FROM crops) AS total_crops,
        (SELECT COALESCE(SUM(total_quantity_kg),0) FROM crop_production) AS total_production_kg,
        (SELECT COALESCE(AVG(yield_per_bigha_kg),0) FROM crop_production) AS avg_yield,
        (SELECT COALESCE(SUM(revenue_taka),0) FROM crop_production) AS total_revenue,
        (SELECT COALESCE(SUM(cost_taka),0) FROM crop_production) AS total_cost,
        (SELECT COUNT(*)::int FROM disease_logs WHERE status = 'OPEN') AS open_diseases`
    );
    res.json({ report: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'রিপোর্ট পাওয়া যায়নি' });
  }
});

// GET /api/reports/production?from=&to=
router.get('/production', async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  try {
    const params = [];
    let where = '';
    if (from && to) {
      where = `WHERE harvested_at BETWEEN $1 AND $2`;
      params.push(from, to);
    } else if (from) {
      where = 'WHERE harvested_at >= $1';
      params.push(from);
    } else if (to) {
      where = 'WHERE harvested_at <= $1';
      params.push(to);
    }
    const monthly = await query(
      `SELECT to_char(harvested_at, 'YYYY-MM') AS month, COUNT(*)::int AS harvests,
              SUM(total_quantity_kg) AS total_kg, SUM(revenue_taka) AS revenue,
              AVG(yield_per_bigha_kg) AS avg_yield
       FROM crop_production ${where} GROUP BY 1 ORDER BY 1`,
      params
    );
    const byCrop = await query(
      `SELECT COALESCE(c.name, 'অন্যান্য') AS crop_name, COUNT(*)::int AS harvests,
              SUM(p.total_quantity_kg) AS total_kg, SUM(p.revenue_taka) AS revenue
       FROM crop_production p LEFT JOIN crops c ON c.id = p.crop_id
       ${where} GROUP BY 1 ORDER BY total_kg DESC`,
      params
    );
    res.json({ monthly: monthly.rows, byCrop: byCrop.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ফলন রিপোর্ট পাওয়া যায়নি' });
  }
});

// GET /api/reports/farmers?division=
router.get('/farmers', async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    if (req.query.division) {
      clauses.push('division = $' + (params.length + 1));
      params.push(req.query.division);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT division, district, COUNT(*)::int AS farmers,
              COALESCE(SUM(total_land_bigha),0) AS land_bigha
       FROM farmers ${where} GROUP BY division, district ORDER BY farmers DESC`,
      params
    );
    res.json({ farmers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'রিপোর্ট পাওয়া যায়নি' });
  }
});

// GET /api/reports/diseases
router.get('/diseases', async (req, res) => {
  try {
    const result = await query(
      `SELECT disease_name, COUNT(*)::int AS reports,
              COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open,
              COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved
       FROM disease_logs GROUP BY disease_name ORDER BY reports DESC`
    );
    res.json({ diseases: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'রিপোর্ট পাওয়া যায়নি' });
  }
});

export default router;

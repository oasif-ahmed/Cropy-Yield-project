import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { checkMLHealth } from '../services/ml.service.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// Some models log confidence as a fraction (yield = 0..1) while others log
// it as an already-scaled percentage (disease/recommendation = 0..100).
// Normalize everything to a consistent 0..100 percentage for display.
function toPercent(value) {
  if (value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

// GET /api/ai/health - ML service health check
router.get('/health', async (req, res) => {
  try {
    const health = await checkMLHealth();
    res.json(health);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI সার্ভিস চেক করা যায়নি' });
  }
});

// GET /api/ai/predictions - recent ML predictions
router.get('/predictions', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM ai_predictions ORDER BY created_at DESC LIMIT 100`
    );
    const predictions = result.rows.map((p) => ({
      ...p,
      confidence_pct: toPercent(p.confidence),
    }));
    res.json({ predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'পূর্বাভাস লগ পাওয়া যায়নি' });
  }
});

// GET /api/ai/summary - model usage summary
router.get('/summary', async (req, res) => {
  try {
    const result = await query(
      `WITH recent AS (
         SELECT * FROM ai_predictions ORDER BY created_at DESC LIMIT 500
       )
       SELECT model_type, COUNT(*)::int AS count,
              ROUND(AVG(confidence)::numeric, 2) AS avg_confidence
       FROM recent GROUP BY model_type ORDER BY count DESC`
    );
    const summary = result.rows.map((r) => ({
      ...r,
      avg_confidence: toPercent(r.avg_confidence),
    }));
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'সারাংশ পাওয়া যায়নি' });
  }
});

export default router;

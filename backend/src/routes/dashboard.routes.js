import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getWeatherNow } from '../services/weather.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'FARMER') {
      const farmer = await queryOne('SELECT * FROM farmers WHERE user_id = $1', [user.id]);
      if (!farmer) return res.status(400).json({ error: 'কৃষক প্রোফাইল পাওয়া যায়নি' });

      const [stats, crops, upcoming, diseases, productions, latestPrices, unread] = await Promise.all([
        queryOne(
          `SELECT
            (SELECT COUNT(*)::int FROM lands WHERE farmer_id = $1) AS land_count,
            (SELECT COALESCE(SUM(area_bigha),0) FROM lands WHERE farmer_id = $1) AS total_land_bigha,
            (SELECT COUNT(*)::int FROM crops WHERE farmer_id = $1 AND status <> 'HARVESTED') AS active_crops`,
          [farmer.id]
        ),
        query(
          `SELECT c.*, l.label AS land_label FROM crops c JOIN lands l ON l.id = c.land_id
           WHERE c.farmer_id = $1 AND c.status <> 'HARVESTED' ORDER BY c.planting_date DESC LIMIT 6`,
          [farmer.id]
        ),
        query(
          `SELECT * FROM crops WHERE farmer_id = $1 AND status <> 'HARVESTED'
           AND expected_harvest_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14 ORDER BY expected_harvest_date`,
          [farmer.id]
        ),
        queryOne(
          "SELECT COUNT(*)::int AS n FROM disease_logs WHERE farmer_id = $1 AND status = 'OPEN'",
          [farmer.id]
        ),
        query(
          `SELECT p.*, c.name AS crop_name FROM crop_production p LEFT JOIN crops c ON c.id = p.crop_id
           WHERE p.farmer_id = $1 ORDER BY p.harvested_at DESC LIMIT 5`,
          [farmer.id]
        ),
        query(
          'SELECT DISTINCT ON (crop_name) crop_name, district, price, unit FROM market_prices ORDER BY crop_name, price_date DESC LIMIT 6'
        ),
        queryOne(
          "SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND is_read = FALSE",
          [user.id]
        ),
      ]);

      const weather = await getWeatherNow(farmer.division || 'ঢাকা').catch(() => null);

      return res.json({
        role: 'FARMER',
        farmer,
        stats,
        crops: crops.rows,
        upcoming: upcoming.rows,
        openDiseases: diseases.n,
        productions: productions.rows,
        latestPrices: latestPrices.rows,
        unreadNotifications: unread.n,
        weather: weather?.current ?? null,
        weatherSource: weather?.source ?? null,
        forecast: weather?.forecast?.slice(0, 3) ?? [],
      });
    }

    const [stats, topCrops, productionTrend, latestPrices, openDiseases, divisionStats, recentProd, unread] =
      await Promise.all([
        queryOne(
          `SELECT
            (SELECT COUNT(*)::int FROM farmers) AS farmer_count,
            (SELECT COALESCE(SUM(area_bigha),0) FROM lands) AS total_land_bigha,
            (SELECT COUNT(*)::int FROM crops WHERE status <> 'HARVESTED') AS active_crops,
            (SELECT COALESCE(SUM(total_quantity_kg),0) FROM crop_production) AS total_production_kg,
            (SELECT COALESCE(AVG(yield_per_bigha_kg),0) FROM crop_production) AS avg_yield_per_bigha,
            (SELECT COALESCE(SUM(revenue_taka),0) FROM crop_production) AS total_revenue`
        ),
        query(
          `SELECT name, COUNT(*)::int AS crop_count, SUM(l.area_bigha) AS total_area
           FROM crops c LEFT JOIN lands l ON l.id = c.land_id
           GROUP BY name ORDER BY total_area DESC NULLS LAST LIMIT 6`
        ),
        query(
          `SELECT to_char(harvested_at, 'YYYY-MM') AS month,
                  SUM(total_quantity_kg) AS total_kg, SUM(revenue_taka) AS revenue
           FROM crop_production WHERE harvested_at >= CURRENT_DATE - interval '6 months'
           GROUP BY 1 ORDER BY 1`
        ),
        query(
          'SELECT DISTINCT ON (crop_name) crop_name, district, price, unit FROM market_prices ORDER BY crop_name, price_date DESC LIMIT 6'
        ),
        queryOne(
          "SELECT COUNT(*)::int AS n FROM disease_logs WHERE status = 'OPEN'"
        ),
        query(
          `SELECT division, COUNT(*)::int AS farmer_count, COALESCE(SUM(total_land_bigha),0) AS land_bigha
           FROM farmers GROUP BY division ORDER BY farmer_count DESC`
        ),
        query(
          `SELECT p.*, c.name AS crop_name, f.name AS farmer_name
           FROM crop_production p
           LEFT JOIN crops c ON c.id = p.crop_id
           LEFT JOIN farmers f ON f.id = p.farmer_id
           ORDER BY p.harvested_at DESC LIMIT 6`
        ),
        queryOne("SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND is_read = FALSE", [user.id]),
      ]);

    const weather = await getWeatherNow(user.division || 'ঢাকা').catch(() => null);

    res.json({
      role: user.role,
      stats,
      topCrops: topCrops.rows,
      productionTrend: productionTrend.rows,
      latestPrices: latestPrices.rows,
      openDiseases: openDiseases.n,
      divisionStats: divisionStats.rows,
      recentProductions: recentProd.rows,
      unreadNotifications: unread.n,
      weather: weather?.current ?? null,
      weatherSource: weather?.source ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ড্যাশবোর্ড তথ্য পাওয়া যায়নি' });
  }
});

export default router;

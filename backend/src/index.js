import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from './config.js';
import { pool } from './db.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import farmerRoutes from './routes/farmers.routes.js';
import landRoutes from './routes/lands.routes.js';
import cropRoutes from './routes/crops.routes.js';
import soilRoutes from './routes/soil.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import diseaseRoutes from './routes/diseases.routes.js';
import marketRoutes from './routes/market.routes.js';
import productionRoutes from './routes/production.routes.js';
import advisoryRoutes from './routes/advisories.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import forecastRoutes from './routes/forecast.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/reports.routes.js';
import recommendationRoutes from './routes/recommendations.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'cropyield-backend' });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/lands', landRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/advisories', advisoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'এন্ডপয়েন্ট পাওয়া যায়নি' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'সার্ভার ত্রুটি' });
});

app.listen(config.port, () => {
  console.log(`CropYield backend listening on http://localhost:${config.port}`);
});

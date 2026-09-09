import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { detectDisease, getDiseaseCatalog } from '../services/ml.service.js';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, crypto.randomUUID() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, /image\//.test(file.mimetype)),
});

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
    if (req.query.crop_id) {
      clauses.push('d.crop_id = $' + (params.length + 1));
      params.push(req.query.crop_id);
    }
    if (req.query.status) {
      clauses.push('d.status = $' + (params.length + 1));
      params.push(req.query.status);
    }
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      clauses.push('d.farmer_id = $' + (params.length + 1));
      params.push(ownId);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const result = await query(
      `SELECT d.*, c.name AS crop_name, l.label AS land_label, f.name AS farmer_name
       FROM disease_logs d
       LEFT JOIN crops c ON c.id = d.crop_id
       LEFT JOIN lands l ON l.id = d.land_id
       LEFT JOIN farmers f ON f.id = d.farmer_id
       ${where} ORDER BY d.reported_at DESC`,
      params
    );
    res.json({ diseases: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'রোগ-পোকা তালিকা পাওয়া যায়নি' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  const { crop_id, land_id, disease_name, pest_name, severity, symptoms, treatment, status } = req.body;
  if (!disease_name) return res.status(400).json({ error: 'রোগের নাম আবশ্যক' });
  try {
    let farmerId = null;
    if (req.user.role === 'FARMER') {
      farmerId = await ownFarmerId(req.user);
      if (!farmerId) return res.status(400).json({ error: 'কৃষক প্রোফাইল পাওয়া যায়নি' });
    } else {
      const crop = crop_id ? await queryOne('SELECT farmer_id FROM crops WHERE id = $1', [crop_id]) : null;
      farmerId = crop?.farmer_id || land_id
        ? (await queryOne('SELECT farmer_id FROM lands WHERE id = $1', [land_id]))?.farmer_id
        : null;
    }
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ---- AI disease detection (if image provided) ----
    let aiResult = null;
    let resolvedDisease = disease_name;
    let resolvedSeverity = severity || 'LOW';
    if (req.file) {
      const cropName = crop_id
        ? (await queryOne('SELECT name FROM crops WHERE id = $1', [crop_id]))?.name
        : null;
      aiResult = await detectDisease(req.file, cropName);
      if (aiResult && aiResult.disease_name && !resolvedDisease) {
        resolvedDisease = aiResult.disease_name;
        resolvedSeverity = aiResult.severity || resolvedSeverity;
      }
    }

    const result = await query(
      `INSERT INTO disease_logs (crop_id, land_id, farmer_id, disease_name, pest_name, severity, symptoms, treatment, status, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [crop_id, land_id, farmerId, resolvedDisease, pest_name, resolvedSeverity, symptoms || aiResult?.symptoms || null, treatment || aiResult?.treatment || null, status || 'OPEN', imageUrl]
    );

    // Store the image in disease_images table for AI training
    if (req.file && imageUrl) {
      try {
        await query(
          `INSERT INTO disease_images (disease_log_id, image_url, ai_detected_disease, ai_confidence, ai_model_version)
           VALUES ($1,$2,$3,$4,$5)`,
          [result.rows[0].id, imageUrl, aiResult?.disease_name || null, aiResult?.confidence != null ? aiResult.confidence : null, aiResult ? '1.0.0' : null]
        );
      } catch { /* non-fatal */ }
    }

    res.status(201).json({ disease: result.rows[0], aiDetection: aiResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'রোগ নিবন্ধন ব্যর্থ হয়েছে' });
  }
});

// GET /api/diseases/catalog - disease reference from AI knowledge base
router.get('/catalog', async (req, res) => {
  try {
    const catalog = await getDiseaseCatalog();
    res.json({ diseases: catalog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ক্যাটালগ পাওয়া যায়নি' });
  }
});

// POST /api/diseases/ai-detect - detect disease from uploaded image only
router.post('/ai-detect', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ছবি আপলোড করুন' });
  try {
    const cropName = req.body.crop_name || null;
    const aiResult = await detectDisease(req.file, cropName);
    if (!aiResult) {
      return res.status(503).json({ error: 'AI শনাক্তকরণ সার্ভিস উপলব্ধ নেই' });
    }
    res.json(aiResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI শনাক্তকরণ ব্যর্থ' });
  }
});

router.patch('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  const { disease_name, pest_name, severity, symptoms, treatment, status } = req.body;
  try {
    const existing = await queryOne('SELECT * FROM disease_logs WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'রিপোর্ট পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== existing.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    const result = await query(
      `UPDATE disease_logs SET
        disease_name = COALESCE($1, disease_name),
        pest_name = COALESCE($2, pest_name),
        severity = COALESCE($3, severity),
        symptoms = COALESCE($4, symptoms),
        treatment = COALESCE($5, treatment),
        status = COALESCE($6, status)
       WHERE id = $7 RETURNING *`,
      [disease_name, pest_name, severity, symptoms, treatment, status, req.params.id]
    );
    res.json({ disease: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', requireRole('OFFICER', 'ADMIN', 'FARMER'), async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM disease_logs WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'রিপোর্ট পাওয়া যায়নি' });
    if (req.user.role === 'FARMER') {
      const ownId = await ownFarmerId(req.user);
      if (ownId !== existing.farmer_id) return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    await query('DELETE FROM disease_logs WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

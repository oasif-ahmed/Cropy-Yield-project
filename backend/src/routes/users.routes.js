import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.division, u.district, u.is_active, u.created_at,
              f.id AS farmer_id
       FROM users u LEFT JOIN farmers f ON f.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ব্যবহারকারী তালিকা পাওয়া যায়নি' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, password, role, phone, division, district } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'নাম, ইমেইল, পাসওয়ার্ড ও ভূমিকা আবশ্যক' });
  }
  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'এই ইমেইলে অ্যাকাউন্ট আছে' });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, division, district)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, role, phone, division, district, is_active`,
      [name, email, hash, role, phone, division, district]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ব্যবহারকারী যোগ করা যায়নি' });
  }
});

router.patch('/:id', async (req, res) => {
  const { name, role, phone, division, district, is_active, password } = req.body;
  try {
    const hash = password ? await bcrypt.hash(password, 10) : null;
    const result = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        phone = COALESCE($3, phone),
        division = COALESCE($4, division),
        district = COALESCE($5, district),
        is_active = COALESCE($6, is_active),
        password_hash = COALESCE($7, password_hash)
       WHERE id = $8
       RETURNING id, name, email, role, phone, division, district, is_active`,
      [name, role, phone, division, district, is_active, hash, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1 AND id <> $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'মুছে ফেলা যায়নি' });
  }
});

export default router;

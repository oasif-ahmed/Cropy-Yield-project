import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, queryOne } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    division: user.division,
    district: user.district,
    upazila: user.upazila,
  };
}

router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, division, district, upazila } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' });
  }
  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(409).json({ error: 'এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে' });
    }
    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone, address, division, district, upazila)
         VALUES ($1,$2,$3,'FARMER',$4,$5,$6,$7,$8) RETURNING *`,
        [name, email, hash, phone, address, division, district, upazila]
      );
      await client.query(
        `INSERT INTO farmers (user_id, name, phone, address, division, district, upazila, total_land_bigha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0)`,
        [userResult.rows[0].id, name, phone, address, division, district, upazila]
      );
      await client.query('COMMIT');
      const user = userResult.rows[0];
      const token = signToken(user);
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'ইমেইল এবং পাসওয়ার্ড দিন' });
  }
  const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) {
    return res.status(401).json({ error: 'ভুল ইমেইল অথবা পাসওয়ার্ড' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'ভুল ইমেইল অথবা পাসওয়ার্ড' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'অ্যাকাউন্ট নিষ্ক্রিয় আছে। প্রশাসকের সাথে যোগাযোগ করুন।' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;

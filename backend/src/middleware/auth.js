import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { queryOne } from '../db.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'লগইন প্রয়োজন' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await queryOne(
      'SELECT id, name, email, role, phone, address, division, district, upazila, is_active FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'অ্যাকাউন্ট নিষ্ক্রিয় অথবা পাওয়া যায়নি' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'অবৈধ অথবা মেয়াদোত্তীর্ণ টোকেন' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'অনুমতি নেই' });
    }
    next();
  };
}

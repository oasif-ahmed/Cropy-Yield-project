import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

async function ensureNotifications(user) {
  const userId = user.id;
  const inserted = [];

  if (user.role === 'FARMER') {
    const farmer = await queryOne('SELECT id, division FROM farmers WHERE user_id = $1', [userId]);
    if (!farmer) return [];
    const crops = await query(
      `SELECT c.* FROM crops c WHERE c.farmer_id = $1 AND c.status <> 'HARVESTED'`,
      [farmer.id]
    );
    for (const crop of crops.rows) {
      if (crop.expected_harvest_date) {
        const days = Math.round((new Date(crop.expected_harvest_date) - new Date()) / 86400000);
        if (days >= 0 && days <= 7) {
          inserted.push({
            title: `ফসল কাটার সময় ${days} দিনের মধ্যে`,
            body: `${crop.name} (${crop.variety || 'জাত অজানা'}) − আশানুরূপ সময়ে কাটুন।`,
            type: 'harvest',
          });
        }
      }
      const open = await queryOne(
        "SELECT COUNT(*)::int AS n FROM disease_logs WHERE crop_id = $1 AND status = 'OPEN'",
        [crop.id]
      );
      if (open.n > 0) {
        inserted.push({
          title: `${crop.name} খেতে রোগ-পোকা সক্রিয়`,
          body: `${open.n}টি খোলা রিপোর্ট আছে। ব্যবস্থা নিন।`,
          type: 'alert',
        });
      }
    }
  } else {
    const open = await queryOne("SELECT COUNT(*)::int AS n FROM disease_logs WHERE status = 'OPEN'");
    if (open.n > 0) {
      inserted.push({
        title: `${open.n}টি খোলা রোগ-পোকা রিপোর্ট`,
        body: 'নতুন রোগ-পোকা রিপোর্ট জমা আছে। পরিদর্শন করুন।',
        type: 'alert',
      });
    }
    const upcoming = await query(
      `SELECT c.name, c.expected_harvest_date FROM crops c
       WHERE c.status <> 'HARVESTED' AND c.expected_harvest_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7`
    );
    if (upcoming.rows.length) {
      inserted.push({
        title: `${upcoming.rows.length}টি ফসল কাটার অপেক্ষায়`,
        body: upcoming.rows.map((r) => `${r.name} (${r.expected_harvest_date})`).join(', '),
        type: 'harvest',
      });
    }
  }

  for (const item of inserted) {
    const dup = await queryOne(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND title = $2 AND type = $3 AND created_at > now() - interval '24 hours'`,
      [userId, item.title, item.type]
    );
    if (!dup) {
      await query(
        'INSERT INTO notifications (user_id, title, body, type) VALUES ($1,$2,$3,$4)',
        [userId, item.title, item.body, item.type]
      );
    }
  }
}

router.get('/', async (req, res) => {
  try {
    await ensureNotifications(req.user);
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'বিজ্ঞপ্তি পাওয়া যায়নি' });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const result = await queryOne(
      "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
      [req.user.id]
    );
    res.json({ count: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'বিজ্ঞপ্তি পাওয়া যায়নি' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'আপডেট ব্যর্থ হয়েছে' });
  }
});

export default router;

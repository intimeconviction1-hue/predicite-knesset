import { queryOne } from '../db/index.js';

export async function requireAuth(req, res, next) {
  try {
    const email = req.session?.user_email;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

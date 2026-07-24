import express from 'express';
import { randomUUID } from 'node:crypto';
import { queryOne, run } from '../db/index.js';

/**
 * Auth volontairement minimale : email seul, pas de mot de passe, session cookie.
 * Convient à un usage personnel/petit cercle. À durcir (mot de passe, magic link
 * par email, ou OAuth) avant toute ouverture à un public plus large — voir
 * docs/HISTORIQUE-PIVOT-BASE44.md pour le contexte.
 *
 * Le premier compte créé, ou tout email listé dans ADMIN_EMAILS (.env, séparés
 * par des virgules), reçoit le rôle 'admin' — nécessaire pour déclencher les
 * collecteurs et le scoring depuis le Profil/AdminSync.
 */

const router = express.Router();

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const full_name = (req.body?.full_name || '').trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide.' });
    }

    let user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // COUNT(*) revient en BIGINT côté Postgres, donc en string via pg — Number() nécessaire.
      const { n } = await queryOne('SELECT COUNT(*) as n FROM users');
      const isFirstUser = Number(n) === 0;
      const isListedAdmin = getAdminEmails().includes(email);
      const role = (isFirstUser || isListedAdmin) ? 'admin' : 'user';

      const id = randomUUID();
      await run(
        'INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)',
        [id, email, full_name || email.split('@')[0], role]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);

      // Initialise la progression utilisateur (équivalent ensureUserProgress)
      await run(
        'INSERT INTO user_progress (id, user_email) VALUES (?, ?) ON CONFLICT (user_email) DO NOTHING',
        [randomUUID(), email]
      );
    }

    req.session.user_email = user.email;
    res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', async (req, res, next) => {
  try {
    const email = req.session?.user_email;
    if (!email) return res.status(401).json({ error: 'Non connecté' });
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Non connecté' });
    res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
  } catch (e) {
    next(e);
  }
});

export default router;

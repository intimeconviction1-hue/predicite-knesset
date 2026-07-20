import express from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db/index.js';

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

router.post('/login', (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const full_name = (req.body?.full_name || '').trim();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    const totalUsers = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    const isFirstUser = totalUsers === 0;
    const isListedAdmin = getAdminEmails().includes(email);
    const role = (isFirstUser || isListedAdmin) ? 'admin' : 'user';

    const id = randomUUID();
    db.prepare('INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)')
      .run(id, email, full_name || email.split('@')[0], role);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    // Initialise la progression utilisateur (équivalent ensureUserProgress)
    db.prepare('INSERT OR IGNORE INTO user_progress (id, user_email) VALUES (?, ?)')
      .run(randomUUID(), email);
  }

  req.session.user_email = user.email;
  res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  const email = req.session?.user_email;
  if (!email) return res.status(401).json({ error: 'Non connecté' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Non connecté' });
  res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
});

export default router;

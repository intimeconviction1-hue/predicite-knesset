import express from 'express';
import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { queryOne, run } from '../db/index.js';

/**
 * Auth par email, sans mot de passe, session cookie — SAUF pour le rôle admin.
 *
 * Le compte joueur reste volontairement sans friction : l'enjeu d'usurper un
 * joueur est faible, et le produit vit de l'inscription immédiate. À durcir
 * (magic link ou OAuth) quand un service d'envoi d'e-mails sera en place.
 *
 * Le rôle admin, lui, était le vrai trou : il suffisait de taper l'email admin
 * dans le formulaire pour déclencher le scoring, résoudre le Premier ministre
 * et ouvrir les marchés — donc pour contourner tous les contrôles isAdmin des
 * routes. Il exige désormais ADMIN_KEY, un secret qui ne vit que côté serveur.
 */

const router = express.Router();
const IS_PROD = process.env.NODE_ENV === 'production';

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a), 'utf8');
  const B = Buffer.from(String(b), 'utf8');
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

/**
 * Sans ADMIN_KEY configurée, on refuse la promotion admin en production plutôt
 * que de laisser passer : mieux vaut un admin temporairement inaccessible
 * qu'un admin ouvert à tous.
 */
function adminKeyOk(provided) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return !IS_PROD;
  return typeof provided === 'string' && provided.length > 0 && safeEqual(provided, expected);
}

// Limiteur mémoire simple : la clé admin est la dernière ligne de défense,
// on ne la laisse pas deviner par répétition. Réinitialisé à chaque redéploiement,
// ce qui est acceptable ici.
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map();

function tooManyFailures(ip) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > FAILURE_WINDOW_MS) { failures.delete(ip); return false; }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip) {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.first > FAILURE_WINDOW_MS) {
    failures.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count++;
  }
}

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const full_name = (req.body?.full_name || '').trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide.' });
    }

    let user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

    // Toute connexion qui aboutirait à un rôle admin — compte admin existant ou
    // promotion à la création — doit présenter ADMIN_KEY.
    const isListedAdmin = getAdminEmails().includes(email);
    let isFirstUser = false;
    if (!user) {
      // COUNT(*) revient en BIGINT côté Postgres, donc en string via pg — Number() nécessaire.
      const { n } = await queryOne('SELECT COUNT(*) as n FROM users');
      // L'auto-promotion du premier compte est un confort de dev : en production
      // elle offrirait le rôle admin au premier visiteur si la table était vide.
      isFirstUser = Number(n) === 0 && !IS_PROD;
    }

    const wouldBeAdmin = user ? user.role === 'admin' : (isFirstUser || isListedAdmin);

    if (wouldBeAdmin) {
      const ip = req.ip || req.socket?.remoteAddress || 'inconnu';
      if (tooManyFailures(ip)) {
        return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
      }
      if (!adminKeyOk(req.body?.admin_key)) {
        recordFailure(ip);
        return res.status(403).json({ error: 'Clé admin requise ou invalide.' });
      }
    }

    if (!user) {
      const role = wouldBeAdmin ? 'admin' : 'user';

      const id = randomUUID();
      await run(
        'INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)',
        [id, email, full_name || email.split('@')[0], role]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);

      // Initialise la progression utilisateur (équivalent ensureUserProgress).
      // display_name est le SEUL nom exposé publiquement dans le classement :
      // on part du nom réellement saisi, jamais de user.full_name, qui vaut la
      // partie avant l'arobase quand le champ est laissé vide.
      const display_name = full_name || `Joueur ${createHash('md5').update(email).digest('hex').slice(0, 4)}`;
      await run(
        'INSERT INTO user_progress (id, user_email, display_name) VALUES (?, ?, ?) ON CONFLICT (user_email) DO NOTHING',
        [randomUUID(), email, display_name]
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

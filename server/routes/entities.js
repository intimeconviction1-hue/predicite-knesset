import express from 'express';
import { queryEntity, createEntity, updateEntity, deleteEntity, ENTITY_CONFIG } from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { repondreErreur } from '../lib/erreur-http.js';

const router = express.Router();

/**
 * Contrôle d'accès de l'API entités.
 *
 * Cette route était totalement ouverte : n'importe qui pouvait, sans compte,
 * modifier son UserProgress (classement), injecter un faux SondageSieges ou
 * supprimer les Listes. Le dépôt étant public, ce n'était plus tenable.
 *
 * Le verrouillage n'est pas uniforme, parce que le produit repose sur trois
 * usages distincts :
 *   - le mode invité (lib/useGuestGate.js) doit voir les données de référence
 *     sans compte, donc la lecture reste publique pour celles-ci ;
 *   - les données personnelles (pronostics, réponses de quiz) ne doivent être
 *     lisibles que par leur propriétaire — lire les pronostics des autres
 *     avant la clôture, c'est tricher ;
 *   - l'écriture est réservée aux admins, sauf le pronostic Premier ministre
 *     que les pages écrivent directement (PremierMinistre.jsx). Tout le reste
 *     passe déjà par /api/functions, qui applique ses propres règles.
 */

// Lecture sans compte : référence publique + classement (déjà affiché
// publiquement par Leaderboard.jsx).
const PUBLIC_READ = new Set([
  'Liste', 'SondageSieges', 'ResultatSieges', 'KnessetHistorique',
  'QuizQuestion', 'CandidatPM', 'CampaignSettings', 'Badge',
  'UserProgress', 'ParisMarche', 'ParisIssue',
]);

// Lecture réservée au propriétaire : le filtre user_email est imposé par le
// serveur, il ne vient jamais de la query string.
// MiniJeuPartie suit QuizReponse, son analogue exact : c'est un journal d'activité
// nominatif. Sans cette ligne, l'entité serait lisible par n'importe quel compte
// SANS filtre imposé — readGuard n'exige alors qu'une session, et la réponse
// dirait qui a joué à quoi, quel jour. L'écriture, elle, reste admin par défaut :
// les points se gagnent par /api/functions, jamais en POSTant la ligne soi-même.
const OWNER_SCOPED = new Set(['PronosticSieges', 'PronosticPM', 'QuizReponse', 'ParisMise', 'MiniJeuPartie']);

// Seule écriture autorisée à un joueur connecté sur cette route.
const USER_WRITABLE = new Set(['PronosticPM']);

// Champs qu'un joueur ne peut jamais fixer lui-même : ils sont calculés par le
// scoring côté serveur.
const SERVER_OWNED_FIELDS = ['points_earned', 'is_correct', 'created_at'];

/**
 * Champs jamais renvoyés sur la ligne de quelqu'un d'autre.
 *
 * UserProgress doit rester lisible sans compte — c'est le classement, que le
 * mode invité affiche. Mais l'adresse e-mail de chaque joueur n'a rien à y
 * faire : associer une adresse nominative à un pronostic sur ce scrutin est un
 * risque pour l'utilisateur. Le classement s'affiche donc sur display_name.
 */
const CHAMPS_PRIVES = { UserProgress: ['user_email'] };

function projeter(req, name, rows) {
  const champs = CHAMPS_PRIVES[name];
  if (!champs || req.user?.role === 'admin') return rows;
  const moi = req.user?.email;
  return rows.map(row => {
    if (moi && row.user_email === moi) return row; // sa propre ligne, intacte
    const out = { ...row };
    for (const champ of champs) delete out[champ];
    return out;
  });
}

/**
 * Masquer le champ ne suffit pas : filtrer dessus ferait de la route un oracle
 * d'inscription — la réponse dirait si telle adresse a un compte. Le filtre
 * n'est donc autorisé que sur sa propre ligne.
 */
function filtreRefuse(req, name, where) {
  if (!CHAMPS_PRIVES[name] || req.user?.role === 'admin') return null;
  if (where.user_email === undefined) return null;
  if (req.user?.email && where.user_email === req.user.email) return null;
  return 'Filtrer sur user_email est réservé à sa propre ligne.';
}

function requireKnownEntity(req, res, next) {
  if (!ENTITY_CONFIG[req.params.name]) {
    return res.status(404).json({ error: `Entité inconnue : ${req.params.name}` });
  }
  next();
}

function readGuard(req, res, next) {
  if (PUBLIC_READ.has(req.params.name)) return next();
  return requireAuth(req, res, next);
}

function writeGuard(req, res, next) {
  if (USER_WRITABLE.has(req.params.name)) return requireAuth(req, res, next);
  return requireAdmin(req, res, next);
}

// Un joueur écrit sous sa propre identité, et ne fixe pas ses propres points.
function sanitizeUserPayload(req, payload) {
  if (req.user?.role === 'admin') return payload;
  const out = { ...payload };
  for (const f of SERVER_OWNED_FIELDS) delete out[f];
  out.user_email = req.user.email;
  out.points_earned = 0;
  return out;
}

async function loadOwnedRow(entityName, id) {
  return (await queryEntity(entityName, { where: { id } }))[0] || null;
}

router.use('/:name', requireKnownEntity);

// GET /api/entities/:name?champ=valeur&_sort=-poll_date&_limit=12
router.get('/:name', readGuard, async (req, res) => {
  try {
    const { _sort, _limit, ...where } = req.query;
    if (OWNER_SCOPED.has(req.params.name) && req.user.role !== 'admin') {
      where.user_email = req.user.email;
    }
    const refus = filtreRefuse(req, req.params.name, where);
    if (refus) return res.status(403).json({ error: refus });

    const rows = await queryEntity(req.params.name, { where, sort: _sort, limit: _limit });
    res.json(projeter(req, req.params.name, rows));
  } catch (e) {
    repondreErreur(res, e, 'entities');
  }
});

// POST /api/entities/:name
router.post('/:name', writeGuard, async (req, res) => {
  try {
    const payload = sanitizeUserPayload(req, req.body || {});
    const row = await createEntity(req.params.name, payload);
    res.status(201).json(row);
  } catch (e) {
    repondreErreur(res, e, 'entities');
  }
});

// PUT /api/entities/:name/:id
router.put('/:name/:id', writeGuard, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const existing = await loadOwnedRow(req.params.name, req.params.id);
      if (!existing) return res.status(404).json({ error: 'Introuvable' });
      if (existing.user_email !== req.user.email) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const payload = sanitizeUserPayload(req, req.body || {});
    const row = await updateEntity(req.params.name, req.params.id, payload);
    res.json(row);
  } catch (e) {
    repondreErreur(res, e, 'entities');
  }
});

// DELETE /api/entities/:name/:id — admin uniquement, sans exception.
router.delete('/:name/:id', requireAdmin, async (req, res) => {
  try {
    const result = await deleteEntity(req.params.name, req.params.id);
    res.json(result);
  } catch (e) {
    repondreErreur(res, e, 'entities');
  }
});

export default router;

/**
 * Mesure d'audience — première partie, sans cookie, sans identifiant.
 *
 * Pourquoi elle existe. Diffuser sans mesurer, c'est envoyer des liens et
 * espérer. La question à laquelle ce compteur répond n'est pas « combien de
 * visiteurs » — c'est « lequel des liens partagés ramène du monde » : la carte
 * de la Boussole, l'invitation à une ligue, le score d'un mini-jeu, ou aucun.
 * Sans cette réponse, on ne peut qu'insister au hasard.
 *
 * Pourquoi pas un outil existant. Google Analytics ou un équivalent aurait
 * demandé un bandeau de consentement, donc un obstacle sur la page d'accueil
 * d'un site qu'on cherche justement à faire essayer, et l'envoi de données de
 * navigation à un tiers sur un scrutin politique. Le compteur ci-dessous stocke
 * strictement trois choses : un jour, une page, une provenance. Il ne voit ni
 * l'adresse IP, ni la session, ni le compte — `req.ip` n'apparaît nulle part
 * dans ce fichier, et c'est délibéré.
 *
 * Ce qu'il ne sait pas faire, et qu'il ne faut pas lui demander : distinguer un
 * visiteur d'un robot, compter des visiteurs uniques, ou suivre un parcours de
 * page en page. Ces trois choses supposent de reconnaître quelqu'un, c'est-à-dire
 * exactement ce à quoi on renonce ici. Les chiffres sont donc des ordres de
 * grandeur comparables entre eux, pas une métrique d'audience certifiée.
 */
import express from 'express';
import { queryAll, run } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { metaPour } from '../../client/src/lib/titres.js';

const router = express.Router();

/**
 * Les provenances acceptées. Une liste fermée, et non un simple nettoyage de
 * chaîne : `via` vient du navigateur, donc de n'importe qui. Sans liste, un
 * seul script suffirait à créer des dizaines de milliers de lignes dans une
 * table dont la clé primaire contient ce champ — un moyen simple de remplir une
 * base gratuite. Une valeur inconnue est comptée comme une visite directe
 * plutôt que rejetée : on ne perd pas la vue, on refuse seulement d'en croire
 * l'étiquette.
 */
const PROVENANCES = new Set([
  'projection',    // la carte de MaRepartition
  'boussole',
  'coalition',
  'sens-du-vent',
  'vrai-ou-fake',
  'ligue',         // l'invitation par code
]);

/** Le jour en UTC, au format de schema.sql. */
const jourUTC = () => new Date().toISOString().slice(0, 10);

/**
 * POST /api/audience — compte une vue.
 *
 * Répond 204 dans tous les cas, y compris quand la donnée est refusée ou que
 * l'écriture échoue : ce point d'entrée ne doit jamais faire apparaître d'erreur
 * dans la console d'un visiteur ni ralentir sa navigation. Une mesure ratée est
 * un chiffre en moins, pas un incident.
 */
router.post('/', async (req, res) => {
  res.status(204).end();

  try {
    const page = String(req.body?.page || '');
    // La page est validée contre le référentiel des pages connues. C'est la même
    // garde que la 404 du serveur, et elle sert ici à empêcher qu'une chaîne
    // arbitraire devienne une ligne de la table.
    if (!metaPour(page).connue) return;

    const brut = String(req.body?.via || '');
    const via = PROVENANCES.has(brut) ? brut : '';

    await run(
      `INSERT INTO audience_vues (jour, page, via, vues) VALUES (?, ?, ?, 1)
         ON CONFLICT (jour, page, via) DO UPDATE SET vues = audience_vues.vues + 1`,
      [jourUTC(), page, via],
    );
  } catch (e) {
    console.error('[audience] vue non comptée :', e.message);
  }
});

/**
 * GET /api/audience — la lecture, réservée aux admins.
 *
 * @query {number} jours  fenêtre glissante, 30 par défaut, 365 au plus.
 */
router.get('/', requireAdmin, async (req, res) => {
  const jours = Math.min(365, Math.max(1, Number(req.query.jours) || 30));
  const depuis = new Date(Date.now() - jours * 86400000).toISOString().slice(0, 10);

  try {
    const [parPage, parProvenance, parJour, total] = await Promise.all([
      queryAll(
        `SELECT page, SUM(vues)::int AS vues FROM audience_vues
          WHERE jour >= ? GROUP BY page ORDER BY vues DESC`, [depuis]),
      // La provenance est ce qu'on regarde pour piloter la diffusion : on
      // n'agrège donc PAS les visites directes avec les autres, sans quoi elles
      // écraseraient tout le reste et la comparaison entre cartes deviendrait
      // illisible.
      queryAll(
        `SELECT via, SUM(vues)::int AS vues FROM audience_vues
          WHERE jour >= ? AND via <> '' GROUP BY via ORDER BY vues DESC`, [depuis]),
      queryAll(
        `SELECT jour, SUM(vues)::int AS vues FROM audience_vues
          WHERE jour >= ? GROUP BY jour ORDER BY jour ASC`, [depuis]),
      queryAll(
        `SELECT SUM(vues)::int AS vues FROM audience_vues WHERE jour >= ?`, [depuis]),
    ]);

    res.json({
      depuis,
      jours,
      total: total[0]?.vues || 0,
      par_page: parPage,
      par_provenance: parProvenance,
      par_jour: parJour,
    });
  } catch (e) {
    console.error('[audience] lecture impossible :', e.message);
    res.status(500).json({ error: 'Lecture impossible' });
  }
});

export default router;

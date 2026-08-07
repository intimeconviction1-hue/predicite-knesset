import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runSondagesSiegesCollector } from '../functions/sondagesSiegesCollector.js';
import { getPollTrackerStatus } from '../functions/pollTracker.js';
import { runKanSheetCollector } from '../functions/kanSheetCollector.js';
import { runResultatsKnessetCollector } from '../functions/resultatsKnessetCollector.js';
import { saveResultatsManuels } from '../functions/resultatsManuels.js';
import { submitRepartitionSieges, scoreSiegesAndSync, scoreBlocMajoritaire } from '../functions/prediciteScoringSieges.js';
import { resolvePremierMinistre, autoResolveIfExpired } from '../functions/resolvePremierMinistre.js';
import { ensureUserProgress, updateStreakAndBadges, getUserBadges } from '../functions/miscFunctions.js';
import { submitQuizAnswer } from '../functions/quizScoring.js';
import { getOpenMarketsWithCotes, placerMise, ensureWeeklyJetons, openMancheRang, resolveByPoll, proposerMarchesEvenements, openMarcheEvenement, resolveMarcheManuel, listerMises } from '../functions/parisSondages.js';
import { getDefiSerie, startDefiSerie } from '../functions/defisQuiz.js';
import { createLigue, joinLigue, myLigues, ligueLeaderboard, leaveLigue } from '../functions/ligues.js';

const router = express.Router();

router.post('/:name', requireAuth, async (req, res) => {
  const { name } = req.params;
  const body = req.body || {};
  const isAdmin = req.user.role === 'admin';

  try {
    switch (name) {
      case 'ensureUserProgress':
        return res.json(await ensureUserProgress(req.user.email));

      case 'updateStreakAndBadges':
        return res.json(await updateStreakAndBadges(req.user.email));

      // Badges du joueur connecté. La table user_badges n'est pas exposée via
      // /api/entities (elle n'a pas de config d'entité, et n'a pas à être
      // écrite depuis le client) : la lecture passe donc par ici, toujours
      // limitée à sa propre ligne — on ne consulte jamais le palmarès d'autrui.
      // Les DÉFINITIONS (Badge) restent lisibles publiquement via /api/entities.
      case 'badges': {
        if (body.action === 'mine') return res.json(await getUserBadges(req.user.email));
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'submitQuizAnswer':
        return res.json(await submitQuizAnswer(req.user.email, body));

      case 'prediciteScoringSieges': {
        if (body.action === 'submitRepartition') {
          return res.json(await submitRepartitionSieges(req.user.email, body));
        }
        // Ancien dépôt liste par liste : incompatible avec la contrainte de
        // somme à 120. Message explicite plutôt qu'un « action inconnue »,
        // pour un client resté en cache.
        if (body.action === 'submitPronosticSieges') {
          return res.status(400).json({
            error: 'Le pronostic se dépose désormais en une fois, sur la répartition complète des 120 sièges. Recharge la page.',
          });
        }
        if (body.action === 'scoreSiegesAndSync') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await scoreSiegesAndSync());
        }
        if (body.action === 'scoreBlocMajoritaire') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await scoreBlocMajoritaire());
        }
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'resolvePremierMinistre': {
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        if (body.action === 'resolve') return res.json(await resolvePremierMinistre(body.investedCandidatPmId));
        if (body.action === 'autoResolveIfExpired') return res.json(await autoResolveIfExpired());
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'parisSondages': {
        if (body.action === 'listMarches') return res.json({ marches: await getOpenMarketsWithCotes() });
        if (body.action === 'ensureJetons') return res.json(await ensureWeeklyJetons(req.user.email));
        if (body.action === 'placerMise') return res.json(await placerMise(req.user.email, body));
        // Ses propres paris, et rien d'autre : l'e-mail vient du jeton
        // d'authentification (req.user), jamais du corps de la requête.
        if (body.action === 'mesMises') return res.json(await listerMises(req.user.email));
        if (body.action === 'openManche') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await openMancheRang());
        }
        if (body.action === 'resolveByPoll') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await resolveByPoll(body.sondage_id));
        }
        // Marchés événements (admin) : proposer / ouvrir / résoudre manuellement.
        if (body.action === 'proposerEvenements') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json({ propositions: proposerMarchesEvenements() });
        }
        if (body.action === 'openEvenement') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await openMarcheEvenement(body));
        }
        if (body.action === 'resolveEvenement') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await resolveMarcheManuel(body.marche_id, body.winning_issue_id));
        }
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'defiSerie': {
        if (body.action === 'get') return res.json(await getDefiSerie(req.user.email));
        if (body.action === 'start') return res.json(await startDefiSerie(req.user.email, body));
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'ligues': {
        if (body.action === 'create') return res.json(await createLigue(req.user.email, body));
        if (body.action === 'join') return res.json(await joinLigue(req.user.email, body));
        if (body.action === 'mine') return res.json(await myLigues(req.user.email));
        if (body.action === 'leaderboard') return res.json(await ligueLeaderboard(req.user.email, body));
        if (body.action === 'leave') return res.json(await leaveLigue(req.user.email, body));
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'sondagesSiegesCollector':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await runSondagesSiegesCollector());

      // Collecteur maître : le Google Sheet de Kan. body.dryRun / body.all possibles.
      case 'kanSheetCollector':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await runKanSheetCollector({ onlyNewer: !body.all, dryRun: !!body.dryRun }));

      // Surveillance des sondages : état du traqueur + trace du dernier run.
      case 'pollTrackerStatus':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await getPollTrackerStatus());

      case 'resultatsKnessetCollector':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await runResultatsKnessetCollector());

      // Saisie manuelle des résultats — le chemin principal du soir du scrutin,
      // le collecteur automatique n'étant qu'un confort. body.dry_run valide
      // sans écrire.
      case 'resultatsManuels':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await saveResultatsManuels(body));

      default:
        return res.status(404).json({ error: `Fonction inconnue : ${name}` });
    }
  } catch (e) {
    const status = e.status || 400;
    // e.validation : liste détaillée des erreurs de saisie (résultats manuels),
    // pour que l'écran admin les affiche une par une plutôt qu'en un seul bloc.
    return res.status(status).json({ error: e.message, deadline_utc: e.deadline_utc, validation: e.validation });
  }
});

export default router;

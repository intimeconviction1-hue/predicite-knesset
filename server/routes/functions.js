import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runSondagesSiegesCollector } from '../functions/sondagesSiegesCollector.js';
import { runResultatsKnessetCollector } from '../functions/resultatsKnessetCollector.js';
import { submitPronosticSieges, scoreSiegesAndSync, scoreBlocMajoritaire } from '../functions/prediciteScoringSieges.js';
import { resolvePremierMinistre, autoResolveIfExpired } from '../functions/resolvePremierMinistre.js';
import { ensureUserProgress, updateStreakAndBadges } from '../functions/miscFunctions.js';
import { submitQuizAnswer } from '../functions/quizScoring.js';
import { getOpenMarketsWithCotes, placerMise, ensureWeeklyJetons, openMancheRang, resolveByPoll } from '../functions/parisSondages.js';

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

      case 'submitQuizAnswer':
        return res.json(await submitQuizAnswer(req.user.email, body));

      case 'prediciteScoringSieges': {
        if (body.action === 'submitPronosticSieges') {
          return res.json(await submitPronosticSieges(req.user.email, body));
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
        if (body.action === 'openManche') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await openMancheRang());
        }
        if (body.action === 'resolveByPoll') {
          if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
          return res.json(await resolveByPoll(body.sondage_id));
        }
        return res.status(400).json({ error: 'action inconnue' });
      }

      case 'sondagesSiegesCollector':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await runSondagesSiegesCollector());

      case 'resultatsKnessetCollector':
        if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
        return res.json(await runResultatsKnessetCollector());

      default:
        return res.status(404).json({ error: `Fonction inconnue : ${name}` });
    }
  } catch (e) {
    const status = e.status || 400;
    return res.status(status).json({ error: e.message, deadline_utc: e.deadline_utc });
  }
});

export default router;

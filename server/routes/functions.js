import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runSondagesSiegesCollector } from '../functions/sondagesSiegesCollector.js';
import { runResultatsKnessetCollector } from '../functions/resultatsKnessetCollector.js';
import { submitPronosticSieges, scoreSiegesAndSync, scoreBlocMajoritaire } from '../functions/prediciteScoringSieges.js';
import { resolvePremierMinistre, autoResolveIfExpired } from '../functions/resolvePremierMinistre.js';
import { ensureUserProgress, updateStreakAndBadges } from '../functions/miscFunctions.js';

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

// Route PUBLIQUE des paris : les marchés ouverts et leurs cotes en temps réel
// sont visibles par tout le monde (accroche/rétention), sans être connecté.
// Miser reste réservé aux connectés (via /api/functions/parisSondages).
import express from 'express';
import { getOpenMarketsWithCotes } from '../functions/parisSondages.js';
import { repondreErreur } from '../lib/erreur-http.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.json({ marches: await getOpenMarketsWithCotes() });
  } catch (e) {
    repondreErreur(res, e, 'paris');
  }
});

export default router;

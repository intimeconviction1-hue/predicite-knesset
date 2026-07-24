import express from 'express';
import { queryEntity, createEntity, updateEntity, deleteEntity, ENTITY_CONFIG } from '../db/index.js';

const router = express.Router();

function requireKnownEntity(req, res, next) {
  if (!ENTITY_CONFIG[req.params.name]) {
    return res.status(404).json({ error: `Entité inconnue : ${req.params.name}` });
  }
  next();
}

router.use('/:name', requireKnownEntity);

// GET /api/entities/:name?champ=valeur&_sort=-poll_date&_limit=12
router.get('/:name', async (req, res) => {
  try {
    const { _sort, _limit, ...where } = req.query;
    const rows = await queryEntity(req.params.name, { where, sort: _sort, limit: _limit });
    res.json(rows);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/entities/:name
router.post('/:name', async (req, res) => {
  try {
    const row = await createEntity(req.params.name, req.body || {});
    res.status(201).json(row);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/entities/:name/:id
router.put('/:name/:id', async (req, res) => {
  try {
    const row = await updateEntity(req.params.name, req.params.id, req.body || {});
    res.json(row);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/entities/:name/:id
router.delete('/:name/:id', async (req, res) => {
  try {
    const result = await deleteEntity(req.params.name, req.params.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;

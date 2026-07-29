import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDb } from './db/index.js';
import { startPollTracker } from './functions/pollTracker.js';
import authRouter from './routes/auth.js';
import entitiesRouter from './routes/entities.js';
import functionsRouter from './routes/functions.js';
import actuRouter from './routes/actu.js';
import parisRouter from './routes/paris.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8788;

const app = express();
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-moi-avant-toute-mise-en-ligne-publique',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
  },
}));

app.use('/api/auth', authRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/actu', actuRouter);
app.use('/api/paris', parisRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// En production, servir le build Vite (client/dist) directement depuis Express.
// En dev, le frontend tourne séparément (vite) et proxy /api vers ce serveur —
// voir client/vite.config.js.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PrédiCité (Knesset) — serveur sur http://localhost:${PORT}`);
      // Traque les sondages en continu (LLM + web_search), throttlé.
      startPollTracker();
    });
  })
  .catch(e => {
    console.error('[db] Échec de connexion/initialisation Postgres :', e.message);
    process.exit(1);
  });

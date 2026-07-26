// Applique db/schema.sql à la base configurée (DATABASE_URL). Le schéma
// n'utilise que CREATE TABLE / ALTER TABLE ... IF NOT EXISTS : c'est donc
// idempotent et sûr à ré-exécuter (migration additive).
// Usage : npm run db:migrate  (depuis server/)
import 'dotenv/config';
import { initDb, pool } from '../db/index.js';

await initDb();
console.log('Schéma appliqué (CREATE/ALTER IF NOT EXISTS — idempotent).');
await pool.end();

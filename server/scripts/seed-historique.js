// Importe docs/KNESSET_SEED_HISTORIQUE.json dans la table knesset_historique.
// Usage : npm run seed:historique (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_HISTORIQUE.json');

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const elections = seed.elections || [];

  let created = 0, skipped = 0;
  for (const e of elections) {
    const existing = await filterEntity('KnessetHistorique', { knesset_number: e.knesset_number });
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await createEntity('KnessetHistorique', {
      knesset_number: e.knesset_number,
      election_date: e.election_date,
      name: e.name,
      turnout_pct: e.turnout_pct ?? null,
      threshold_pct: e.threshold_pct ?? null,
      results: e.results,
      pm_after: e.pm_after || null,
      notes: e.notes || null,
      source_url: e.source_url,
    });
    created++;
  }

  console.log(`Import terminé : ${created} élection(s) créée(s), ${skipped} déjà présente(s) (ignorées).`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

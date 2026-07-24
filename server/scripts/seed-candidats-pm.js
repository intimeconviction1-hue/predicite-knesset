// Importe docs/KNESSET_SEED_CANDIDATS_PM.json dans la table candidats_pm.
// Usage : npm run seed:candidats-pm (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_CANDIDATS_PM.json');

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const candidats = seed.candidats || [];

  let created = 0, skipped = 0, unmatched = 0;
  for (const c of candidats) {
    const existing = await filterEntity('CandidatPM', { name_fr: c.name_fr });
    if (existing.length > 0) { skipped++; continue; }

    const liste = (await filterEntity('Liste', { name_fr: c.liste_name_fr }))[0];
    if (!liste) {
      console.warn(`Liste introuvable pour "${c.name_fr}" : "${c.liste_name_fr}" — candidat ignoré.`);
      unmatched++;
      continue;
    }

    await createEntity('CandidatPM', {
      name_fr: c.name_fr,
      name_he: c.name_he || null,
      liste_id: liste.id,
      photo_url: c.photo_url || null,
      is_active: true,
    });
    created++;
  }

  console.log(`Import terminé : ${created} créés, ${skipped} déjà présents (ignorés), ${unmatched} liste(s) introuvable(s).`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

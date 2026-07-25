// Importe docs/KNESSET_SEED_SONDAGES.json dans la table sondages_sieges.
// Usage : npm run seed:sondages (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_SONDAGES.json');

function checksumFor(s) {
  return crypto.createHash('sha1').update(`${s.institute}|${s.poll_date}|${s.publisher_media || ''}`).digest('hex');
}

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const sondages = seed.sondages || [];

  const listes = await filterEntity('Liste', {});
  const idBySlug = Object.fromEntries(listes.map(l => [l.slug, l.id]));

  let created = 0, skipped = 0;
  for (const s of sondages) {
    const checksum = checksumFor(s);
    const existing = await filterEntity('SondageSieges', { checksum });
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const seats_by_liste = [];
    for (const row of s.seats_by_liste) {
      const liste_id = idBySlug[row.slug];
      if (!liste_id) {
        console.warn(`  ! Liste inconnue pour le slug "${row.slug}" (sondage ${s.institute} ${s.poll_date}) — ignorée`);
        continue;
      }
      seats_by_liste.push({ liste_id, seats: row.seats });
    }

    await createEntity('SondageSieges', {
      institute: s.institute,
      publisher_media: s.publisher_media || null,
      poll_date: s.poll_date,
      sample_size: s.sample_size ?? null,
      margin_error_pct: s.margin_error_pct ?? null,
      source_url: s.source_url,
      source_language: s.source_language || 'fr',
      seats_by_liste,
      checksum,
    });
    created++;
  }

  console.log(`Import terminé : ${created} sondage(s) créé(s), ${skipped} déjà présent(s) (ignorés).`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

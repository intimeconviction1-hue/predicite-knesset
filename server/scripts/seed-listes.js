// Importe docs/KNESSET_SEED_LISTES.json dans la table listes.
// Usage : npm run seed:listes (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_LISTES.json');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  // Script indépendant du serveur (npm run seed:listes) : il doit s'assurer
  // lui-même que le schéma existe avant d'écrire.
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const listes = seed.listes || [];

  let created = 0, skipped = 0;
  for (const l of listes) {
    const slug = l.slug || slugify(l.name_fr);
    const existing = await filterEntity('Liste', { slug });
    if (existing.length > 0) { skipped++; continue; }

    await createEntity('Liste', {
      name_fr: l.name_fr,
      name_he: l.name_he || null,
      slug,
      leader_name: l.leader_name || null,
      bloc: l.bloc,
      color: l.color || '#6B7280',
      founded_or_merged_note: l.founded_or_merged_note || null,
      is_active: true,
      current_knesset_seats: l.current_knesset_seats ?? null,
    });
    created++;
  }

  console.log(`Import terminé : ${created} créées, ${skipped} déjà présentes (ignorées).`);
  console.log('Rappel : vérifiez current_knesset_seats avant de vous y fier — voir la note en tête du fichier seed.');
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

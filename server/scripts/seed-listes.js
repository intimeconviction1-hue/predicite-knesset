// Importe docs/KNESSET_SEED_LISTES.json dans la table listes.
// Usage : npm run seed:listes (depuis server/)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { filterEntity, createEntity } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_LISTES.json');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const listes = seed.listes || [];

  let created = 0, skipped = 0;
  for (const l of listes) {
    const slug = l.slug || slugify(l.name_fr);
    const existing = filterEntity('Liste', { slug });
    if (existing.length > 0) { skipped++; continue; }

    createEntity('Liste', {
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
}

main();

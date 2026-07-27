// Importe docs/KNESSET_SEED_LISTES.json dans la table listes.
// Usage : npm run seed:listes (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, updateEntity, pool } from '../db/index.js';

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

  let created = 0, skipped = 0, updated = 0;
  for (const l of listes) {
    const slug = l.slug || slugify(l.name_fr);
    const existing = await filterEntity('Liste', { slug });
    if (existing.length > 0) {
      // Déjà présente : on complète juste les champs que le seed fournit et
      // que la ligne actuelle n'a pas encore (idempotent), sans toucher au reste.
      const patch = {};
      if (l.logo_url && !existing[0].logo_url) patch.logo_url = l.logo_url;
      if (l.current_knesset_seats != null && existing[0].current_knesset_seats == null) patch.current_knesset_seats = l.current_knesset_seats;
      // Histoire enrichie : on met à jour à chaque seed (contenu éditorial).
      if (l.histoire) patch.histoire = l.histoire;
      if (l.histoire_source) patch.histoire_source = l.histoire_source;
      if (Object.keys(patch).length > 0) {
        await updateEntity('Liste', existing[0].id, patch);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    await createEntity('Liste', {
      name_fr: l.name_fr,
      name_he: l.name_he || null,
      slug,
      leader_name: l.leader_name || null,
      bloc: l.bloc,
      color: l.color || '#6B7280',
      founded_or_merged_note: l.founded_or_merged_note || null,
      histoire: l.histoire || null,
      histoire_source: l.histoire_source || null,
      is_active: true,
      current_knesset_seats: l.current_knesset_seats ?? null,
      logo_url: l.logo_url || null,
    });
    created++;
  }

  console.log(`Import terminé : ${created} créées, ${updated} mise(s) à jour (logo/sièges), ${skipped} déjà présentes (ignorées).`);
  console.log('Rappel : vérifiez current_knesset_seats avant de vous y fier — voir la note en tête du fichier seed.');
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

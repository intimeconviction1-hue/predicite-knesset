// Importe docs/KNESSET_SEED_CANDIDATS_PM.json dans la table candidats_pm.
// Usage : npm run seed:candidats-pm (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, updateEntity, pool } from '../db/index.js';

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

  let created = 0, skipped = 0, updated = 0, unmatched = 0;
  for (const c of candidats) {
    const existing = await filterEntity('CandidatPM', { name_fr: c.name_fr });
    if (existing.length > 0) {
      // Déjà présent : on complète juste les champs manquants (idempotent,
      // ne touche rien d'autre — pas de risque pour les PronosticPM existants).
      const patch = {};
      if (c.photo_url && !existing[0].photo_url) patch.photo_url = c.photo_url;
      // Bio : contenu éditorial, mis à jour à chaque seed.
      if (c.bio) patch.bio = c.bio;
      if (c.bio_source) patch.bio_source = c.bio_source;
      if (Object.keys(patch).length > 0) {
        await updateEntity('CandidatPM', existing[0].id, patch);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

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
      bio: c.bio || null,
      bio_source: c.bio_source || null,
      is_active: true,
    });
    created++;
  }

  console.log(`Import terminé : ${created} créés, ${updated} mise(s) à jour (photo/bio), ${skipped} déjà présents (ignorés), ${unmatched} liste(s) introuvable(s).`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

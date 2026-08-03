// Importe docs/KNESSET_SEED_BADGES.json dans la table badges.
// Usage : npm run seed:badges (depuis server/)
//
// Idempotent : la clé métier est `code` (UNIQUE en base, et cible de la clé
// étrangère user_badges.badge_code). Relancer le script ne crée jamais de
// doublon et ne touche JAMAIS aux badges déjà attribués — on ne réécrit que la
// vitrine (libellé, description, icône) et l'ordre d'affichage.
//
// L'ordre vient du tableau JSON et se grave dans l'`id` (badge-01-…, badge-02-…)
// faute de colonne de tri dans la table `badges`, que ce script n'a pas le droit
// de modifier. Le client demande /api/entities/Badge?_sort=id et retrouve ainsi
// la progression voulue. Changer l'id est sans risque : la clé étrangère porte
// sur `code`, pas sur `id`.
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb, queryOne, run, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_BADGES.json');

const CODE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function idPour(code, rang) {
  return `badge-${String(rang).padStart(2, '0')}-${code}`;
}

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  // Script indépendant du serveur : il s'assure lui-même que le schéma existe
  // avant d'écrire (même contrat que seed-listes.js).
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const badges = seed.badges || [];

  let created = 0, updated = 0, skipped = 0;
  const vus = new Set();

  for (let i = 0; i < badges.length; i++) {
    const b = badges[i];
    const code = String(b.code || '').trim();

    // Un code mal formé casserait silencieusement l'attribution (les règles de
    // miscFunctions.js s'apparient par code) : on refuse plutôt que d'insérer.
    if (!CODE_RE.test(code)) {
      console.error(`Code invalide (kebab-case attendu) : « ${b.code} » — badge ignoré.`);
      continue;
    }
    if (vus.has(code)) {
      console.error(`Code en double dans le JSON : « ${code} » — deuxième occurrence ignorée.`);
      continue;
    }
    vus.add(code);

    const id = idPour(code, i + 1);
    const label = String(b.label || '').trim();
    const description = b.description ? String(b.description).trim() : null;
    const icon = b.icon ? String(b.icon).trim() : null;
    if (!label) {
      console.error(`Libellé manquant pour « ${code} » — badge ignoré.`);
      continue;
    }

    const existing = await queryOne('SELECT id, label, description, icon FROM badges WHERE code = ?', [code]);
    if (!existing) {
      await run(
        'INSERT INTO badges (id, code, label, description, icon) VALUES (?, ?, ?, ?, ?)',
        [id, code, label, description, icon]
      );
      created++;
      continue;
    }

    const change =
      existing.id !== id ||
      existing.label !== label ||
      existing.description !== description ||
      existing.icon !== icon;

    if (!change) { skipped++; continue; }

    await run(
      'UPDATE badges SET id = ?, label = ?, description = ?, icon = ? WHERE code = ?',
      [id, label, description, icon, code]
    );
    updated++;
  }

  // Badges présents en base mais absents du JSON : on ne les SUPPRIME pas —
  // ils sont peut-être déjà attribués à des joueurs, et la clé étrangère de
  // user_badges les protège de toute façon. On se contente de les signaler.
  let nbOrphelins = 0;
  if (vus.size > 0) {
    const orphelins = await queryOne('SELECT COUNT(*) AS n FROM badges WHERE code <> ALL (?::text[])', [[...vus]]);
    nbOrphelins = Number(orphelins?.n || 0);
  }

  console.log(`Import terminé : ${created} créé(s), ${updated} mis à jour, ${skipped} inchangé(s).`);
  if (nbOrphelins > 0) {
    console.log(`⚠️  ${nbOrphelins} badge(s) en base ne figurent plus dans le JSON — conservés (ils peuvent être déjà attribués), à supprimer à la main si c'est voulu.`);
  }
  console.log("Rappel : les SEUILS évalués vivent dans server/functions/miscFunctions.js (REGLES_BADGES) — vérifier qu'ils disent la même chose que les descriptions.");
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

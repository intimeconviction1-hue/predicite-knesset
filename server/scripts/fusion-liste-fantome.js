// Fusionne la liste fantôme « yachad-bennett » dans « ensemble-bennett-lapid ».
//
// CONTEXTE — La base de production contient une liste `yachad-bennett`
// (« Yachad (Bennett) ») héritée de Base44, absente de tout seed du dépôt.
// kanSheetCollector pointait dessus : 146 des 156 sondages ont atterri sur elle
// pendant que la vraie liste, alimentée par le seed curé, en recevait 10. Comme
// le slug résolvait bel et bien en base, aucune garde d'intégrité ne s'est
// déclenchée. La règle du collecteur est corrigée ; ce script rapatrie l'existant.
//
// Usage :
//   node scripts/fusion-liste-fantome.js            → SIMULATION, n'écrit rien
//   node scripts/fusion-liste-fantome.js --write    → applique, dans UNE transaction
//
// ⚠️ server/.env pointe la base de PRODUCTION. La simulation est en lecture seule.
import 'dotenv/config';
import { queryAll, pool } from '../db/index.js';

const FANTOME = 'yachad-bennett';
const REELLE = 'ensemble-bennett-lapid';
const write = process.argv.includes('--write');

function parseSeats(v) {
  return (typeof v === 'string' ? JSON.parse(v) : v) || [];
}

async function main() {
  console.log(write ? '=== MODE ÉCRITURE ===' : '=== SIMULATION (aucune écriture) ===');

  const listes = await queryAll('select id, slug, name_fr, is_active from listes');
  const fantome = listes.find(l => l.slug === FANTOME);
  const reelle = listes.find(l => l.slug === REELLE);

  if (!fantome) { console.log(`Aucune liste « ${FANTOME} » : rien à faire.`); return; }
  if (!reelle) throw new Error(`Liste cible « ${REELLE} » introuvable — abandon.`);
  console.log(`fantôme : ${fantome.name_fr}  (${fantome.id})`);
  console.log(`cible   : ${reelle.name_fr}  (${reelle.id})\n`);

  // 1. Sondages ---------------------------------------------------------------
  const sondages = await queryAll('select id, poll_date, publisher_media, seats_by_liste from sondages_sieges');
  const aReecrire = [];
  const conflits = [];
  for (const s of sondages) {
    const seats = parseSeats(s.seats_by_liste);
    if (!seats.some(e => e.liste_id === fantome.id)) continue;
    if (seats.some(e => e.liste_id === reelle.id)) {
      conflits.push(s);                       // contient les DEUX : fusionner fausserait le total
      continue;
    }
    aReecrire.push({ s, seats: seats.map(e => (e.liste_id === fantome.id ? { ...e, liste_id: reelle.id } : e)) });
  }
  console.log(`sondages à réattribuer : ${aReecrire.length}`);
  if (conflits.length) {
    console.log(`⚠️  ${conflits.length} sondage(s) contiennent les DEUX listes — NON traités, à arbitrer à la main :`);
    conflits.forEach(s => console.log(`     ${s.poll_date}  ${s.publisher_media}  (${s.id})`));
  }

  // 2. Résultats officiels et pronostics des joueurs ---------------------------
  const resultats = await queryAll('select id, seats_by_liste from resultats_sieges');
  const resAReecrire = resultats
    .map(r => ({ r, seats: parseSeats(r.seats_by_liste) }))
    .filter(x => x.seats.some(e => e.liste_id === fantome.id))
    .map(x => ({ ...x, seats: x.seats.map(e => (e.liste_id === fantome.id ? { ...e, liste_id: reelle.id } : e)) }));
  const pronos = await queryAll('select count(*) n from pronostics_sieges where liste_id = $1', [fantome.id]);
  const candidats = await queryAll('select id, name_fr from candidats_pm where liste_id = $1', [fantome.id]);
  console.log(`résultats officiels à réattribuer : ${resAReecrire.length}`);
  console.log(`pronostics de joueurs à migrer    : ${pronos[0].n}`);
  console.log(`candidats PM à rattacher          : ${candidats.length}${candidats.length ? ' (' + candidats.map(c => c.name_fr).join(', ') + ')' : ''}`);

  if (!write) {
    console.log('\nRien n\'a été écrit. Relancer avec --write pour appliquer.');
    return;
  }

  // 3. Application, tout ou rien ----------------------------------------------
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { s, seats } of aReecrire) {
      await client.query('update sondages_sieges set seats_by_liste = $1 where id = $2', [JSON.stringify(seats), s.id]);
    }
    for (const { r, seats } of resAReecrire) {
      await client.query('update resultats_sieges set seats_by_liste = $1 where id = $2', [JSON.stringify(seats), r.id]);
    }
    await client.query('update pronostics_sieges set liste_id = $1 where liste_id = $2', [reelle.id, fantome.id]);
    await client.query('update candidats_pm set liste_id = $1 where liste_id = $2', [reelle.id, fantome.id]);
    // Désactivée plutôt que supprimée : réversible, et rien ne casse si une
    // ligne oubliée la référençait encore.
    await client.query('update listes set is_active = 0 where id = $1', [fantome.id]);
    await client.query('COMMIT');
    console.log('\n✅ Fusion appliquée. La liste fantôme est désactivée (is_active = 0), pas supprimée.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Échec — transaction annulée, la base est inchangée.');
    throw e;
  } finally {
    client.release();
  }
}

main()
  .catch(e => { console.error(e.message); process.exitCode = 1; })
  .finally(() => pool.end());

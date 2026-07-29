// Ouvre les marchés « événement » du catalogue (server/functions/parisSondages.js)
// qui ne sont pas déjà ouverts. Idempotent : on compare par question exacte, donc
// relancer le script ne crée pas de doublon.
//
// Usage (depuis server/) : node scripts/open-evenements.js
import 'dotenv/config';
import { initDb, filterEntity } from '../db/index.js';
import { proposerMarchesEvenements, openMarcheEvenement } from '../functions/parisSondages.js';

async function main() {
  await initDb();

  const propositions = proposerMarchesEvenements();
  const existants = await filterEntity('ParisMarche', { type: 'evenement' });
  const dejaOuvertes = new Set(
    existants.filter(m => m.status === 'open' || m.status === 'locked').map(m => m.question),
  );

  let created = 0, skipped = 0;
  for (const p of propositions) {
    if (dejaOuvertes.has(p.question)) { skipped++; continue; }
    const res = await openMarcheEvenement(p);
    console.log(`+ ouvert (manche ${res.manche}, ${res.issues} issues) : ${p.question}`);
    created++;
  }

  console.log(`\nTerminé : ${created} marché(s) ouvert(s), ${skipped} déjà ouvert(s).`);
  process.exit(0);
}

main().catch(e => { console.error('Échec :', e.message); process.exit(1); });

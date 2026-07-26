// Ouvre une manche de paris (marché « quelle liste sera en tête au prochain
// sondage ? ») à partir des derniers sondages, et affiche les cotes d'ouverture.
// Outil admin en attendant l'automatisation sur import de sondage.
// Usage : npm run paris:open  (depuis server/)
import 'dotenv/config';
import { openMancheRang, getOpenMarketsWithCotes } from '../functions/parisSondages.js';
import { pool } from '../db/index.js';

const res = await openMancheRang();
console.log('Manche ouverte :', JSON.stringify(res));

const markets = await getOpenMarketsWithCotes();
for (const m of markets) {
  console.log(`\n${m.question}  (manche ${m.manche}, statut ${m.status})`);
  for (const i of m.issues) console.log('  ' + String(i.label).padEnd(28), 'cote', i.cote);
}
await pool.end();

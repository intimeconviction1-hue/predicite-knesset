/**
 * Intégrité du vocabulaire des blocs.
 *
 * Pourquoi ce test existe. Le 2026-08-04, les LIBELLÉS affichés ont été réécrits
 * (« Coalition sortante » → « Pro-Netanyahou ») en laissant les CLÉS derrière,
 * faute d'une migration. Pendant trois jours le code a donc porté deux
 * vocabulaires : une clé `coalition` étiquetée « Pro-Netanyahou ». Rien ne
 * pouvait le signaler — les deux vivaient dans des fichiers différents, et
 * chacun était cohérent avec lui-même.
 *
 * C'est le seul garde-fou qui aurait attrapé ce décalage : il confronte les clés
 * du CHECK de `listes` (server/db/schema.sql), celles de BLOC_LABEL, celles de
 * BLOC_COLOR, celles de CAMP_DE, et les valeurs réellement présentes dans le
 * seed. Cinq sources qui doivent nommer exactement le même ensemble.
 *
 * Il verrouille aussi l'ARITHMÉTIQUE par clé. `sans_camp` (ex-`non_alignee`)
 * comptait dans le camp anti-Netanyahou, ce que son nom contredisait et
 * qu'aucun commentaire ne justifiait ; l'asymétrie avec `partis_arabes`, exclu
 * des deux camps, n'était expliquée nulle part. Aucune liste ne portait la clé,
 * donc aucun test existant ne pouvait s'en apercevoir — et le 9 septembre, une
 * liste inclassable aurait basculé en silence dans un camp.
 *
 * Le schéma est lu en TEXTE : l'importer exigerait une connexion Postgres, et le
 * .env local pointe la base de production.
 *
 * Ne touche aucune base : lecture de deux fichiers du dépôt + deux modules
 * client purement déclaratifs.
 *
 * Lancer :  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLOC_LABEL, BLOC_COLOR, CAMP_DE, campDe } from '../../client/src/lib/blocs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(__dirname, '..', '..');

const schema = fs.readFileSync(path.join(racine, 'server', 'db', 'schema.sql'), 'utf8');
const seed = JSON.parse(
  fs.readFileSync(path.join(racine, 'docs', 'KNESSET_SEED_LISTES.json'), 'utf8'),
);

/** Les clés autorisées par le CHECK de la colonne `bloc`, lues dans le schéma. */
function clesDuCheck() {
  const m = schema.match(/bloc TEXT NOT NULL CHECK \(bloc IN \(([^)]*)\)\)/);
  assert.ok(m, 'CHECK de la colonne bloc introuvable dans schema.sql — motif à corriger ici.');
  return new Set(m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')));
}

const trier = (iterable) => [...iterable].sort();

test('le CHECK du schéma et BLOC_LABEL nomment le même ensemble de clés', () => {
  // LE test de ce fichier. C'est ce décalage précis — clé d'un côté, libellé de
  // l'autre — qui a vécu trois jours sans que rien ne le signale.
  assert.deepEqual(
    trier(clesDuCheck()), trier(Object.keys(BLOC_LABEL)),
    'Les clés de la base et celles des libellés ont divergé. Migrer les deux ensemble : ' +
    'la colonne dans server/db/schema.sql (CHECK + bloc de migration en fin de fichier) ' +
    'et BLOC_LABEL dans client/src/lib/blocs.js.',
  );
});

test('BLOC_COLOR et CAMP_DE couvrent exactement les mêmes clés', () => {
  const cles = trier(Object.keys(BLOC_LABEL));
  assert.deepEqual(trier(Object.keys(BLOC_COLOR)), cles,
    'Un bloc sans couleur s\'affiche en gris de repli, sans que rien ne le dise.');
  assert.deepEqual(trier(Object.keys(CAMP_DE)), cles,
    'Un bloc absent de CAMP_DE ne compte dans aucun camp — silencieusement.');
});

test('le seed n\'emploie que des clés autorisées', () => {
  const autorisees = clesDuCheck();
  const inconnues = [...new Set(seed.listes.map(l => l.bloc))].filter(b => !autorisees.has(b));
  assert.deepEqual(
    inconnues, [],
    `Le seed emploie des blocs que le CHECK refuse : ${inconnues.join(', ')}. ` +
    'Un import échouerait, et en production c\'est initDb() qui échoue — donc le déploiement.',
  );
});

test('deux blocs seulement comptent dans un camp, et les deux autres dans aucun', () => {
  // L'arithmétique des 61 sièges, verrouillée par clé. Trois joueurs regardent
  // ces sommes (la Home, MaRepartition, le bandeau) et le barème les tranche :
  // toutes passent désormais par campDe(), donc une erreur ici serait partout.
  assert.equal(campDe('pro_netanyahou'), 'pro');
  assert.equal(campDe('anti_netanyahou'), 'anti');
  assert.equal(campDe('partis_arabes'), null,
    'Les partis arabes ne comptent dans aucun camp : c\'est ce qui leur donne la balance.');
  assert.equal(campDe('sans_camp'), null,
    'Une liste « sans camp » versée d\'office à un camp est une contradiction dans les termes. ' +
    'C\'est ce que faisait non_alignee, compté avec l\'opposition jusqu\'au 2026-08-07.');
});

test('un bloc inconnu ne compte dans aucun camp plutôt que de lever', () => {
  // Le barème tourne le soir du scrutin sur des données de production. Une clé
  // inattendue doit produire un scénario prudent, pas une exception au milieu du
  // dépouillement.
  assert.equal(campDe('cle_inventee'), null);
  assert.equal(campDe(undefined), null);
});

test('la migration du schéma couvre toutes les anciennes clés', () => {
  // Sans l'un de ces UPDATE, l'ADD CONSTRAINT final échoue sur les lignes restées
  // à l'ancienne valeur — au démarrage du serveur, qui fait process.exit(1).
  for (const ancienne of ['coalition', 'opposition', 'liste_arabe', 'non_alignee']) {
    assert.match(
      schema, new RegExp(`UPDATE listes SET bloc = '[a-z_]+'\\s+WHERE bloc = '${ancienne}';`),
      `Aucun UPDATE ne migre l'ancienne clé '${ancienne}'.`,
    );
  }
});

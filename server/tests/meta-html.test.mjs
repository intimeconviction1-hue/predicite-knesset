/**
 * Injection des balises de page dans le HTML servi (lib/meta-html.js).
 *
 * Pourquoi ce test existe : cette injection est invisible depuis le site. Elle
 * ne s'adresse qu'aux robots d'aperçu de lien, qui ne laissent aucune trace dans
 * le navigateur — on peut donc la casser et ne s'en apercevoir que le jour où
 * quelqu'un partage une page et voit le mauvais titre. Les pièges sont connus et
 * chacun a son test ici : un <title> doublé au lieu d'être remplacé (le robot
 * choisit, et pas toujours le bon), une apostrophe française qui referme un
 * attribut, une og:image restée relative alors que la spec exige une URL absolue.
 *
 * Le gabarit est écrit dans un dossier temporaire : le test ne dépend pas d'un
 * client/dist déjà construit, et ne touche ni au dépôt ni à aucune base.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { creerInjecteurMeta, pagePour, metaListe } from '../lib/meta-html.js';
import { metaPour, NOMS_DE_PAGES } from '../../client/src/lib/titres.js';
import { STATEMENTS } from '../../client/src/lib/boussole-data.js';

const GABARIT = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="Description d'origine." />
    <title>PrédiCité — Knesset 2026</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'predicite-meta-'));
fs.writeFileSync(path.join(dist, 'index.html'), GABARIT, 'utf8');
const htmlPour = creerInjecteurMeta(dist);

const ORIGINE = 'https://predicite-knesset.onrender.com';
const compte = (html, motif) => (html.match(motif) || []).length;

test('la racine est traitée comme la page d\'accueil', () => {
  assert.equal(pagePour('/'), 'Home');
  assert.equal(pagePour(''), 'Home');
  assert.equal(pagePour('/FormeCoalition'), 'FormeCoalition');
  assert.equal(pagePour('/Liste?slug=likoud'.split('?')[0]), 'Liste');
  assert.equal(pagePour('/login'), 'Login', 'la seule route en minuscules du client');
});

test('le titre est REMPLACÉ, pas ajouté', () => {
  // Un <head> avec deux <title> laisse le robot choisir. Le piège classique de
  // ce genre d'injection.
  const html = htmlPour('/FormeCoalition', ORIGINE);
  assert.equal(compte(html, /<title>/g), 1);
  assert.match(html, /<title>Forme ta coalition — PrédiCité<\/title>/);
  assert.doesNotMatch(html, /<title>PrédiCité — Knesset 2026<\/title>/);
});

test('la description est remplacée, pas doublée', () => {
  const html = htmlPour('/Boussole', ORIGINE);
  assert.equal(compte(html, /<meta name="description"/g), 1);
  assert.doesNotMatch(html, /Description d&#39;origine|Description d'origine/);
  // Le compte est DÉRIVÉ, ici comme dans titres.js. Il y était écrit en toutes
  // lettres (« Dix-neuf affirmations ») et cette assertion le figeait à
  // l'identique : ajouter une affirmation à la Boussole rendait l'aperçu de
  // partage faux, et le test l'aurait défendu au lieu de le signaler.
  assert.match(html, new RegExp(`${STATEMENTS.length} affirmations`));
});

test('og:image est une URL absolue', () => {
  // La spec Open Graph impose une URL absolue ; plusieurs robots refusent
  // simplement d'afficher une image relative.
  const html = htmlPour('/Actu', ORIGINE);
  assert.match(html, /<meta property="og:image" content="https:\/\/predicite-knesset\.onrender\.com\/images\/og-predicite\.jpg"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
});

test('og:url et canonical suivent la page demandée, pas la racine', () => {
  const html = htmlPour('/Historique', ORIGINE);
  assert.match(html, /<meta property="og:url" content="https:\/\/predicite-knesset\.onrender\.com\/Historique"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/predicite-knesset\.onrender\.com\/Historique"/);
});

test('l\'origine vient de la requête, pas d\'un domaine en dur', () => {
  // Le jour où le site prend un vrai nom de domaine, les aperçus doivent suivre
  // sans qu'on ait à repasser dans le code.
  const html = htmlPour('/Actu', 'https://predicite.fr');
  assert.match(html, /content="https:\/\/predicite\.fr\/Actu"/);
  assert.match(html, /content="https:\/\/predicite\.fr\/images\/og-predicite\.jpg"/);
});

test('« /Home » se déclare canonique sous « / »', () => {
  // Home répond à deux URL : « / » parce qu'elle est mainPage, « /Home » parce
  // qu'elle est aussi une entrée de PAGES (voir pages.config.js). Sans cette
  // normalisation, chacune se déclare canonique de son côté et le moteur voit
  // deux pages identiques — sur la page la plus partagée du site.
  for (const chemin of ['/', '/Home']) {
    const html = htmlPour(chemin, ORIGINE);
    assert.match(html, /<link rel="canonical" href="https:\/\/predicite-knesset\.onrender\.com\/"/, `depuis ${chemin}`);
    assert.match(html, /<meta property="og:url" content="https:\/\/predicite-knesset\.onrender\.com\/"/, `depuis ${chemin}`);
  }
});

test('le canonical d\'une fiche de liste garde le slug', () => {
  // Il ne le gardait pas : le serveur ne passe que req.path à l'injecteur, donc
  // les treize fiches annonçaient toutes « /Liste » comme URL canonique. Treize
  // pages se déclarant être la même — un moteur n'en garde qu'une.
  const html = htmlPour('/Liste', ORIGINE, metaListe({ name_fr: 'Likoud', slug: 'likoud', current_knesset_seats: 32 }));
  assert.match(html, /<link rel="canonical" href="https:\/\/predicite-knesset\.onrender\.com\/Liste\?slug=likoud"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/predicite-knesset\.onrender\.com\/Liste\?slug=likoud"/);
  // L'image reste absolue et servie depuis la racine, pas depuis /Liste.
  assert.match(html, /<meta property="og:image" content="https:\/\/predicite-knesset\.onrender\.com\/images\/og-predicite\.jpg"/);
});

test('les apostrophes françaises ne referment pas les attributs', () => {
  // « L'élection en bref » et la plupart des descriptions en contiennent.
  const html = htmlPour('/Learn', ORIGINE);
  assert.doesNotMatch(html, /content="[^"]*'[^"]*"/, 'apostrophe droite non échappée dans un attribut');
  assert.match(html, /<title>L&#39;élection en bref — PrédiCité<\/title>/);
});

test('une page inconnue reçoit la marque et la description par défaut', () => {
  const html = htmlPour('/NimporteQuoi', ORIGINE);
  assert.match(html, /<title>PrédiCité — Knesset 2026<\/title>/);
  assert.doesNotMatch(html, /undefined/);
});

test('toutes les pages du client ont un titre et une description non vides', () => {
  const fautives = NOMS_DE_PAGES
    .map(n => ({ n, m: metaPour(n) }))
    .filter(({ m }) => !m.titre?.trim() || !m.description?.trim() || !m.connue)
    .map(({ n }) => n);
  assert.deepEqual(fautives, [], `Page(s) sans métadonnées : ${fautives.join(', ')}`);
});

test('les descriptions tiennent dans ce qu\'un aperçu affiche', () => {
  // Au-delà d'environ 200 caractères, les robots tronquent — souvent en plein
  // milieu d'un mot. Autant écrire court que se faire couper.
  const trop = NOMS_DE_PAGES
    .map(n => ({ n, d: metaPour(n).description }))
    .filter(({ d }) => d.length > 200)
    .map(({ n, d }) => `${n} (${d.length})`);
  assert.deepEqual(trop, [], `Description(s) trop longue(s) : ${trop.join(', ')}`);
});

test('une fiche de liste annonce le parti, pas « Fiche de liste »', () => {
  const surcharge = metaListe({ name_fr: 'Likoud', leader_name: 'Benyamin Netanyahou', current_knesset_seats: 32 });
  const html = htmlPour('/Liste', ORIGINE, surcharge);
  assert.match(html, /<title>Likoud — Knesset 2026 \| PrédiCité<\/title>/);
  assert.equal(compte(html, /<title>/g), 1);
  assert.match(html, /<meta property="og:title" content="Likoud — Knesset 2026 \| PrédiCité"/);
  assert.match(html, /Benyamin Netanyahou/);
  assert.match(html, /32 sièges sortants/);
});

test('une liste nouvelle le dit au lieu d\'afficher un vide', () => {
  const m = metaListe({ name_fr: 'Yashar', leader_name: 'Gadi Eisenkot', current_knesset_seats: null });
  assert.match(m.description, /Liste nouvelle, sans sièges sortants/);
  assert.doesNotMatch(m.description, /null|undefined|NaN/);
});

test('sans surcharge, la fiche retombe sur l\'aperçu générique', () => {
  // Le chemin de repli quand la base est injoignable : un partage moins précis
  // vaut mieux qu'une page en erreur.
  assert.equal(metaListe(null), null);
  assert.equal(metaListe({}), null);
  const html = htmlPour('/Liste', ORIGINE, null);
  assert.match(html, /<title>Fiche de liste — PrédiCité<\/title>/);
});

test('un nom de parti ne peut pas casser le HTML injecté', () => {
  // La surcharge vient de la BASE, pas d'un fichier du dépôt : elle doit passer
  // par le même échappement que le reste.
  const html = htmlPour('/Liste', ORIGINE, metaListe({
    name_fr: 'Faux" /><script>alert(1)</script>', leader_name: "L'Ami", current_knesset_seats: 1,
  }));
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&quot;|&lt;script&gt;/);
  assert.doesNotMatch(html, /content="[^"]*'[^"]*"/, 'apostrophe non échappée dans un attribut');
});

test('un gabarit sans <title> échoue bruyamment', () => {
  // Le mode de panne à éviter : une injection qui ne fait rien, en silence.
  const vide = fs.mkdtempSync(path.join(os.tmpdir(), 'predicite-meta-vide-'));
  fs.writeFileSync(path.join(vide, 'index.html'), '<html><head></head><body></body></html>', 'utf8');
  assert.throws(() => creerInjecteurMeta(vide), /pas de <title>/);
});

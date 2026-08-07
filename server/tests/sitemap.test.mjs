/**
 * robots.txt et sitemap.xml (lib/sitemap.js).
 *
 * Pourquoi ce test existe : comme l'injection de balises, ces deux fichiers ne
 * s'adressent qu'aux robots. Rien, dans le site, ne change si le sitemap se met
 * à annoncer des URL fausses, à oublier la moitié des pages ou à exposer l'écran
 * d'admin — on ne l'apprendrait qu'en lisant un rapport d'indexation, des
 * semaines plus tard, c'est-à-dire après la diffusion.
 *
 * L'invariant central est le dernier test du fichier : l'URL qu'un sitemap
 * annonce et le <link rel="canonical"> de la page correspondante doivent être
 * le même texte. Quand les deux divergent, le sitemap ne se contente pas d'être
 * inutile — il demande au moteur d'indexer une adresse dont la page elle-même
 * dit qu'elle n'est pas la bonne.
 *
 * Aucune base n'est touchée : les listes sont passées en argument.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { robotsTxt, sitemapXml, cheminsPublics, PAGES_PRIVEES } from '../lib/sitemap.js';
import { creerInjecteurMeta, cheminCanonique, metaListe } from '../lib/meta-html.js';
import { NOMS_DE_PAGES } from '../../client/src/lib/titres.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORIGINE = 'https://predicite-knesset.onrender.com';

const LISTES = [
  { slug: 'likoud', updated_at: '2026-08-05T09:12:31Z' },
  { slug: 'yesh-atid', updated_at: '2026-07-30T22:04:00Z' },
];

test('robots.txt annonce le sitemap en URL absolue', () => {
  // La seule directive de robots.txt qui exige une URL absolue, et celle par
  // laquelle tout le reste est découvert : un chemin relatif ici, et le sitemap
  // n'est jamais lu.
  const txt = robotsTxt(ORIGINE);
  assert.match(txt, /^Sitemap: https:\/\/predicite-knesset\.onrender\.com\/sitemap\.xml$/m);
});

test('robots.txt et le sitemap suivent l\'origine, sans domaine en dur', () => {
  // Le jour du vrai nom de domaine, rien ne doit repasser par le code.
  assert.match(robotsTxt('https://predicite.fr'), /^Sitemap: https:\/\/predicite\.fr\/sitemap\.xml$/m);
  assert.match(sitemapXml('https://predicite.fr'), /<loc>https:\/\/predicite\.fr\/<\/loc>/);
  assert.doesNotMatch(sitemapXml('https://predicite.fr'), /onrender/);
});

test('robots.txt ferme l\'admin, le login et l\'API', () => {
  const txt = robotsTxt(ORIGINE);
  assert.match(txt, /^Disallow: \/AdminResultats$/m, 'une URL d\'admin dans un index public est une invitation');
  assert.match(txt, /^Disallow: \/login$/m);
  assert.match(txt, /^Disallow: \/Login$/m, 'le catch-all sert aussi la graphie capitalisée');
  assert.match(txt, /^Disallow: \/api\/$/m);
});

test('l\'accueil est annoncé sous « / », jamais sous « /Home »', () => {
  // Les deux URL rendent la même page (Home est mainPage ET une entrée de
  // PAGES). Les annoncer toutes les deux, c'est demander à un moteur de répartir
  // le crédit de la page la plus importante du site entre deux adresses.
  const xml = sitemapXml(ORIGINE);
  assert.match(xml, /<loc>https:\/\/predicite-knesset\.onrender\.com\/<\/loc>/);
  assert.doesNotMatch(xml, /\/Home</);
});

test('les pages privées ne sont pas dans le sitemap', () => {
  const xml = sitemapXml(ORIGINE, LISTES);
  for (const p of PAGES_PRIVEES) {
    assert.doesNotMatch(xml, new RegExp(`/${p}<`), `${p} ne doit pas être annoncée`);
  }
});

test('toutes les pages publiques du client sont annoncées', () => {
  // Le mode de panne visé : une page ajoutée à titres.js, jamais entrée dans le
  // sitemap, donc jamais trouvée autrement que par un lien envoyé à la main.
  const xml = sitemapXml(ORIGINE);
  const attendues = NOMS_DE_PAGES.filter(n => !PAGES_PRIVEES.has(n));
  const absentes = attendues.filter(n => !xml.includes(`<loc>${new URL(cheminCanonique(n), ORIGINE).href}</loc>`));
  assert.deepEqual(absentes, [], `Page(s) publiques absentes du sitemap : ${absentes.join(', ')}`);
  assert.equal(cheminsPublics().length, attendues.length);
});

test('les fiches de liste sont annoncées avec leur slug et leur date', () => {
  const xml = sitemapXml(ORIGINE, LISTES);
  assert.match(xml, /<loc>https:\/\/predicite-knesset\.onrender\.com\/Liste\?slug=likoud<\/loc>/);
  assert.match(xml, /<lastmod>2026-08-05<\/lastmod>/);
  assert.match(xml, /<loc>[^<]*slug=yesh-atid<\/loc>/);
});

test('une date absente ou aberrante ne produit pas de lastmod inventé', () => {
  // La tentation est d'écrire la date du jour pour paraître frais. Un sitemap qui
  // prétend que tout a changé aujourd'hui finit ignoré, et la règle du projet est
  // de ne rien fabriquer.
  const xml = sitemapXml(ORIGINE, [
    { slug: 'sans-date' },
    { slug: 'date-vide', updated_at: '' },
    { slug: 'date-cassee', updated_at: 'hier' },
  ]);
  assert.equal((xml.match(/<lastmod>/g) || []).length, 0);
  assert.doesNotMatch(xml, /Invalid Date|NaN|undefined|null/);
  assert.match(xml, /slug=sans-date/, 'la fiche reste annoncée, seule la date manque');
});

test('une base injoignable donne un sitemap réduit, pas un XML cassé', () => {
  // Le repli du serveur quand la lecture des listes échoue.
  const xml = sitemapXml(ORIGINE, []);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<\/urlset>/);
  assert.doesNotMatch(xml, /\/Liste\?/);
});

test('un slug hostile ne casse pas le XML', () => {
  // Les slugs viennent de la BASE, qui contient des lignes que le dépôt ne
  // connaît pas (cf. collecteur-slugs.test.mjs).
  const xml = sitemapXml(ORIGINE, [{ slug: 'faux"><script>alert(1)</script>&x' }]);
  assert.doesNotMatch(xml, /<script>/);
  // encodeURIComponent neutralise déjà tout ce qui n'est pas alphanumérique ;
  // l'échappement XML est la seconde barrière, pas la première.
  assert.match(xml, /slug=faux%22%3E%3Cscript%3E/);
});

test('sitemap et canonical annoncent exactement la même URL', () => {
  // L'invariant qui donne son sens aux deux fichiers. Il a été faux : le serveur
  // ne passait que req.path à l'injecteur, donc les treize fiches de liste
  // déclaraient toutes « /Liste » comme URL canonique pendant que le sitemap les
  // annonçait avec leur slug. Un moteur suivant le sitemap n'aurait gardé qu'une
  // seule fiche sur treize.
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'predicite-sitemap-'));
  fs.writeFileSync(path.join(dist, 'index.html'),
    '<html><head><meta name="description" content="x" /><title>t</title></head><body></body></html>', 'utf8');
  const htmlPour = creerInjecteurMeta(dist);

  const canonicalDe = html => html.match(/<link rel="canonical" href="([^"]+)"/)[1];

  // Une page ordinaire, l'accueil sous ses deux chemins, et une fiche de liste.
  for (const [chemin, surcharge] of [
    ['/Boussole', null],
    ['/', null],
    ['/Home', null],
    ['/Liste', metaListe({ name_fr: 'Likoud', slug: 'likoud', current_knesset_seats: 32 })],
  ]) {
    const url = canonicalDe(htmlPour(chemin, ORIGINE, surcharge));
    assert.ok(
      sitemapXml(ORIGINE, LISTES).includes(`<loc>${url}</loc>`),
      `le canonical de ${chemin} (${url}) n'est pas l'URL annoncée par le sitemap`,
    );
  }
});

test('pages.config.js et titres.js énumèrent les mêmes pages', () => {
  // Ce test garde la 404 du serveur. Depuis qu'une page inconnue de titres.js
  // reçoit un statut 404 (voir index.js), ajouter une page à pages.config.js sans
  // l'ajouter à titres.js produit une panne asymétrique : la page marche
  // parfaitement en développement, où Vite sert le HTML, et renvoie 404 en
  // production, où c'est Express qui répond. Le genre d'écart qu'on ne voit qu'en
  // ligne, sur une page qu'on vient de partager.
  //
  // pages.config.js importe des composants JSX : il ne peut pas être importé
  // depuis node:test. On le lit donc en texte, ce qui suffit pour en extraire
  // les clés — et si son format change au point que la lecture ne trouve plus
  // rien, l'assertion de non-vide ci-dessous le dit tout de suite.
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', 'pages.config.js'), 'utf8');
  const bloc = src.match(/export const PAGES = \{([\s\S]*?)\n\}/);
  assert.ok(bloc, 'bloc « export const PAGES » introuvable dans pages.config.js');
  const declarees = [...bloc[1].matchAll(/^\s*"([A-Za-z]+)":/gm)].map(m => m[1]);
  assert.ok(declarees.length > 15, `lecture de pages.config.js suspecte : ${declarees.length} pages trouvées`);

  // Login est routée à part dans App.jsx (/login), hors de PAGES : elle a bien
  // une fiche dans titres.js sans figurer ici.
  const connues = new Set(NOMS_DE_PAGES);
  const sansFiche = declarees.filter(p => !connues.has(p));
  assert.deepEqual(sansFiche, [], `Page(s) routées mais sans titre — elles renverraient 404 en production : ${sansFiche.join(', ')}`);

  const sansRoute = NOMS_DE_PAGES.filter(p => p !== 'Login' && !declarees.includes(p));
  assert.deepEqual(sansRoute, [], `Page(s) décrites dans titres.js mais non routées : ${sansRoute.join(', ')}`);
});

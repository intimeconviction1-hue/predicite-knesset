/**
 * Contraste des paliers, mesuré SUR LE FOND RÉEL.
 *
 * Pourquoi ce test existe, et pourquoi il mesure ce qu'il mesure.
 *
 * Les couleurs de palier vivaient en dur dans un fichier JS pendant que
 * globals.css documentait nommément deux d'entre elles comme illisibles :
 * l'audit CSS ne pouvait pas les voir. Corrigées une première fois, elles ont
 * été validées contre --p-card — du blanc pur. Or aucun des quatre sites de
 * rendu ne pose ce texte sur du blanc : tous le posent sur `${color}12` ou
 * `${color}18`, c'est-à-dire sur une teinte de sa PROPRE couleur, donc sur un
 * fond plus sombre. Mesuré contre le blanc, Citoyen affichait 4,76:1 et passait ;
 * sur la pastille du classement il n'en fait que 4,24, sous le seuil AA. La
 * mauvaise référence de mesure a donc validé deux fois de suite une couleur
 * illisible — d'abord dans l'audit, puis dans son correctif.
 *
 * Ce test verrouille le fond COMPOSITÉ. Le verrouiller contre --p-card
 * reviendrait à graver l'erreur dans la CI, ce qui est pire que pas de test :
 * un vert qui certifie la mauvaise grandeur.
 *
 * Les quatre combinaisons couvrent les deux alphas employés (0x12 dans
 * ReglesDuJeu et Quiz, 0x18 dans Leaderboard) et les deux surfaces possibles
 * dessous (--p-card dans les cartes de Quiz et du classement, --p-bg pour la
 * <section> de ReglesDuJeu).
 *
 * Aucun des quatre sites n'atteint le seuil « grand texte » de WCAG (18,66 px
 * gras) : ils rendent en 10, 12, 14 et 18 px. C'est donc 4,5:1 qui s'applique
 * partout, jamais 3:1.
 *
 * Ne touche aucune base : import de deux modules client, purement calculatoires.
 *
 * Lancer :  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { TITLES } from '../../client/src/lib/score.js';
import { melange } from '../../client/src/lib/couleurs.js';

const AA_TEXTE_NORMAL = 4.5;

// --p-card et --p-bg de globals.css.
const CARTE = '#FFFFFF';
const PAGE = '#EDF1F9';
// Les alphas littéralement écrits dans les sites de rendu (`${t.color}12`, `18`).
const ALPHAS = [0x12 / 255, 0x18 / 255];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const canal = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(avant, arriere) {
  const a = luminance(hexToRgb(avant));
  const b = luminance(hexToRgb(arriere));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

test('chaque palier est lisible sur la pastille, pas seulement sur la carte', () => {
  for (const t of TITLES) {
    for (const fond of [CARTE, PAGE]) {
      for (const alpha of ALPHAS) {
        const pastille = melange(t.color, alpha, fond);
        const ratio = contraste(t.text, pastille);
        assert.ok(
          ratio >= AA_TEXTE_NORMAL,
          `${t.label} : ${t.text} sur ${pastille} (teinte ${t.color} à ` +
          `${(alpha * 100).toFixed(1)} % sur ${fond}) ne fait que ${ratio.toFixed(2)}:1, ` +
          `il en faut ${AA_TEXTE_NORMAL}. Le texte des paliers n'est JAMAIS posé sur du ` +
          `blanc : mesurer contre --p-card surestime le ratio et laisse passer une ` +
          `couleur illisible.`,
        );
      }
    }
  }
});

test('les cinq paliers restent distinguables entre eux', () => {
  // Sans quoi l'échelle cesse de se lire comme une progression, et « Plus que X
  // pts avant Oracle » s'affiche dans la couleur du palier déjà atteint. C'est
  // ce qu'aurait produit le correctif évident (Oracle → --p-gold-text), qui
  // donnait à Oracle la valeur déjà portée par Politologue.
  const textes = TITLES.map(t => t.text);
  assert.equal(
    new Set(textes).size, TITLES.length,
    `Deux paliers partagent la même couleur de texte : ${textes.join(', ')}.`,
  );
});

test('la couleur décorative de chaque palier est restée intacte', () => {
  // `color` porte l'identité (l'or de marque d'Oracle sur la pastille) et n'a
  // pas à obéir au seuil de TEXTE : c'est `text` qui a été introduite pour ça.
  // Les figer ici empêche qu'un futur correctif de contraste ne les confonde à
  // nouveau et n'éteigne l'or.
  const attendus = {
    Citoyen: '#64748B', Analyste: '#2B5CE6', Connaisseur: '#0EA5E9',
    Politologue: '#7A5F1A', Oracle: '#D4AF37',
  };
  for (const t of TITLES) {
    assert.equal(t.color, attendus[t.label], `La couleur décorative de ${t.label} a changé.`);
  }
});

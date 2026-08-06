// Les frictions entre listes — la donnée qui fait vivre « Forme ta coalition ».
//
// Sorties de pages/FormeCoalition.jsx le 2026-08-06, pour la même raison que
// boussole-data.js la veille : ces 37 paires sont de la donnée éditoriale, pas
// de l'écran, et surtout un test d'intégrité ne peut pas les vérifier tant
// qu'elles vivent dans un fichier JSX. Le précédent est connu — le slug fantôme
// « yachad-bennett » a survécu des mois dans la Boussole parce que la seule
// garde était un console.error que personne n'ouvrait.
// Le pendant en CI : server/tests/frictions-integrite.test.mjs.

// ⚠️ FRICTIONS À VALIDER (David) — en Israël TOUT est possible : on ne bloque
// jamais, on mesure la PLAUSIBILITÉ. Chaque paire présente retire des points
// (poids = force de la friction). Chaque paire s'adosse à une position déjà
// sourcée du site (boussole-data.js, seed) — le détail, l'échelle des poids et
// les paires ÉCARTÉES faute de source vivent dans docs/FRICTIONS_SOURCES.md.
// Une paire absente est un trou à dessein, pas un oubli.
const FRICTIONS = [
  // ── Le « mur » anti-Netanyahou (la friction la plus structurante) ──────────
  ['likoud', 'les-democrates', 42, 'La gauche exclut Netanyahou'],
  ['likoud', 'yashar-gadi-eisenkot', 35, 'Eisenkot fait campagne contre Netanyahou'],
  // ⚠️ POIDS À REVOIR (David) : cette paire absorbe une seconde friction qui
  // existait en double. Une ligne ['likoud','yachad-bennett',16,'Bennett :
  // histoire compliquée avec Bibi'] visait le slug fantôme hérité de Base44,
  // désactivé le 2026-08-04 — elle ne s'appliquait donc JAMAIS. Les deux
  // fondateurs d'Ensemble n'ont pas le même passif avec Netanyahou : Lapid
  // pesait 32, Bennett 16. On garde 32, mais c'est le chiffre de Lapid pour une
  // liste que Bennett dirige : à trancher.
  ['likoud', 'ensemble-bennett-lapid', 32, 'Bloc du changement : Bennett et Lapid hors coalition Netanyahou'],
  ['likoud', 'yisrael-beytenou', 30, 'Lieberman, ennemi juré de Netanyahou'],
  ['likoud', 'unite-nationale', 22, 'Passif anti-Netanyahou'],
  // (Pas de paire likoud/les-reservistes : Hendel assume de gouverner avec
  // Netanyahou si le programme convient — trou à dessein.)

  // ── Piliers du gouvernement sortant ⊥ bloc du changement (2026-08-05) ──────
  // Sans cet axe, Otzma + Les Démocrates + Ensemble sortait « très plausible »
  // à 100 %. Adossé à l'affirmation structurante de la Boussole (Netanyahou PM :
  // Otzma et le Sionisme religieux pour, les cinq listes d'en face contre) et à
  // la commission d'enquête du 7 octobre. Unité nationale ferme l'axe avec les
  // poids les plus bas : Gantz assume de gouverner avec Netanyahou.
  ['otzma-yehudit', 'les-democrates', 40, 'Kahanisme vs gauche sioniste : exclusion réciproque'],
  ['otzma-yehudit', 'yashar-gadi-eisenkot', 30, 'Ben Gvir, pilier du gouvernement que combat Eisenkot'],
  ['otzma-yehudit', 'ensemble-bennett-lapid', 30, 'Ben Gvir vs bloc du changement'],
  ['otzma-yehudit', 'yisrael-beytenou', 26, 'Lieberman vs Ben Gvir : deux droites irréconciliables'],
  ['otzma-yehudit', 'unite-nationale', 20, 'Gantz vs Ben Gvir — mais Gantz n\'exclut pas la droite'],
  ['sionisme-religieux', 'les-democrates', 34, 'Smotrich vs gauche laïque'],
  ['sionisme-religieux', 'yashar-gadi-eisenkot', 26, 'Smotrich, pilier du gouvernement que combat Eisenkot'],
  ['sionisme-religieux', 'ensemble-bennett-lapid', 26, 'Smotrich vs bloc du changement'],
  ['sionisme-religieux', 'yisrael-beytenou', 22, 'Lieberman vs Smotrich'],
  ['sionisme-religieux', 'unite-nationale', 16, 'Gantz vs Smotrich — la friction la plus faible de l\'axe'],

  // ── Haredim ⊥ centre laïque ────────────────────────────────────────────────
  // Lieberman existait déjà ; les autres refus (2026-08-05) sont sourcés dans
  // boussole-data : exemption militaire, influence religieuse, budget des
  // yeshivot. Pas de paire avec Unité nationale : Gantz est absent des
  // affirmations religieuses sourcées et a siégé avec les haredim en 2020.
  ['yisrael-beytenou', 'shas', 30, 'Lieberman contre les partis ultra-orthodoxes'],
  ['yisrael-beytenou', 'judaisme-unifie-de-la-torah', 30, 'Lieberman contre les Haredim'],
  ['shas', 'les-reservistes-hendel-tropper', 32, 'Hendel refuse de siéger avec les partis haredim'],
  ['judaisme-unifie-de-la-torah', 'les-reservistes-hendel-tropper', 32, 'Hendel refuse de siéger avec les partis haredim'],
  ['shas', 'yashar-gadi-eisenkot', 28, 'Eisenkot rejette « l\'étreinte politique haredi »'],
  ['judaisme-unifie-de-la-torah', 'yashar-gadi-eisenkot', 28, 'La conscription universelle d\'Eisenkot exclut les Haredim'],
  ['shas', 'les-democrates', 26, 'Golan vs subventions haredim : tronc commun, conscription'],
  ['judaisme-unifie-de-la-torah', 'les-democrates', 26, 'Golan vs subventions haredim : tronc commun, conscription'],
  ['shas', 'ensemble-bennett-lapid', 24, 'Shas accuse Bennett de « brader l\'identité juive »'],
  ['judaisme-unifie-de-la-torah', 'ensemble-bennett-lapid', 24, 'Bennett et Lapid ont attaqué le budget des yeshivot'],

  // ── Extrême droite ⊥ partis arabes ─────────────────────────────────────────
  ['otzma-yehudit', 'hadash-ta-al-liste-commune', 45, 'Kahanisme vs partis arabes'],
  ['otzma-yehudit', 'ra-am', 42, 'Ben Gvir vs partis arabes'],
  ['sionisme-religieux', 'hadash-ta-al-liste-commune', 38, 'Sionisme religieux vs partis arabes'],
  ['sionisme-religieux', 'ra-am', 34, 'Sionisme religieux vs Ra\'am'],

  // ── Partis arabes dans les autres coalitions ───────────────────────────────
  // Asymétrie Hadash/Ra'am partout : Ra'am a siégé au gouvernement en 2021
  // (improbable, pas inédit), Hadash jamais. Ensemble, Lieberman et Les
  // Réservistes refusent l'appui des partis arabes (Boussole, 2026-08-05) —
  // mais Bennett, Lapid et Lieberman ont gouverné avec Ra'am, d'où les poids
  // réduits. Les Démocrates : zéro friction à dessein, Golan appelle à
  // s'associer à Ra'am.
  ['likoud', 'hadash-ta-al-liste-commune', 40, 'Hadash-Ta\'al hors gouvernement Likoud'],
  ['likoud', 'ra-am', 24, 'Ra\'am au gouvernement Likoud : improbable, pas inédit'],
  ['ensemble-bennett-lapid', 'hadash-ta-al-liste-commune', 26, 'Ensemble refuse l\'appui des partis arabes'],
  ['ensemble-bennett-lapid', 'ra-am', 14, 'Refus déclaré — mais Ra\'am gouvernait avec eux en 2021'],
  ['yisrael-beytenou', 'hadash-ta-al-liste-commune', 26, 'Lieberman refuse l\'appui des partis arabes'],
  ['yisrael-beytenou', 'ra-am', 14, 'Refus déclaré — mais Ra\'am gouvernait avec Lieberman en 2021'],
  ['les-reservistes-hendel-tropper', 'hadash-ta-al-liste-commune', 26, 'Doctrine sécuritaire des Réservistes vs partis arabes'],
  ['les-reservistes-hendel-tropper', 'ra-am', 20, 'Doctrine sécuritaire des Réservistes vs Ra\'am'],
];

// Garde de cohérence, même principe que celle de Boussole.jsx : une friction dont
// un slug ne correspond à aucune liste active ne se déclenche JAMAIS, sans que
// rien ne le signale. C'est ce qui a laissé vivre ici la paire 'yachad-bennett'
// après la désactivation de la liste fantôme. En dev on le dit ; en prod on
// ignore sans casser la page.
// ⚠️ Valider contre les listes ACTIVES, jamais contre le plateau du jeu : le
// plateau ne retient que les listes créditées de sièges par le DERNIER sondage,
// et une liste sous le seuil ce jour-là n'est pas un slug fantôme — sa friction
// doit survivre pour le sondage suivant. C'est ce qui a fait crier la garde sur
// 'unite-nationale' (Gantz, bien active au seed et à la Boussole) en août 2026.
function verifierFrictions(slugsActifs) {
  if (!import.meta.env?.DEV || Object.keys(slugsActifs).length === 0) return;
  const orphelins = [...new Set(FRICTIONS.flatMap(([a, b]) => [a, b]))].filter(s => !slugsActifs[s]);
  if (orphelins.length) console.error('[FormeCoalition] frictions sans liste correspondante :', orphelins.join(', '));
}

function plausibility(slugs) {
  const set = new Set(slugs);
  let penalty = 0; const active = [];
  for (const [a, b, w, reason] of FRICTIONS) if (set.has(a) && set.has(b)) { penalty += w; active.push({ a, b, w, reason }); }
  return { score: Math.max(3, 100 - penalty), active: active.sort((x, y) => y.w - x.w) };
}
export { FRICTIONS, verifierFrictions, plausibility };

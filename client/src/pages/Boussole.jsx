import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ThumbsUp, ThumbsDown, Minus, RotateCcw, ArrowRight } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import { texteLisible } from '@/lib/couleurs';
import TrialWall from '@/components/knesset/TrialWall';

// ⚠️ CONTENU VALIDÉ AVEC DAVID (2026-08) — positions des partis par affirmation.
// pour = plutôt d'accord, contre = plutôt contre, le reste = neutre.
//
// Les slugs ci-dessous DOIVENT correspondre à une Liste réelle (slug dérivé de
// name_fr par server/scripts/seed-listes.js). « yachad-bennett » a été retiré le
// 2026-08-03 : ce nom désignait une liste fantôme héritée de Base44, absente de
// tout seed, qui coexistait en base avec « ensemble-bennett-lapid » et pouvait
// donc sortir en tête de la boussole alors qu'elle n'existe plus depuis avril.
// La garde de cohérence en bas de computeMatches empêche que ça se reproduise.
//
// SOURCES — chaque position ajoutée ou retirée le 2026-08-03 est justifiée dans
// docs/BOUSSOLE_SOURCES.md, avec sa source et son degré de certitude. Les
// positions antérieures à cette date n'ont pas encore été sourcées : c'est une
// dette connue, listée en fin de ce même document.
//
// TROUS VOLONTAIRES — ces partis ne couvrent pas toutes les affirmations, et ce ne
// sont PAS des oublis. Sur les négociations de paix (5) et les implantations (6),
// ni Shas, ni le JUT, ni Les Réservistes n'ont de ligne propre et stable : l'IDI
// relève même que Shas « soutient la conclusion d'accords de paix avec les États
// arabes ». Leur prêter une position pour homogénéiser les dénominateurs
// reviendrait à fabriquer de la donnée — le pourcentage affiché avec son
// dénominateur dit déjà l'inégalité de couverture.
const STATEMENTS = [
  // ⚠️ AFFIRMATION STRUCTURANTE — elle pèse plus lourd que les autres dans le
  // résultat, une erreur ici se propage partout. Les Réservistes en ont été
  // RETIRÉS le 2026-08-03 : ils y figuraient « contre », alors que Yoaz Hendel
  // refuse explicitement de faire de Netanyahou l'axe du scrutin (« s'il y a
  // demain un gouvernement de 70-80 sièges sionistes et que Netanyahou en fait
  // partie, bien sûr que je le rejoindrais », JPost 23/07/2026). Absence de
  // position = position documentée, pas oubli.
  { text: 'Benyamin Netanyahou doit rester Premier ministre.',
    pour: ['likoud', 'shas', 'judaisme-unifie-de-la-torah', 'otzma-yehudit', 'sionisme-religieux'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  // Shas et le JUT ont été « au premier rang de la poussée réformatrice » : la
  // clause de dérogation est vue par les deux comme l'outil qui mettrait la loi
  // d'exemption militaire à l'abri du contrôle judiciaire (ToI). Nuance à garder
  // en tête : tous deux ont ensuite servi de force modératrice dans la coalition.
  { text: 'La réforme judiciaire (affaiblir la Cour suprême) doit aboutir.',
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'shas', 'judaisme-unifie-de-la-torah'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'les-reservistes-hendel-tropper', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: "L'État doit s'appuyer davantage sur la loi religieuse juive (halakha).",
    pour: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux', 'otzma-yehudit'],
    contre: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: 'Les étudiants des yeshivot (Haredim) doivent rester exemptés de service militaire.',
    pour: ['shas', 'judaisme-unifie-de-la-torah'],
    contre: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'les-reservistes-hendel-tropper', 'ensemble-bennett-lapid', 'unite-nationale'] },
  // ⚠️ TROU ASSUMÉ : « Ensemble » n'a pas de position ici. Le slug fantôme
  // yachad-bennett était son SEUL porteur sur cette affirmation (ailleurs il
  // faisait doublon avec ensemble-bennett-lapid). Le trancher demande un
  // arbitrage éditorial — Bennett refuse un État palestinien, Lapid soutient
  // la négociation — donc on laisse le trou visible plutôt que d'inventer.
  { text: 'Il faut relancer des négociations de paix avec les Palestiniens.',
    pour: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'],
    contre: ['likoud', 'otzma-yehudit', 'sionisme-religieux'] },
  { text: 'Il faut étendre les implantations, voire annexer une partie de la Cisjordanie.',
    pour: ['sionisme-religieux', 'otzma-yehudit', 'likoud'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'unite-nationale'] },
  // Les Réservistes : position la MIEUX documentée du lot. Yoaz Hendel veut un
  // « gouvernement d'unité sioniste sans partis arabes ni haredim » et déclare :
  // « Quiconque choisit de ne pas servir choisit d'être un citoyen de seconde
  // zone. Il ne recevra rien de l'État. Il ne pourra ni voter ni être élu à la
  // Knesset. » (ToI, 20/11/2025). C'est un refus explicite des deux volets de
  // l'affirmation — l'égalité pleine ET la place au gouvernement.
  { text: 'Les citoyens arabes doivent avoir pleine égalité et une place au gouvernement.',
    pour: ['hadash-ta-al-liste-commune', 'ra-am', 'les-democrates'],
    contre: ['otzma-yehudit', 'sionisme-religieux', 'les-reservistes-hendel-tropper'] },
  // Les Réservistes : « une doctrine sécuritaire plus agressive » est un pilier
  // déclaré du programme (ToI, 20/11/2025). Shas : l'IDI relève qu'« en série de
  // votes à la Knesset sur les grands dossiers diplomatiques, Shas a adopté une
  // position faucon ». Le JUT a été RETIRÉ d'ici le 2026-08-03 : l'IDI le décrit
  // comme « centriste », faisant primer « les considérations religieuses sur les
  // considérations sécuritaires ou diplomatiques » — il a même voté le
  // désengagement de Gaza. La position que je lui prêtais n'était pas sourçable.
  { text: 'Face au Hamas et à l\'Iran, la fermeté sécuritaire prime sur tout.',
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'yisrael-beytenou', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'unite-nationale', 'les-reservistes-hendel-tropper', 'shas'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'] },
  // Les Réservistes : l'inégalité devant la conscription est le grief fondateur
  // du mouvement, d'où sa position ici comme sur l'exemption des yeshivot.
  { text: 'Les partis ultra-orthodoxes ont trop d\'influence sur la vie quotidienne.',
    pour: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'les-reservistes-hendel-tropper'],
    contre: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux'] },
  // Shas et le JUT sont des partis SOCIAUX autant que religieux : ils défendent
  // les allocations et le soutien public aux familles nombreuses, donc contre le
  // désengagement de l'État. C'est leur ligne la mieux établie hors du religieux.
  // ── Ajoutées le 2026-08-03 pour élargir les dénominateurs ────────────────────
  // Avec 10 affirmations et une couverture partielle, beaucoup de parties se
  // jouaient sur 4 ou 5 comparaisons — d'où les 100 % en pagaille. Ces trois-là
  // ont été choisies parce qu'elles CLIVENT et qu'elles se sourcent : la première
  // repose même sur un appel nominal. Détail dans docs/BOUSSOLE_SOURCES.md.

  // Loi votée le 30/03/2026 par 62 voix contre 48, à l'initiative d'Otzma
  // Yehudit. Le JUT est absent des deux camps À DESSEIN : ses deux composantes
  // se sont séparées, Degel HaTorah votant pour et Agoudat Israël s'abstenant.
  { text: 'Les terroristes condamnés doivent encourir la peine de mort.',
    pour: ['otzma-yehudit', 'likoud', 'shas', 'sionisme-religieux', 'yisrael-beytenou'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am', 'unite-nationale'] },

  // La coalition a confirmé qu'aucune commission d'enquête d'État ne serait
  // créée avant le scrutin ; l'opposition refuse de participer au format
  // alternatif proposé. C'est un pilier déclaré du programme des Réservistes,
  // de celui de Bennett, et une position explicite d'Eisenkot.
  { text: "Il faut une commission d'enquête d'État indépendante sur le 7 octobre.",
    pour: ['yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'les-reservistes-hendel-tropper', 'les-democrates', 'unite-nationale', 'yisrael-beytenou'],
    contre: ['likoud', 'shas', 'judaisme-unifie-de-la-torah', 'otzma-yehudit', 'sionisme-religieux'] },

  // Bennett, 25/04/2026 : « les villes doivent pouvoir choisir si elles veulent
  // des transports publics le shabbat » et « chacun en Israël devrait pouvoir
  // concrétiser son amour dans ce pays sans partir à l'étranger ». Shas lui a
  // répondu qu'il était « prêt à brader l'identité juive du pays ».
  { text: 'Il faut le mariage civil et des transports publics le shabbat.',
    pour: ['ensemble-bennett-lapid', 'yisrael-beytenou', 'les-democrates'],
    contre: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux', 'otzma-yehudit'] },

  // Affirmation DISCRIMINANTE, ajoutée le 2026-08-03. Diagnostic : sur les 13
  // affirmations précédentes, Yashar, Yisrael Beytenou, Ensemble, Unité nationale
  // et Les Réservistes ne s'opposaient sur AUCUNE — la boussole désignait un bloc,
  // pas un parti. Celle-ci les sépare, parce que c'est la vraie ligne de fracture
  // du centre en 2026.
  //
  // À ne pas confondre avec l'affirmation 7 : celle-là porte sur les DROITS des
  // citoyens arabes, celle-ci sur l'arithmétique parlementaire — s'appuyer ou non
  // sur les voix de leurs partis pour gouverner.
  //
  // Yashar en est absent À DESSEIN : Eisenkot n'exclut pas ces partis mais pose
  // trois conditions, et a convoqué les chefs de l'opposition en avril 2026 sans
  // les y inviter. Cette ambiguïté est sa position ; la trancher serait la trahir.
  { text: "Un gouvernement peut légitimement s'appuyer sur les voix des partis arabes.",
    pour: ['hadash-ta-al-liste-commune', 'ra-am', 'les-democrates'],
    contre: ['ensemble-bennett-lapid', 'yisrael-beytenou', 'les-reservistes-hendel-tropper', 'otzma-yehudit', 'sionisme-religieux'] },

  { text: "L'État doit moins intervenir dans l'économie (plus de libéralisme).",
    pour: ['likoud', 'yisrael-beytenou', 'les-reservistes-hendel-tropper', 'ensemble-bennett-lapid'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am', 'shas', 'judaisme-unifie-de-la-torah'] },
];

// Nombre d'affirmations où chaque liste se positionne. C'est le DÉNOMINATEUR
// du pourcentage d'affinité : un parti qui ne se prononce que sur 4 des 10
// affirmations peut afficher 100 % là où un parti couvert sur 10 plafonne.
// On l'expose à l'écran plutôt que de laisser croire à dix critères de poids égal.
const COUVERTURE = (() => {
  const n = {};
  STATEMENTS.forEach(s => [...s.pour, ...s.contre].forEach(x => { n[x] = (n[x] || 0) + 1; }));
  return n;
})();

// SOLIDITÉ D'UN SCORE — borne inférieure de l'intervalle de Wilson à 95 %.
//
// Le taux d'accord brut traite « 100 % sur 4 affirmations » et « 100 % sur 10 »
// comme équivalents, alors que le second est bien mieux établi. Constaté en
// production le 2026-08-03 : quatre partis à 100 %, quatre barres pleines, et un
// seul proclamé le plus proche — une hiérarchie qui n'existait pas.
//
// Plutôt que de bricoler un seuil arbitraire (« au moins 5 affirmations »), on
// classe sur ce que les données GARANTISSENT : la borne basse de l'intervalle de
// confiance du taux d'accord. Un petit échantillon est pénalisé automatiquement,
// proportionnellement à son incertitude.
//
//   100 % sur 10 → 0,72     100 % sur 5 → 0,57     100 % sur 4 → 0,51
//    90 % sur 10 → 0,60      86 % sur 7 → 0,49
//
// Un 90 % bien établi passe donc devant un 100 % mince — c'est le jugement voulu.
// Le pourcentage AFFICHÉ reste le taux brut, qui est ce que l'utilisateur a
// réellement répondu ; seul le classement utilise cette borne.
function solidite(accords, total) {
  if (!total) return 0;
  const z = 1.96;                       // 95 %
  const p = accords / total;
  const centre = p + (z * z) / (2 * total);
  const marge = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return (centre - marge) / (1 + (z * z) / total);
}

// Les cinq degrés de réponse. La VALEUR sert à la fois de direction (son signe)
// et de poids (sa valeur absolue) : « tout à fait » compte double de « plutôt ».
// Changer cette table suffit à changer la granularité du questionnaire.
const DEGRES = [
  { v: -1,   label: 'Pas du tout', aria: "Pas du tout d'accord", Icone: ThumbsDown, fort: true,
    bg: 'var(--p-red-dim)',   bord: 'rgba(200,16,46,0.35)', teinte: 'var(--p-red)',      texte: 'var(--p-red)' },
  { v: -0.5, label: 'Plutôt non', aria: "Plutôt pas d'accord", Icone: ThumbsDown, fort: false,
    bg: 'var(--p-red-dim)',   bord: 'rgba(200,16,46,0.18)', teinte: 'var(--p-red)',      texte: 'var(--p-red)' },
  { v: 0,    label: 'Neutre',      aria: 'Sans opinion',        Icone: Minus,      fort: false,
    bg: 'var(--p-night-2)',   bord: 'var(--p-border)',      teinte: 'var(--p-text-40)',  texte: 'var(--p-text-60)' },
  { v: 0.5,  label: 'Plutôt oui', aria: "Plutôt d'accord",     Icone: ThumbsUp,   fort: false,
    bg: 'var(--p-green-dim)', bord: 'rgba(26,140,85,0.18)', teinte: 'var(--p-green)',    texte: '#16794A' },
  { v: 1,    label: 'Tout à fait', aria: "Tout à fait d'accord", Icone: ThumbsUp,  fort: true,
    bg: 'var(--p-green-dim)', bord: 'rgba(26,140,85,0.35)', teinte: 'var(--p-green)',    texte: '#16794A' },
];

function computeMatches(answers, bySlug) {
  const slugs = new Set();
  STATEMENTS.forEach(s => { s.pour.forEach(x => slugs.add(x)); s.contre.forEach(x => slugs.add(x)); });

  // Garde de cohérence : un slug qui ne correspond à aucune liste active fausse
  // silencieusement le résultat (c'est ce qui s'est passé avec yachad-bennett).
  // En dev on le signale bruyamment ; en prod on l'ignore sans casser la page.
  if (import.meta.env?.DEV && Object.keys(bySlug).length > 0) {
    const orphelins = [...slugs].filter(s => !bySlug[s]);
    if (orphelins.length) console.error('[Boussole] slugs sans liste correspondante :', orphelins.join(', '));
  }

  const out = [];
  for (const slug of slugs) {
    const liste = bySlug[slug];
    if (!liste) continue;
    // Réponse graduée : l'intensité sert de POIDS, pas de direction. Une
    // affirmation à laquelle on répond « tout à fait d'accord » (1) pèse deux
    // fois plus qu'un « plutôt d'accord » (0,5). C'est le seul endroit où
    // l'intensité intervient — le sens de l'accord reste binaire, parce que les
    // positions des partis, elles, le sont : on sait qu'un parti a voté pour une
    // loi, on ne sait pas « à quel point ». Y mettre une intensité côté parti
    // reviendrait à inventer de la donnée invérifiable.
    let agree = 0, disagree = 0, compares = 0;
    STATEMENTS.forEach((st, i) => {
      const ua = answers[i];
      if (!ua) return;                                   // neutre ou sans réponse
      const stance = st.pour.includes(slug) ? 1 : st.contre.includes(slug) ? -1 : 0;
      if (!stance) return;
      const poids = Math.abs(ua);
      if (Math.sign(ua) === stance) agree += poids; else disagree += poids;
      compares++;
    });
    // Somme des poids : c'est la taille d'échantillon EFFECTIVE, celle qui nourrit
    // la borne de Wilson. `compares` reste le compte entier d'affirmations, plus
    // parlant à l'écran que « 4,5 affirmations ».
    const rel = compares;
    const poidsTotal = agree + disagree;
    out.push({
      slug, liste, rel,
      pct: poidsTotal ? Math.round((agree / poidsTotal) * 100) : 0,   // affiché
      sol: solidite(agree, poidsTotal),                               // classant
      couverture: COUVERTURE[slug] || 0,
    });
  }
  // Classement par solidité, pas par taux brut : voir solidite() plus haut. Le
  // nombre d'affirmations comparées est déjà intégré à la borne, inutile de le
  // remettre comme critère. Restent deux départages, pour les cas où deux partis
  // ont exactement les mêmes données : la couverture totale (on préfère celui
  // dont on documente le plus de positions), puis le nom, pour que le résultat
  // soit stable d'une partie à l'autre plutôt que livré à l'ordre d'un Set.
  return out.sort((a, b) =>
    b.sol - a.sol ||
    b.couverture - a.couverture ||
    (a.liste.name_fr || '').localeCompare(b.liste.name_fr || '', 'fr'));
}

export default function Boussole() {
  const gate = useGuestGate();
  const { data: listes = [] } = useQuery({ queryKey: ['bouss-listes'], queryFn: () => base44.entities.Liste.filter({ is_active: true }) });
  const bySlug = useMemo(() => Object.fromEntries(listes.map(l => [l.slug, l])), [listes]);

  const [phase, setPhase] = useState('intro');   // intro | play | done
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);

  const start = () => {
    if (gate.blocked) { setPhase('intro'); return; }
    setAnswers([]); setIdx(0); setPhase('play');
  };
  const answer = (v) => {
    const na = [...answers]; na[idx] = v; setAnswers(na);
    if (idx + 1 >= STATEMENTS.length) { gate.record(); setPhase('done'); }
    else setIdx(idx + 1);
  };

  const matches = useMemo(() => (phase === 'done' ? computeMatches(answers, bySlug) : []), [phase, answers, bySlug]);
  const top = matches[0];
  // Partis dont les données sont STRICTEMENT indiscernables de celles du premier
  // (même taux, même nombre d'affirmations comparées → même solidité). Les
  // départager par la couverture ou le nom suffit à obtenir un ordre stable, mais
  // pas à justifier qu'on en couronne un seul : ici on le dit.
  const exAequo = useMemo(
    () => (top ? matches.filter(m => Math.abs(m.sol - top.sol) < 1e-9) : []),
    [matches, top],
  );
  const gold = 'var(--p-gold-text)';
  const st = STATEMENTS[idx];

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="p-tricolor"><div /><div /><div /></div>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
          <Compass className="w-3.5 h-3.5" style={{ color: gold }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: gold }}>Jeu · mode découverte</span>
        </div>
        <h1 className="p-display text-3xl md:text-4xl mb-2">Quel parti te ressemble ?</h1>
        <p className="p-body text-sm max-w-md mx-auto">{STATEMENTS.length} affirmations, tes réponses, et on te dit de quel parti tu es le plus proche. Aucun compte requis pour essayer.</p>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (gate.blocked ? (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TrialWall plays={gate.plays} /></motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-card p-6 text-center">
              <p className="p-body text-sm mb-5">Réponds franchement à chaque affirmation, de <b>pas du tout</b> à <b>tout à fait d'accord</b>. Plus tu es catégorique, plus l'affirmation pèse dans ton résultat. Pas de bonne réponse — juste toi 🧭</p>
              <button onClick={start} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-[15px] transition-transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(180deg,#ffe08a,#D4AF37)', color: '#14203D', boxShadow: '0 14px 34px -12px rgba(212,175,55,0.6)' }}>
                Commencer <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {phase === 'play' && st && (
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden mr-3" style={{ background: 'var(--p-text-10)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(idx / STATEMENTS.length) * 100}%`, background: 'var(--p-gold)' }} />
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--p-text-40)' }}>{idx + 1}/{STATEMENTS.length}</span>
              </div>
              <div className="p-card p-6 text-center min-h-[150px] flex items-center justify-center mb-4">
                <p className="p-title text-lg leading-snug">{st.text}</p>
              </div>
              {/* Cinq degrés plutôt que trois : l'intensité de l'accord porte de
                  l'information que le binaire jetait. Cinq et non onze, parce
                  qu'un curseur 0-10 sur 13 questions ajoute un geste de réglage
                  PUIS une validation à chaque écran — ici tout se joue en un tap.
                  Le calcul accepte n'importe quelle granularité : passer au
                  curseur ne demanderait que de changer les valeurs ci-dessous. */}
              <div className="grid grid-cols-5 gap-1.5">
                {DEGRES.map(d => (
                  <button key={d.v} onClick={() => answer(d.v)} aria-label={d.aria}
                    className="flex flex-col items-center justify-start gap-1 py-3 px-1 rounded-xl transition-transform hover:-translate-y-0.5"
                    style={{ background: d.bg, border: `0.5px solid ${d.bord}` }}>
                    <d.Icone className={d.fort ? 'w-5 h-5' : 'w-4 h-4'} style={{ color: d.teinte }} />
                    <span className="text-[10px] font-bold leading-tight text-center" style={{ color: d.texte }}>{d.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'done' && top && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="p-card p-6 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--p-text-40)' }}>
                {exAequo.length > 1 ? `${exAequo.length} partis à égalité` : 'Ton parti le plus proche'}
              </p>
              {/* Données strictement identiques → on nomme tout le monde. Couronner
                  un seul parti reviendrait à faire dire aux réponses plus qu'elles
                  ne disent. */}
              <div className="flex flex-col items-center gap-1 mb-1">
                {exAequo.map(m => (
                  <div key={m.slug} className="inline-flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: m.liste.color || '#6B7280' }} />
                    <span className={`p-display ${exAequo.length > 1 ? 'text-xl' : 'text-2xl'}`}
                      style={{ color: m.liste.color ? texteLisible(m.liste.color) : 'var(--p-text)' }}>{m.liste.name_fr}</span>
                  </div>
                ))}
              </div>
              <p className="p-body text-sm mb-5">
                <b className="font-mono" style={{ color: 'var(--p-text)' }}>{top.pct}%</b> d'affinité,
                {' '}sur <b>{top.rel}</b> affirmation{top.rel > 1 ? 's' : ''} où {exAequo.length > 1 ? 'ces partis se positionnent' : 'ce parti se positionne'}
              </p>

              {/* Nom sur sa propre ligne, barre en dessous : « Judaïsme unifié de
                  la Torah » ou « Hadash-Ta'al / Liste commune » ne tiennent pas
                  dans une colonne fixe. L'ancienne mise en page les tronquait,
                  d'autant plus depuis que la colonne du pourcentage porte aussi
                  le dénominateur. */}
              <div className="space-y-3 mb-5 text-left">
                {matches.slice(0, 4).map((m, i) => (
                  <div key={m.slug}>
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-xs leading-snug" style={{ color: 'var(--p-text-60)', fontWeight: i === 0 ? 700 : 400 }}>{m.liste.name_fr}</span>
                      <span className="text-xs font-mono font-bold shrink-0" style={{ color: 'var(--p-text)' }}>
                        {m.pct}%
                        <span className="font-normal" style={{ color: 'var(--p-text-40)' }}>/{m.rel}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.liste.color || '#6B7280' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-blue-border)' }}>
                <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>Crée ton compte pour <b>garder ton profil</b>, jouer et grimper au classement.</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={() => base44.auth.redirectToLogin()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-bold text-sm text-white" style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}>
                  Créer mon compte <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={start} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm" style={{ background: 'transparent', border: '0.5px solid var(--p-border-hover)', color: 'var(--p-text-60)' }}>
                  <RotateCcw className="w-4 h-4" /> Refaire
                </button>
              </div>
              <p className="text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--p-text-25)' }}>
                Résultat indicatif, basé sur {STATEMENTS.length} affirmations. Ni un conseil de vote, ni une position de PrédiCité.<br />
                Le pourcentage est calculé sur les seules affirmations où le parti se positionne : c'est le
                nombre affiché après la barre. Une réponse catégorique y pèse deux fois plus qu'une réponse
                nuancée. Le classement, lui, tient compte du nombre d'affirmations comparées — 100 % sur trois
                réponses est moins solide que 90 % sur dix. La première affirmation porte sur Benyamin
                Netanyahou plutôt que sur une politique : c'est l'axe qui structure la vie politique
                israélienne, et elle pèse donc plus lourd que les autres dans ton résultat.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

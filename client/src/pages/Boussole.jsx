import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ThumbsUp, ThumbsDown, Minus, RotateCcw, ArrowRight } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import { STATEMENTS, COUVERTURE } from '@/lib/boussole-data';
import { texteLisible } from '@/lib/couleurs';
import TrialWall from '@/components/knesset/TrialWall';
import GainMiniJeu from '@/components/knesset/GainMiniJeu';
import MiniJeuShell from '@/components/knesset/MiniJeuShell';

// SOLIDITÉ D'UN SCORE — borne inférieure de l'intervalle de Wilson à 95 %.
//
// Le taux d'accord brut traite « 100 % sur 4 affirmations » et « 100 % sur 10 »
// comme équivalents, alors que le second est bien mieux établi. Constaté en
// production le 2026-08-04 : quatre partis à 100 %, quatre barres pleines, et un
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
    bg: 'var(--p-bg-2)',   bord: 'var(--p-border)',      teinte: 'var(--p-text-40)',  texte: 'var(--p-text-60)' },
  { v: 0.5,  label: 'Plutôt oui', aria: "Plutôt d'accord",     Icone: ThumbsUp,   fort: false,
    bg: 'var(--p-green-dim)', bord: 'rgba(26,140,85,0.18)', teinte: 'var(--p-green)',    texte: 'var(--p-green-text)' },
  { v: 1,    label: 'Tout à fait', aria: "Tout à fait d'accord", Icone: ThumbsUp,  fort: true,
    bg: 'var(--p-green-dim)', bord: 'rgba(26,140,85,0.35)', teinte: 'var(--p-green)',    texte: 'var(--p-green-text)' },
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
    if (idx + 1 >= STATEMENTS.length) { gate.terminerPartie('boussole'); setPhase('done'); }
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
  const st = STATEMENTS[idx];

  return (
    <MiniJeuShell
      icon={Compass}
      titre="Quel parti te ressemble ?"
      chapo={<>{STATEMENTS.length} affirmations, tes réponses, et on te dit de quel parti tu es le plus proche. Aucun compte requis pour essayer.</>}
    >
        <AnimatePresence mode="wait">
          {phase === 'intro' && (gate.blocked ? (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TrialWall plays={gate.plays} /></motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-card p-6 text-center">
              <p className="p-body text-sm mb-5">Réponds franchement à chaque affirmation, de <b>pas du tout</b> à <b>tout à fait d'accord</b>. Plus tu es catégorique, plus l'affirmation pèse dans ton résultat. Pas de bonne réponse — juste toi 🧭</p>
              <button onClick={start} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-[15px] transition-transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(180deg,#ffe08a,#D4AF37)', color: '#14203D', boxShadow: '0 14px 34px -12px var(--p-gold-glow)' }}>
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
                  qu'un curseur 0-10 sur chaque affirmation ajoute un geste de réglage
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

              <GainMiniJeu gain={gate.gain} isGuest={gate.isGuest} />
              <div className="flex items-center justify-center gap-3 flex-wrap">
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
    </MiniJeuShell>
  );
}

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
// TROUS VOLONTAIRES — ces partis ne couvrent pas les 10 affirmations, et ce ne
// sont PAS des oublis. Sur les négociations de paix (5) et les implantations (6),
// ni Shas, ni le JUT, ni Les Réservistes n'ont de ligne propre et stable : l'IDI
// relève même que Shas « soutient la conclusion d'accords de paix avec les États
// arabes ». Leur prêter une position pour homogénéiser les dénominateurs
// reviendrait à fabriquer de la donnée — le pourcentage affiché avec son
// dénominateur dit déjà l'inégalité de couverture.
const STATEMENTS = [
  { text: 'Benyamin Netanyahou doit rester Premier ministre.',
    pour: ['likoud', 'shas', 'judaisme-unifie-de-la-torah', 'otzma-yehudit', 'sionisme-religieux'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'les-reservistes-hendel-tropper', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
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
    let agree = 0, disagree = 0;
    STATEMENTS.forEach((st, i) => {
      const ua = answers[i];
      if (!ua) return;
      const stance = st.pour.includes(slug) ? 1 : st.contre.includes(slug) ? -1 : 0;
      if (!stance) return;
      if (Math.sign(ua) === Math.sign(stance)) agree++; else disagree++;
    });
    const rel = agree + disagree;
    out.push({ slug, liste, pct: rel ? Math.round((agree / rel) * 100) : 0, rel, couverture: COUVERTURE[slug] || 0 });
  }
  // Le tri décide du parti proclamé « le plus proche ». Constaté en production le
  // 2026-08-03 : Yashar et Ensemble sortaient tous deux à 86 % sur 7 affirmations,
  // et le titre revenait à l'un des deux selon l'ordre d'itération du Set — un
  // détail d'implémentation. On départage donc explicitement :
  //   1. le pourcentage d'accord ;
  //   2. le nombre d'affirmations réellement comparées (plus il est élevé, plus
  //      le pourcentage est solide) ;
  //   3. la couverture totale du parti — à égalité, on préfère celui dont on
  //      documente le plus de positions plutôt qu'un parti mal renseigné ;
  //   4. le nom, pour que le résultat soit stable d'une partie à l'autre.
  return out.sort((a, b) =>
    b.pct - a.pct ||
    b.rel - a.rel ||
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
        <p className="p-body text-sm max-w-md mx-auto">10 affirmations, tes réponses, et on te dit de quel parti tu es le plus proche. Aucun compte requis pour essayer.</p>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (gate.blocked ? (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TrialWall plays={gate.plays} /></motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-card p-6 text-center">
              <p className="p-body text-sm mb-5">Réponds franchement à chaque affirmation : <b>d'accord</b>, <b>neutre</b> ou <b>pas d'accord</b>. Pas de bonne réponse — juste toi 🧭</p>
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
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => answer(-1)} className="flex flex-col items-center gap-1 py-3.5 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-red-dim)', border: '0.5px solid rgba(200,16,46,0.3)' }}>
                  <ThumbsDown className="w-5 h-5" style={{ color: 'var(--p-red)' }} /><span className="text-[11px] font-bold" style={{ color: 'var(--p-red)' }}>Pas d'accord</span>
                </button>
                <button onClick={() => answer(0)} className="flex flex-col items-center gap-1 py-3.5 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-border)' }}>
                  <Minus className="w-5 h-5" style={{ color: 'var(--p-text-40)' }} /><span className="text-[11px] font-bold" style={{ color: 'var(--p-text-60)' }}>Neutre</span>
                </button>
                <button onClick={() => answer(1)} className="flex flex-col items-center gap-1 py-3.5 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-green-dim)', border: '0.5px solid rgba(26,140,85,0.3)' }}>
                  <ThumbsUp className="w-5 h-5" style={{ color: 'var(--p-green)' }} /><span className="text-[11px] font-bold" style={{ color: '#16794A' }}>D'accord</span>
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'done' && top && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="p-card p-6 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--p-text-40)' }}>Ton parti le plus proche</p>
              <div className="inline-flex items-center gap-2.5 mb-1">
                <span className="w-4 h-4 rounded-full" style={{ background: top.liste.color || '#6B7280' }} />
                <span className="p-display text-2xl" style={{ color: top.liste.color ? texteLisible(top.liste.color) : 'var(--p-text)' }}>{top.liste.name_fr}</span>
              </div>
              <p className="p-body text-sm mb-5">
                <b className="font-mono" style={{ color: 'var(--p-text)' }}>{top.pct}%</b> d'affinité,
                {' '}sur <b>{top.rel}</b> affirmation{top.rel > 1 ? 's' : ''} où ce parti se positionne
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
                Résultat indicatif, basé sur 10 affirmations. Ni un conseil de vote, ni une position de PrédiCité.<br />
                Le pourcentage est calculé sur les seules affirmations où le parti se positionne : c'est le
                nombre affiché après la barre. Un parti peu couvert peut donc afficher un score élevé sur peu
                d'affirmations. La première affirmation porte sur Benyamin Netanyahou plutôt que sur une
                politique : c'est l'axe qui structure la vie politique israélienne, et elle pèse donc plus
                lourd que les autres dans ton résultat.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

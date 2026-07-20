import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart3, Target, Trophy, Vote, Crown, ChevronRight, Info } from 'lucide-react';

const SCORING_RULES = [
  { label: 'Siège exact pour une liste', pts: '+150', desc: 'Le nombre de sièges pronostiqué correspond exactement au résultat.' },
  { label: 'Écart de ±1 siège', pts: '+100', desc: 'Votre pronostic est à un siège près du résultat final.' },
  { label: 'Écart de ±3 sièges', pts: '+50', desc: 'Votre pronostic est à trois sièges près du résultat final.' },
  { label: 'Seuil électoral correctement anticipé', pts: '+30', desc: 'Vous aviez bien anticipé qu\'une liste franchirait — ou non — les 3,25 %.' },
  { label: 'Bloc majoritaire anticipé', pts: '+50', desc: 'Vous aviez identifié le bon camp (coalition ≥ 61 sièges, ou opposition).' },
  { label: 'Premier ministre correct', pts: '+100', desc: 'La personnalité pronostiquée est effectivement investie Premier ministre.' },
  { label: 'Défi quotidien', pts: '+20', desc: 'Répondre au quiz ou au signal du jour.' },
  { label: 'Série de 7 jours consécutifs', pts: '+75', desc: 'Bonus de régularité pour 7 jours d\'activité d\'affilée.' },
];

const BADGES = [
  { icon: '🎯', label: 'Analyste Précis', desc: 'Première liste pronostiquée à ±1 siège près.' },
  { icon: '🏛️', label: 'Politologue', desc: 'Quiz système électoral et formation de coalition réussis.' },
  { icon: '👑', label: 'Faiseur de rois', desc: 'Pronostic Premier ministre correct.' },
  { icon: '📊', label: 'Data Citoyen', desc: '5 quiz complétés avec succès.' },
  { icon: '🔥', label: 'Série enflammée', desc: '7 jours d\'activité consécutifs.' },
];

const STEPS = [
  {
    id: 'comprendre',
    icon: BarChart3,
    num: '01',
    label: 'COMPRENDRE',
    color: '#4A7FD4',
    title: 'Comprendre le scrutin avant de pronostiquer',
    description: 'La Knesset se vote à la proportionnelle nationale, liste contre liste, avec un seuil de 3,25 %. Deux modules expliquent le mécanisme (répartition des sièges, accords d\'excédents) et la formation du gouvernement qui suit — c\'est la base pour un pronostic sensé, pas une case à cocher avant de jouer.',
    tips: [
      'Consultez la fiche de chaque liste : sièges sortants, tendance des derniers sondages.',
      'Repérez les listes proches du seuil de 3,25 % — c\'est souvent là que ça se joue.',
      'Suivez les signaux de campagne (fusions, accords d\'excédents, désistements).',
    ],
    link: createPageUrl('Listes'),
    linkLabel: 'Explorer les listes →',
  },
  {
    id: 'anticiper',
    icon: Target,
    num: '02',
    label: 'ANTICIPER',
    color: '#D4AF37',
    title: 'Soumettre vos pronostics',
    description: 'Pour chaque liste, pronostiquez un nombre de sièges. Ajoutez, si vous le souhaitez, un pronostic Premier ministre, qui se résout séparément — plus tard, à l\'investiture. Vous pouvez modifier vos pronostics jusqu\'à la deadline.',
    tips: [
      'Le pronostic sièges se clôture juste avant le scrutin du 27 octobre.',
      'Le pronostic Premier ministre se verrouille à la même date, mais se résout à l\'investiture.',
      'Modifier son pronostic est autorisé tant que la deadline n\'est pas passée.',
    ],
    link: createPageUrl('PremierMinistre'),
    linkLabel: 'Pronostic Premier ministre →',
  },
  {
    id: 'comparer',
    icon: Trophy,
    num: '03',
    label: 'COMPARER',
    color: '#22C55E',
    title: 'Monter au classement',
    description: 'Après les résultats officiels, vos pronostics sont automatiquement scorés. Votre indice citoyen combine précision sièges (35 %), précision Premier ministre (15 %), apprentissage (30 %) et régularité (20 %).',
    tips: [
      'L\'indice citoyen est calculé sur 100 pts.',
      'Le volet Premier ministre pèse moins : c\'est plus proche du pari que de l\'analyse électorale.',
      'Comparez-vous à la communauté francophone dans le classement général.',
    ],
    link: createPageUrl('Leaderboard'),
    linkLabel: 'Voir le classement →',
  },
];

export default function ReglesDuJeu() {
  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>

      <div className="relative border-b border-white/8" style={{ background: 'rgba(7,18,42,0.98)' }}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-center gap-2 text-white/30 text-sm mb-6">
            <Link to={createPageUrl('Home')} className="hover:text-white/60 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/60">Règles du jeu</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#D4AF37' }}>
            Comment ça marche
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Space Grotesk','Outfit',sans-serif" }}>
            Règles du jeu — Knesset 2026
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-2xl">
            PrédiCité est un jeu prédictif civique. Comprenez le scrutin proportionnel israélien, pronostiquez sièges et Premier ministre, comparez votre précision avec celle de la communauté francophone.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        <section id="boucle">
          <h2 className="text-xl font-bold text-white mb-8" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            La boucle de jeu en 3 étapes
          </h2>
          <div className="space-y-4">
            {STEPS.map(({ id, icon: Icon, num, label, color, title, description, tips, link, linkLabel }) => (
              <div key={id} id={id} className="rounded-2xl border border-white/10 p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: color + '18', border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ fontFamily: "'JetBrains Mono',monospace", color }}>{num}</span>
                      <span className="text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full border" style={{ color, borderColor: color + '40', background: color + '12' }}>{label}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed mb-4">{description}</p>
                    <ul className="space-y-1.5 mb-4">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/45">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                    <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80" style={{ color }}>
                      {linkLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="points">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Calcul des points</h2>
          <p className="text-white/40 text-sm mb-6">Les points sièges sont attribués après les résultats officiels ; le point Premier ministre après l'investiture.</p>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto] text-xs font-bold uppercase tracking-wider text-white/30 px-5 py-3 border-b border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span>Action</span><span>Points</span>
            </div>
            {SCORING_RULES.map((rule, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-center px-5 py-4 border-b border-white/6 last:border-0" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <div>
                  <p className="text-sm font-semibold text-white/80">{rule.label}</p>
                  <p className="text-xs text-white/35 mt-0.5">{rule.desc}</p>
                </div>
                <span className="text-sm font-black ml-8 tabular-nums" style={{ fontFamily: "'JetBrains Mono',monospace", color: '#D4AF37' }}>{rule.pts}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 mt-4 text-xs text-white/35">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>Le pronostic Premier ministre est binaire (bon ou pas) et se résout séparément, potentiellement des semaines après le scrutin — voir la page dédiée pour le détail du mécanisme.</p>
          </div>
        </section>

        <section id="indice-citoyen">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>L'indice citoyen</h2>
          <p className="text-white/40 text-sm mb-6">Score sur 100 pts qui mesure votre engagement civique global.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { pct: '35%', label: 'Précision sièges', desc: 'Justesse de vos pronostics sièges par liste.', color: '#4A7FD4' },
              { pct: '15%', label: 'Précision PM', desc: 'Pronostic Premier ministre, une fois résolu.', color: '#A78BFA' },
              { pct: '30%', label: 'Apprentissage', desc: 'Quiz système électoral, coalition, signaux lus.', color: '#D4AF37' },
              { pct: '20%', label: 'Régularité', desc: 'Streak quotidien et participation continue.', color: '#22C55E' },
            ].map(({ pct, label, desc, color }) => (
              <div key={label} className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "'JetBrains Mono',monospace", color }}>{pct}</div>
                <div className="font-bold text-white text-sm mb-1">{label}</div>
                <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="badges">
          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Badges & récompenses</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {BADGES.map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-white/8 p-4" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-bold text-white/85">{label}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-8 text-center" style={{ background: 'rgba(30,58,138,0.15)' }}>
          <p className="text-white/50 text-sm mb-2">Prêt à commencer ?</p>
          <h3 className="text-2xl font-black text-white mb-6" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Anticipez. Apprenez. Gagnez.
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl('Listes')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85" style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}>
              <Vote className="w-4 h-4" /> Explorer les listes
            </Link>
            <Link to={createPageUrl('PremierMinistre')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors">
              <Crown className="w-4 h-4" /> Pronostic Premier ministre
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

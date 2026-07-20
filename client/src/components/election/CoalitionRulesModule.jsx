import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, ChevronDown, Clock, Users2, RefreshCcw, Info } from 'lucide-react';

const RULES = [
  {
    id: 'pas_direct',
    icon: Info,
    title: 'Pas d\'élection directe du Premier ministre',
    color: '#4A7FD4',
    accent: 'border-[#4A7FD4]/30 bg-[#4A7FD4]/8',
    content: [
      { type: 'text', value: "Contrairement à un président français ou américain, le Premier ministre israélien n'est jamais élu directement par les citoyens. Un système d'élection directe du chef du gouvernement a existé de 1996 à 2001, avant d'être abandonné : depuis, c'est toujours la composition de la Knesset qui détermine qui gouverne." },
      { type: 'highlight', label: 'Conséquence pour le pronostic', value: "Le soir du 27 octobre 2026, on connaît les sièges. On ne connaît pas encore le Premier ministre — ça se joue dans les semaines qui suivent." },
    ]
  },
  {
    id: 'nomination',
    icon: Users2,
    title: 'Le mandat de formation',
    color: '#D4AF37',
    accent: 'border-[#D4AF37]/30 bg-[#D4AF37]/8',
    content: [
      { type: 'text', value: "Après le scrutin, le Président de l'État consulte les chefs de listes élues, puis charge le dirigeant qui lui semble avoir les meilleures chances de réunir une majorité (61 sièges sur 120) de former un gouvernement. Ce n'est pas automatiquement le chef de la liste arrivée en tête." },
      { type: 'text', value: "Le mandataire dispose d'un délai légal (28 jours, prolongeable de 14 jours supplémentaires) pour négocier une coalition. S'il échoue, le Président peut confier le mandat à quelqu'un d'autre, ou la Knesset peut désigner elle-même un candidat avec le soutien d'au moins 61 députés." },
    ]
  },
  {
    id: 'coalition',
    icon: Users2,
    title: 'Pourquoi il faut toujours une coalition',
    color: '#22C55E',
    accent: 'border-emerald-400/30 bg-emerald-400/8',
    content: [
      { type: 'text', value: "Aucune liste n'a jamais obtenu seule 61 sièges. Le futur Premier ministre doit donc assembler plusieurs listes autour d'un accord de coalition — répartition des ministères, lignes politiques communes, parfois rotation du poste de Premier ministre entre deux chefs de liste." },
      { type: 'highlight', label: 'À surveiller dans les sondages', value: "Les instituts publient régulièrement une lecture par bloc (« bloc de la coalition sortante » contre « bloc de l'opposition ») en plus des sièges par liste — c'est souvent plus parlant que le détail liste par liste pour anticiper qui gouvernera." },
    ]
  },
  {
    id: 'delai',
    icon: Clock,
    title: 'Un processus qui peut traîner',
    color: '#A78BFA',
    accent: 'border-[#A78BFA]/30 bg-[#A78BFA]/8',
    content: [
      { type: 'text', value: "Entre le scrutin et l'investiture d'un gouvernement, plusieurs semaines — parfois plusieurs mois — peuvent s'écouler. Le pronostic « Premier ministre » de PrédiCité ne se dénoue donc pas le soir de l'élection, mais seulement au moment de l'investiture effective." },
    ]
  },
  {
    id: 'transition',
    icon: RefreshCcw,
    title: 'Le gouvernement démissionnaire ne compte pas',
    color: '#F47090',
    accent: 'border-[#F47090]/30 bg-[#F47090]/8',
    content: [
      { type: 'text', value: "Entre la dissolution de la Knesset et l'investiture d'un nouveau gouvernement, l'exécutif sortant expédie les affaires courantes. Un Premier ministre « de transition » ne compte pas pour la résolution du pronostic : seule l'investiture formelle, avec vote de confiance de la Knesset, valide un résultat." },
    ]
  },
];

function RuleBlock({ item }) {
  if (item.type === 'highlight') {
    return (
      <div className="rounded-lg p-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#D4AF37' }}>{item.label}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.7)' }}>{item.value}</p>
      </div>
    );
  }
  return <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>{item.value}</p>;
}

export default function CoalitionRulesModule({ compact = false }) {
  const [openId, setOpenId] = useState(compact ? null : 'pas_direct');

  return (
    <div className={compact ? '' : 'rounded-2xl border overflow-hidden'} style={compact ? {} : { borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(10,18,38,0.6)' }}>
      {!compact && (
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#7C3AED,#D4AF37)' }}>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Comment se forme un gouvernement</h2>
            <p className="text-white/60 text-xs">Ce qui se joue après le soir du scrutin, avant de pronostiquer le Premier ministre</p>
          </div>
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'divide-y'} style={compact ? {} : { borderColor: 'rgba(255,255,255,0.06)' }}>
        {RULES.map((rule) => {
          const Icon = rule.icon;
          const isOpen = openId === rule.id;

          return (
            <div key={rule.id} className={compact ? `rounded-xl border ${rule.accent} overflow-hidden` : ''}>
              <button
                onClick={() => setOpenId(isOpen ? null : rule.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.accent}`}>
                  <Icon className="w-4 h-4" style={{ color: rule.color }} />
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: rule.color }}>{rule.title}</span>
                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'rgba(245,240,232,0.3)' }} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {rule.content.map((item, i) => (
                        <RuleBlock key={i} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

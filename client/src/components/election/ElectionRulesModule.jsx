import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ChevronDown, Users, Vote, Shuffle, BarChart3, AlertCircle } from 'lucide-react';

const RULES = [
  {
    id: 'scrutin',
    icon: Vote,
    title: 'Mode de scrutin municipal',
    color: 'text-[#034EA2]',
    accent: 'border-[#034EA2]/30 bg-[#034EA2]/5',
    content: [
      { type: 'text', value: 'Dans les communes de plus de 1 000 habitants, les élections se déroulent au scrutin proportionnel de liste à deux tours avec prime majoritaire.' },
      { type: 'text', value: 'Les électeurs votent pour une liste entière. Il n\'est pas possible de voter pour des candidats individuels issus de listes différentes (panachage interdit).' },
      { type: 'highlight', label: 'Parité obligatoire', value: 'Les listes doivent alterner strictement hommes et femmes (loi du 6 juin 2000).' },
    ]
  },
  {
    id: 'premier_tour',
    icon: Scale,
    title: 'Premier tour',
    color: 'text-emerald-700',
    accent: 'border-emerald-300/40 bg-emerald-50/50',
    content: [
      { type: 'text', value: 'Une liste est élue dès le premier tour si elle obtient la majorité absolue des suffrages exprimés ET au moins 25 % des électeurs inscrits.' },
      { type: 'stat', label: 'Seuil de victoire au 1er tour', value: '> 50% des suffrages + ≥ 25% des inscrits' },
      { type: 'text', value: 'Si cette condition est remplie, la liste obtient la moitié des sièges du conseil municipal, l\'autre moitié étant répartie proportionnellement entre toutes les listes ayant obtenu ≥ 5 %.' },
    ]
  },
  {
    id: 'qualification',
    icon: AlertCircle,
    title: 'Qualification au second tour',
    color: 'text-amber-700',
    accent: 'border-amber-300/40 bg-amber-50/50',
    content: [
      { type: 'text', value: 'Si aucune liste n\'est élue au premier tour, un second tour est organisé.' },
      { type: 'stat', label: 'Seuil de maintien au 2nd tour', value: '≥ 10 % des suffrages exprimés' },
      { type: 'text', value: 'Seules les listes ayant obtenu au moins 10 % des suffrages exprimés au premier tour peuvent se maintenir au second tour.' },
      { type: 'stat', label: 'Seuil de fusion', value: '≥ 5 % des suffrages exprimés' },
      { type: 'text', value: 'Une liste ayant obtenu entre 5 % et 10 % peut fusionner avec une liste qualifiée pour le second tour.' },
    ]
  },
  {
    id: 'fusion',
    icon: Shuffle,
    title: 'Fusion des listes',
    color: 'text-purple-700',
    accent: 'border-purple-300/40 bg-purple-50/50',
    content: [
      { type: 'text', value: 'Entre les deux tours, les listes qualifiées peuvent s\'allier en fusionnant leurs candidats sur une liste commune.' },
      { type: 'text', value: 'La liste fusionnée doit respecter la règle de parité et maintenir au moins une tête de liste qualifiée pour le second tour.' },
      { type: 'highlight', label: 'Enjeu stratégique', value: 'Les fusions sont un moment clé de la campagne. Elles peuvent renverser complètement le rapport de force entre les deux tours.' },
    ]
  },
  {
    id: 'sieges',
    icon: BarChart3,
    title: 'Attribution des sièges',
    color: 'text-slate-700',
    accent: 'border-slate-300/40 bg-slate-50/50',
    content: [
      { type: 'text', value: 'La liste arrivée en tête obtient automatiquement la moitié des sièges (prime majoritaire), garantissant une majorité stable.' },
      { type: 'text', value: 'L\'autre moitié des sièges est répartie à la représentation proportionnelle (méthode du plus fort reste) entre toutes les listes ayant obtenu ≥ 5 %, y compris la liste gagnante.' },
      { type: 'stat', label: 'Exemple Paris', value: '163 conseillers de Paris + conseillers d\'arrondissements (système PLM)' },
    ]
  },
  {
    id: 'population',
    icon: Users,
    title: 'Communes de moins de 1 000 habitants',
    color: 'text-teal-700',
    accent: 'border-teal-300/40 bg-teal-50/50',
    content: [
      { type: 'text', value: 'Pour les communes de moins de 1 000 habitants, le scrutin est uninominal majoritaire à deux tours.' },
      { type: 'text', value: 'Les électeurs peuvent voter pour des candidats de listes différentes (panachage autorisé). Les candidats sont élus individuellement.' },
      { type: 'highlight', label: 'Important', value: 'Ce mode de scrutin ne s\'applique pas aux villes suivies par PRÉDICITÉ, toutes > 1 000 habitants.' },
    ]
  },
];

function RuleBlock({ item }) {
  if (item.type === 'stat') {
    return (
      <div className="flex items-start gap-3 bg-white border border-slate-100 rounded-lg p-3">
        <div className="flex-1">
          <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">{item.label}</p>
          <p className="text-sm font-bold text-slate-800">{item.value}</p>
        </div>
      </div>
    );
  }
  if (item.type === 'highlight') {
    return (
      <div className="bg-[#034EA2]/6 border border-[#034EA2]/20 rounded-lg p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#034EA2] mb-1">{item.label}</p>
        <p className="text-xs text-slate-700 leading-relaxed">{item.value}</p>
      </div>
    );
  }
  return <p className="text-sm text-slate-600 leading-relaxed">{item.value}</p>;
}

export default function ElectionRulesModule({ compact = false }) {
  const [openId, setOpenId] = useState(compact ? null : 'scrutin');

  return (
    <div className={compact ? '' : 'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden'}>
      {!compact && (
        <div className="bg-[#034EA2] px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Règles du scrutin municipal</h2>
            <p className="text-white/60 text-xs">Comprendre les mécanismes électoraux pour mieux pronostiquer</p>
          </div>
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'divide-y divide-slate-100'}>
        {RULES.map((rule) => {
          const Icon = rule.icon;
          const isOpen = openId === rule.id;

          return (
            <div key={rule.id} className={compact ? `rounded-xl border ${rule.accent} overflow-hidden` : ''}>
              <button
                onClick={() => setOpenId(isOpen ? null : rule.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                  compact
                    ? `${isOpen ? 'bg-white/60' : 'hover:bg-white/40'}`
                    : `${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.accent}`}>
                  <Icon className={`w-4 h-4 ${rule.color}`} />
                </div>
                <span className={`flex-1 text-sm font-semibold ${rule.color}`}>{rule.title}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
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
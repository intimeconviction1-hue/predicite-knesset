import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Scale, ChevronRight, Vote, Shuffle, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    icon: Vote,
    label: '1er tour',
    desc: 'Majorité absolue + 25% des inscrits → élu directement',
  },
  {
    icon: Scale,
    label: '2e tour',
    desc: 'Listes qualifiées à ≥ 10%, fusions possibles dès 5%',
  },
  {
    icon: Shuffle,
    label: 'Fusions',
    desc: 'Alliances entre les tours, moment clé de la campagne',
  },
  {
    icon: BarChart3,
    label: 'Sièges',
    desc: '½ à la liste gagnante, ½ proportionnel à toutes listes ≥ 5%',
  },
];

export default function ScrutinExplainerMini() {
  return (
    <div className="bg-white border-y border-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#034EA2]/10 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-[#034EA2]" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Comprendre le scrutin municipal</h2>
          </div>
          <Link
            to={createPageUrl('Learn')}
            className="hidden sm:flex items-center gap-1 text-xs text-[#034EA2] hover:text-[#034EA2]/70 font-medium transition-colors"
          >
            Tout comprendre <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-[#034EA2]/8 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#034EA2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">{step.label}</p>
                  <p className="text-[11px] text-slate-500 leading-snug">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-400">
            Comprendre ces règles vous donne un avantage stratégique pour vos prédictions.
          </p>
          <div className="flex gap-2">
            <Link
              to={createPageUrl('Learn')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#034EA2] text-white text-xs font-semibold hover:bg-[#034EA2]/90 transition-colors"
            >
              Voir comment fonctionnent les municipales
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              to={createPageUrl('ScrutinPLM')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Système PLM
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
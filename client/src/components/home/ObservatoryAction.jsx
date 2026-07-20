import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Target, BookOpen, BarChart3, ChevronRight } from 'lucide-react';

export default function ObservatoryAction() {
  const actions = [
    {
      icon: Target,
      label: 'Prédire Lyon',
      desc: 'Tension élevée — faites votre pronostic',
      href: '/city/lyon',
      accent: 'text-[#C8102E]',
      bg: 'bg-[#C8102E]/10'
    },
    {
      icon: BarChart3,
      label: 'Sondage Marseille',
      desc: 'Nouveau sondage Harris — comparez',
      href: createPageUrl('Surveys'),
      accent: 'text-[#034EA2]',
      bg: 'bg-[#034EA2]/10'
    },
    {
      icon: BookOpen,
      label: 'Quiz Lille',
      desc: 'Triangulaire — testez vos connaissances',
      href: createPageUrl('Quiz'),
      accent: 'text-[#E1B530]',
      bg: 'bg-[#E1B530]/10'
    }
  ];

  return (
    <div className="space-y-2 mt-4">
      <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Actions suggérées</span>
      {actions.map((action, idx) => (
        <Link key={idx} to={action.href}>
          <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2.5 transition-colors group cursor-pointer">
            <div className={`${action.bg} rounded-lg p-1.5`}>
              <action.icon className={`w-4 h-4 ${action.accent}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90">{action.label}</p>
              <p className="text-xs text-white/50 truncate">{action.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
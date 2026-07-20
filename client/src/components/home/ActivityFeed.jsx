import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronRight, Target, BookOpen, BarChart3, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const activities = [
  { action: "15 citoyens ont pronostiqué à Lyon", time: "2 min", icon: Target, color: "text-[#C8102E]", link: "Cities" },
  { action: "8 quiz complétés sur Marseille", time: "5 min", icon: BookOpen, color: "text-[#034EA2]", link: "Quiz" },
  { action: "Nouveau sondage IFOP disponible", time: "12 min", icon: BarChart3, color: "text-emerald-600", link: "Surveys" },
  { action: "Défi relevé par 23 citoyens", time: "18 min", icon: Zap, color: "text-[#E1B530]", link: "Quiz" },
  { action: "3 nouveaux inscrits aujourd'hui", time: "25 min", icon: Users, color: "text-slate-500", link: "Leaderboard" },
];

export default function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8102E]" />
          </span>
          <span className="font-semibold text-slate-800 text-sm">Activité en temps réel</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {activities.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} to={createPageUrl(item.link)} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
              <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
              <span className="text-sm text-slate-700 flex-1 group-hover:text-slate-900 transition-colors">{item.action}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">il y a {item.time}</span>
            </Link>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <Link to={createPageUrl('Leaderboard')} className="flex items-center justify-center gap-1 text-xs text-[#034EA2] font-medium hover:underline">
          Classement complet <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
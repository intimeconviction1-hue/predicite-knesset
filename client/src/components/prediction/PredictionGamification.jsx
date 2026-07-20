import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Trophy, Flame, Zap, TrendingUp, 
  CheckCircle, XCircle, Clock, Star, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Points détaillés par action de prédiction
const POINTS_TABLE = [
  { label: 'Prédire le vainqueur', icon: Trophy, points: 50, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { label: 'Prédire le score (±5%)', icon: Target, points: 30, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { label: 'Prédire la participation (±5%)', icon: TrendingUp, points: 20, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { label: 'Bonus justification', icon: Star, points: 10, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { label: 'Série 3 prédictions correctes', icon: Flame, points: 25, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { label: 'Engagement quotidien', icon: Zap, points: 5, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
];

// Paliers de série
const STREAK_MILESTONES = [
  { count: 3, label: 'Série × 3', bonus: '+25 pts', color: 'text-orange-600', bg: 'bg-orange-50' },
  { count: 5, label: 'Série × 5', bonus: '+50 pts', color: 'text-red-600', bg: 'bg-red-50' },
  { count: 10, label: 'Série × 10', bonus: '+100 pts + badge Oracle', color: 'text-purple-600', bg: 'bg-purple-50' },
];

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function PredictionGamification({ progress, predictions = [] }) {
  const correctPreds = predictions.filter(p => p.is_correct === true);
  const incorrectPreds = predictions.filter(p => p.is_correct === false);
  const pendingPreds = predictions.filter(p => p.is_correct === undefined || p.is_correct === null);

  const winnerPreds = predictions.filter(p => p.prediction_type === 'winner');
  const correctWinners = winnerPreds.filter(p => p.is_correct === true);
  const accuracy = winnerPreds.length > 0 
    ? Math.round((correctWinners.length / winnerPreds.filter(p => p.is_correct !== null && p.is_correct !== undefined).length) * 100) || 0
    : 0;

  const totalPredPoints = predictions.reduce((acc, p) => acc + (p.points_earned || 0), 0);
  
  // Current prediction streak
  const streak = progress?.daily_streak || 0;
  const nextMilestone = STREAK_MILESTONES.find(m => m.count > streak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];

  return (
    <div className="space-y-6">
      {/* Synthèse prédictions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tableau de bord prédictif</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Target}
            value={predictions.length}
            label="Prédictions totales"
            color="text-[#034EA2]"
            bg="bg-blue-50"
          />
          <StatCard
            icon={CheckCircle}
            value={correctPreds.length}
            label="Correctes"
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            icon={TrendingUp}
            value={winnerPreds.filter(p => p.is_correct !== null && p.is_correct !== undefined).length > 0 ? `${accuracy}%` : '—'}
            label="Précision vainqueur"
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <StatCard
            icon={Trophy}
            value={totalPredPoints}
            label="Points prédictions"
            color="text-yellow-600"
            bg="bg-yellow-50"
          />
        </div>
      </div>

      {/* Série en cours */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-800">Série de prédictions</h3>
          </div>
          <span className="text-2xl font-bold text-orange-600">{streak}j</span>
        </div>
        
        {/* Progression vers prochain palier */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Vers prochain palier : <strong className="text-orange-600">{nextMilestone.label}</strong></span>
            <span className="text-orange-600 font-medium">{nextMilestone.bonus}</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (streak / nextMilestone.count) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{streak} / {nextMilestone.count} jours</p>
        </div>

        {/* Paliers */}
        <div className="flex gap-2 flex-wrap">
          {STREAK_MILESTONES.map((m) => (
            <span
              key={m.count}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                streak >= m.count 
                  ? 'bg-orange-500 text-white' 
                  : `${m.bg} ${m.color} opacity-60`
              }`}
            >
              {m.label} {streak >= m.count ? '✓' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Barème de points */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Barème des points</h3>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          {POINTS_TABLE.map(({ label, icon: Icon, points, color, bg, border }, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < POINTS_TABLE.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}>
              <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-sm text-slate-700 flex-1">{label}</span>
              <span className={`text-sm font-bold ${color}`}>+{points} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prédictions en attente */}
      {pendingPreds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-slate-800 text-sm">{pendingPreds.length} prédiction{pendingPreds.length > 1 ? 's' : ''} en attente de résultat</h3>
          </div>
          <p className="text-xs text-amber-700">Les points seront attribués après publication des résultats électoraux.</p>
        </div>
      )}

      {predictions.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aucune prédiction enregistrée</p>
          <p className="text-sm text-slate-400 mb-4">Commencez à pronostiquer pour gagner des points</p>
          <Link to={createPageUrl('Cities')}>
            <button className="bg-[#034EA2] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#023b7a] transition-colors">
              Explorer les villes
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
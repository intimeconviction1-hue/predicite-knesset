import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function TensionIndex({ survey, city, compact = false }) {
  const [previousSurvey, setPreviousSurvey] = useState(null);

  // Fetch previous survey for evolution comparison
  useEffect(() => {
    base44.entities.CitySurvey.filter({ city_id: survey.city_id })
      .then(surveys => {
        const sorted = surveys
          .filter(s => new Date(s.date) < new Date(survey.date))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sorted.length > 0) setPreviousSurvey(sorted[0]);
      })
      .catch(() => {});
  }, [survey.city_id, survey.date]);

  // Calculate tension metrics
  const calculateTension = () => {
    if (!survey.candidates || survey.candidates.length < 2) return 0;

    const sorted = [...survey.candidates].sort((a, b) => b.percentage - a.percentage);
    const gap = sorted[0].percentage - sorted[1].percentage;
    const gapTension = Math.max(0, 100 - gap * 5); // Smaller gap = higher tension

    const turnout = survey.turnout || 50;
    const turnoutTension = Math.abs(turnout - 50) * 2; // Deviation from average

    const undecided = survey.undecided || 0;
    const undecidedTension = undecided * 1.5; // More undecided = more tension

    return Math.round((gapTension + turnoutTension + undecidedTension) / 3);
  };

  // Calculate evolution
  const calculateEvolution = () => {
    if (!previousSurvey || !survey.candidates) return null;

    const current = survey.candidates[0];
    const previous = previousSurvey.candidates?.find(c => c.name === current.name);
    if (!previous) return null;

    return current.percentage - previous.percentage;
  };

  const tension = calculateTension();
  const evolution = calculateEvolution();

  const getTensionLevel = (value) => {
    if (value < 25) return { label: 'Très sereine', color: 'bg-green-100 text-green-700', icon: '😌' };
    if (value < 50) return { label: 'Calme', color: 'bg-blue-100 text-blue-700', icon: '👀' };
    if (value < 75) return { label: 'Tendue', color: 'bg-amber-100 text-amber-700', icon: '⚡' };
    return { label: 'Très tendue', color: 'bg-red-100 text-red-700', icon: '🔥' };
  };

  const tensionLevel = getTensionLevel(tension);

  if (compact) {
    return (
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${tensionLevel.color} rounded-lg p-3 border`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{tensionLevel.icon}</span>
              <div className="text-xs">
                <p className="font-semibold">Indice de tension</p>
                <p className="text-xs opacity-75">{tensionLevel.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">{tension}/100</p>
              {evolution !== null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`text-xs flex items-center gap-0.5 justify-end ${evolution > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      <TrendingUp className="w-3 h-3" />
                      {evolution > 0 ? '+' : ''}{evolution.toFixed(1)}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Évolution du leader depuis dernier sondage</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

  // Full view
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Indice de tension électorale
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {city.name} · Sondage du {new Date(survey.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-4xl font-bold ${tensionLevel.color.split(' ')[1]}`}
            >
              {tension}
            </motion.div>
            <p className="text-xs font-semibold text-slate-600">{tensionLevel.label}</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Écart entre candidats */}
          <div className="bg-white border border-slate-100 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Écart de tête
            </p>
            {survey.candidates && survey.candidates.length >= 2 ? (
              <>
                <p className="font-bold text-slate-800">{(survey.candidates[0].percentage - survey.candidates[1].percentage).toFixed(1)}%</p>
                <p className="text-xs text-slate-400 mt-1">
                  {survey.candidates[0].name} vs {survey.candidates[1].name}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">N/A</p>
            )}
          </div>

          {/* Participation */}
          <div className="bg-white border border-slate-100 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Taux de participation
            </p>
            <p className="font-bold text-slate-800">{survey.turnout || '—'}%</p>
            <p className="text-xs text-slate-400 mt-1">Estimée</p>
          </div>

          {/* Évolution */}
          <div className="bg-white border border-slate-100 rounded-lg p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Évolution leader
                  </p>
                  {evolution !== null ? (
                    <>
                      <p className={`font-bold text-lg ${evolution > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {evolution > 0 ? '+' : ''}{evolution.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400 mt-1">vs sondage précédent</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Pas de comparaison</p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Variation du leader depuis le sondage précédent</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Top candidates */}
        {survey.candidates && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-600 mb-3">Favoris (derniers sondages)</p>
            <div className="space-y-2">
              {survey.candidates.slice(0, 3).map((candidate, idx) => (
                <div key={candidate.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.party}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-800">{candidate.percentage.toFixed(1)}%</p>
                    {candidate.evolution && (
                      <p className={`text-xs ${candidate.evolution > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {candidate.evolution > 0 ? '+' : ''}{candidate.evolution.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Dernière mise à jour : {new Date(survey.date).toLocaleDateString('fr-FR')}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
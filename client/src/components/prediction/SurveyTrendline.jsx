import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.jsx';

export default function SurveyTrendline({ city, candidateName }) {
  const { data: surveys = [] } = useQuery({
    queryKey: ['city-surveys-trend', city.id],
    queryFn: async () => {
      const data = await base44.entities.CitySurvey.filter({ city_id: city.id });
      return data.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
  });

  // Extract trend data for specific candidate
  const trendData = surveys
    .map(survey => ({
      date: new Date(survey.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      percentage: survey.candidates?.find(c => c.name === candidateName)?.percentage || null,
      fullDate: survey.date
    }))
    .filter(d => d.percentage !== null);

  if (trendData.length < 2) {
    return (
      <div className="text-xs text-slate-400 py-2">
        Données insuffisantes pour afficher la tendance
      </div>
    );
  }

  const currentPercentage = trendData[trendData.length - 1].percentage;
  const previousPercentage = trendData[trendData.length - 2].percentage;
  const evolution = currentPercentage - previousPercentage;
  const evolutionPercent = ((evolution / previousPercentage) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Evolution indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {evolution > 0.5 ? (
            <TrendingUp className="w-4 h-4 text-red-500" />
          ) : evolution < -0.5 ? (
            <TrendingDown className="w-4 h-4 text-green-500" />
          ) : (
            <Minus className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-xs font-medium text-slate-600">Tendance</span>
        </div>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <span className={`text-sm font-bold ${
                evolution > 0.5 ? 'text-red-600' : evolution < -0.5 ? 'text-green-600' : 'text-slate-600'
              }`}>
                {evolution > 0 ? '+' : ''}{evolution.toFixed(1)}% ({evolutionPercent}%)
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{previousPercentage.toFixed(1)}% → {currentPercentage.toFixed(1)}%</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Micro chart */}
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '11px'
            }}
            formatter={(value) => [`${value.toFixed(1)}%`, candidateName]}
          />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#034EA2"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
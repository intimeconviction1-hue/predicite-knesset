import React from 'react';
import { motion } from 'framer-motion';
import { History, Users, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function CityHistory({ city }) {
  const partyColors = {
    'PS': '#e11d48',
    'LR': '#2563eb',
    'EELV': '#16a34a',
    'RN': '#334155',
    'LREM': '#eab308',
    'PCF': '#dc2626',
    'Divers': '#6b7280'
  };

  const getPartyColor = (party) => {
    for (const [key, color] of Object.entries(partyColors)) {
      if (party?.includes(key)) return color;
    }
    return '#6366f1';
  };

  const turnoutData = city.previous_results?.map(r => ({
    year: r.year,
    participation: r.turnout,
    winner: r.winner
  })) || [];

  const resultsData = city.previous_results?.map(r => ({
    year: r.year,
    percentage: r.percentage,
    party: r.party
  })) || [];

  return (
    <div className="space-y-6">
      {/* Historical mayors timeline */}
      {city.historical_mayors?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Les maires de {city.name}</h3>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500" />
            
            <div className="space-y-4">
              {city.historical_mayors.map((mayor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-10"
                >
                  <div 
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white"
                    style={{ backgroundColor: getPartyColor(mayor.party) }}
                  />
                  <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{mayor.name}</p>
                        <Badge 
                          className="mt-1 text-white text-xs"
                          style={{ backgroundColor: getPartyColor(mayor.party) }}
                        >
                          {mayor.party}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {mayor.start_year} – {mayor.end_year || 'présent'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {(mayor.end_year || 2026) - mayor.start_year} ans
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Turnout chart */}
      {turnoutData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">Taux de participation</h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Participation']}
                />
                <Line
                  type="monotone"
                  dataKey="participation"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Results chart */}
      {resultsData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Résultats historiques</h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name, props) => [
                    `${value}%`,
                    props.payload.party || 'Vainqueur'
                  ]}
                />
                <Bar
                  dataKey="percentage"
                  radius={[8, 8, 0, 0]}
                  fill="#6366f1"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
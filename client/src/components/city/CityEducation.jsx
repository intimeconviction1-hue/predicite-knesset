import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, History, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

export default function CityEducation({ city }) {
  if (!city) return null;

  return (
    <div className="space-y-6">
      {/* Section Structure pédagogique */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 rounded-xl p-3">
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Comprendre {city.name}
            </h3>
            <p className="text-slate-600 text-sm">
              Histoire, contexte et enjeux expliqués simplement
            </p>
          </div>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Histoire
            </TabsTrigger>
            <TabsTrigger value="current">
              <TrendingUp className="w-4 h-4 mr-2" />
              Aujourd'hui
            </TabsTrigger>
            <TabsTrigger value="issues">
              <AlertCircle className="w-4 h-4 mr-2" />
              Enjeux
            </TabsTrigger>
          </TabsList>

          {/* Histoire politique */}
          <TabsContent value="history" className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-100 text-blue-700">
                  📚 Histoire politique
                </Badge>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {city.political_history || "Histoire politique à venir..."}
                </ReactMarkdown>
              </div>

              {/* Maires historiques */}
              {city.historical_mayors && city.historical_mayors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm">
                    Les maires qui ont marqué l'histoire
                  </h4>
                  <div className="space-y-2">
                    {city.historical_mayors.map((mayor, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                        <div>
                          <p className="font-medium text-slate-800">{mayor.name}</p>
                          <p className="text-xs text-slate-600">{mayor.party}</p>
                        </div>
                        <p className="text-sm text-slate-500">
                          {mayor.start_year} - {mayor.end_year || 'aujourd\'hui'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Situation actuelle */}
          <TabsContent value="current" className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-green-100 text-green-700">
                  📍 Situation actuelle
                </Badge>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {city.current_situation || "Situation actuelle à venir..."}
                </ReactMarkdown>
              </div>

              {/* Maire actuel */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Maire actuel</p>
                      <p className="font-bold text-slate-800">{city.current_mayor}</p>
                    </div>
                    <Badge className={`
                      ${city.current_party === 'PS' ? 'bg-pink-100 text-pink-700' : ''}
                      ${city.current_party === 'LR' ? 'bg-blue-100 text-blue-700' : ''}
                      ${city.current_party === 'EELV' ? 'bg-green-100 text-green-700' : ''}
                      ${city.current_party === 'LREM' ? 'bg-amber-100 text-amber-700' : ''}
                      ${city.current_party === 'PCF' ? 'bg-red-100 text-red-700' : ''}
                      ${!['PS', 'LR', 'EELV', 'LREM', 'PCF'].includes(city.current_party) ? 'bg-slate-100 text-slate-700' : ''}
                    `}>
                      {city.current_party}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Résultats précédents */}
              {city.previous_results && city.previous_results.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm">
                    Élections précédentes
                  </h4>
                  <div className="space-y-2">
                    {city.previous_results.slice(0, 3).map((result, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800">{result.year}</span>
                          <Badge variant="outline">{result.party}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{result.winner}</p>
                        <div className="flex gap-4 text-xs">
                          <span className="text-slate-600">
                            🏆 {result.percentage}% des voix
                          </span>
                          <span className="text-slate-600">
                            📊 {result.turnout}% participation
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Enjeux clés */}
          <TabsContent value="issues" className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-orange-100 text-orange-700">
                  🎯 Enjeux de l'élection
                </Badge>
              </div>
              
              {city.key_issues && city.key_issues.length > 0 ? (
                <div className="grid gap-3">
                  {city.key_issues.map((issue, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4"
                    >
                      <div className="bg-orange-500 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{issue}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">Enjeux à venir...</p>
              )}

              {/* Fun facts */}
              {city.fun_facts && city.fun_facts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-slate-800 text-sm">
                      Le saviez-vous ?
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {city.fun_facts.map((fact, i) => (
                      <div key={i} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-sm text-slate-700">💡 {fact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
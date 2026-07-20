import React, { useState } from 'react';
import { Newspaper, X, Calendar, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { getCampaignPhase, PHASE_CONFIG } from '@/components/campaign/CampaignPhase';

export default function DailyInfoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const phase = getCampaignPhase();
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  const today = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
      >
        <Newspaper className="w-4 h-4" />
        Infos du jour
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className={`sticky top-0 bg-gradient-to-r ${config.color} text-white p-6 rounded-t-3xl`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-2xl p-3">
                      <Icon className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <Badge className="bg-white/20 text-white mb-1 border-white/30">
                        <Calendar className="w-3 h-3 mr-1" />
                        {today}
                      </Badge>
                      <h2 className="text-2xl font-bold mb-1">📰 Infos du jour</h2>
                      <p className="text-white/90 text-sm">Municipales 2026</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Phase actuelle */}
                <div className={`bg-gradient-to-r ${config.bg} rounded-xl p-5 border border-slate-200`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{config.emoji}</span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{config.name}</h3>
                      <p className="text-slate-600 text-sm">Phase actuelle de la campagne</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{config.message}</p>
                  
                  {/* Intensity bar */}
                  <div className="flex gap-1 mt-4">
                    <span className="text-xs text-slate-600 mr-2">Intensité:</span>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-8 rounded-full ${
                          i < config.intensity ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Enjeux du moment */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Enjeux du moment</h3>
                  </div>
                  <div className="space-y-3">
                    {getPhaseIssues(phase).map((issue, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                        <div className="bg-indigo-100 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{issue.title}</p>
                          <p className="text-slate-600 text-sm mt-1">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lien avec les jeux */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-900">Lien avec les jeux d'aujourd'hui</h3>
                  </div>
                  <p className="text-purple-800 leading-relaxed">
                    {getPhaseLinkToGames(phase)}
                  </p>
                </div>

                {/* CTA */}
                <div className="text-center pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Compris, c'est parti ! 🚀
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getPhaseIssues(phase) {
  const issuesMap = {
    campaign_start: [
      { title: 'Découvrir les candidats', description: 'Prenez le temps d\'explorer les profils et programmes des candidats dans chaque ville.' },
      { title: 'Comprendre les enjeux locaux', description: 'Chaque ville a ses spécificités : logement, transports, écologie, sécurité...' },
      { title: 'Premières prédictions', description: 'Commencez à faire vos pronostics pour gagner des points.' }
    ],
    intense: [
      { title: 'Campagne qui s\'intensifie', description: 'Les débats se multiplient, les programmes se précisent, les sondages s\'affinent.' },
      { title: 'Affiner vos prédictions', description: 'Avec plus d\'informations, ajustez vos pronostics pour maximiser vos points.' },
      { title: 'Approfondir vos connaissances', description: 'Les quiz deviennent plus pointus, l\'histoire locale plus détaillée.' }
    ],
    final_week: [
      { title: 'Dernière ligne droite', description: 'Plus qu\'une semaine avant le scrutin, l\'excitation monte !' },
      { title: 'Derniers débats', description: 'Les candidats font leurs derniers meetings, affinent leurs messages.' },
      { title: 'Doublez vos points', description: 'Les défis de cette semaine rapportent le double de points habituels.' }
    ],
    eve: [
      { title: 'Dernières heures', description: 'Les prédictions ferment à minuit. C\'est votre dernière chance !' },
      { title: 'Silence électoral', description: 'Plus de communication politique, place au recueillement citoyen.' },
      { title: 'Préparation du scrutin', description: 'Les bureaux de vote se préparent pour demain.' }
    ],
    election_day: [
      { title: 'C\'est le jour J', description: 'Les Français votent aujourd\'hui pour élire leurs maires.' },
      { title: 'Résultats dès 20h', description: 'Suivez les résultats en direct sur la page Soirée électorale.' },
      { title: 'Vos scores finaux', description: 'Découvrez la précision de vos prédictions ville par ville.' }
    ],
    between_rounds: [
      { title: 'Entre deux tours', description: 'Analyse des résultats du premier tour, préparation du second.' },
      { title: 'Nouvelles alliances', description: 'Les candidats se positionnent pour le second tour.' },
      { title: 'Nouvelles prédictions', description: 'Faites vos pronostics pour les duels du second tour.' }
    ],
    post_election: [
      { title: 'Élections terminées', description: 'Les nouveaux maires sont élus, un nouveau cycle commence.' },
      { title: 'Analyse finale', description: 'Consultez vos scores, vos apprentissages, votre progression.' },
      { title: 'Bilan pédagogique', description: 'Qu\'avez-vous appris pendant cette campagne ?' }
    ]
  };
  
  return issuesMap[phase] || issuesMap.campaign_start;
}

function getPhaseLinkToGames(phase) {
  const linksMap = {
    campaign_start: 'Les quiz d\'aujourd\'hui portent sur les bases des élections municipales. Les défis vous invitent à explorer 3 villes et faire vos premières prédictions.',
    intense: 'Les quiz approfondissent l\'histoire politique des villes. Les défis mettent l\'accent sur les enjeux locaux et les prédictions tactiques.',
    final_week: 'Quiz express et défis à points doublés ! Concentrez-vous sur les villes que vous connaissez le moins.',
    eve: 'Derniers quiz de révision et dernière chance de faire vos prédictions avant minuit.',
    election_day: 'Suivez les résultats en direct sur la page Soirée électorale. Vos points seront calculés automatiquement.',
    between_rounds: 'Nouveaux quiz sur le premier tour, nouvelles prédictions pour le second tour.',
    post_election: 'Consultez votre bilan personnalisé et vos apprentissages dans votre profil.'
  };
  
  return linksMap[phase] || linksMap.campaign_start;
}
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Zap, Trophy, Target, Flame, Crown, AlertCircle, 
  TrendingUp, Users, Clock, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCampaignPhase } from '../campaign/CampaignPhase';

export default function PhaseSpecificContent() {
  const phase = getCampaignPhase();

  const content = {
    campaign_start: {
      title: 'Bienvenue dans l\'aventure !',
      description: 'Découvrez les 20 villes, explorez leur histoire politique et faites vos premières prédictions.',
      cta: 'Explorer les villes',
      ctaLink: 'Cities',
      icon: Target,
      tips: [
        '💡 Consultez l\'historique de chaque ville',
        '📚 Répondez aux quiz pour apprendre',
        '🎯 Plus tôt vous prédisez, plus vous gagnez de points'
      ]
    },
    intense: {
      title: 'La campagne s\'intensifie !',
      description: 'Les débats font rage ! Affinez vos prédictions et participez aux défis quotidiens.',
      cta: 'Défis du jour',
      ctaLink: 'Home',
      icon: Flame,
      tips: [
        '⚡ Nouveaux défis chaque jour',
        '📊 Suivez l\'évolution des sondages',
        '🏆 Montez dans le classement'
      ]
    },
    final_week: {
      title: '🔥 Dernière semaine !',
      description: 'Plus qu\'une semaine avant le scrutin ! C\'est le moment de faire vos prédictions finales.',
      cta: 'Prédire maintenant',
      ctaLink: 'Cities',
      icon: Zap,
      tips: [
        '⏰ Derniers jours pour prédire',
        '💎 Points bonus cette semaine',
        '🎯 Toutes les prédictions comptent double !'
      ]
    },
    eve: {
      title: '⚠️ DERNIÈRES HEURES !',
      description: 'Les jeux ferment à minuit ! Dernière chance de faire vos prédictions.',
      cta: 'Mes dernières prédictions',
      ctaLink: 'Cities',
      icon: AlertCircle,
      tips: [
        '🚨 Prédictions closes à 23h59',
        '⭐ Triple points pour les prédictions de dernière minute',
        '🎲 C\'est votre dernière chance !'
      ]
    },
    election_day: {
      title: '🗳️ JOUR DES ÉLECTIONS !',
      description: 'Les bureaux de vote sont ouverts ! Résultats en direct ce soir à partir de 20h.',
      cta: 'Soirée des résultats',
      ctaLink: 'ElectionNight',
      icon: Crown,
      tips: [
        '📺 Résultats en direct dès 20h',
        '🏆 Découvrez vos scores en temps réel',
        '🎉 Célébrations et podium final'
      ]
    },
    between_rounds: {
      title: '1er tour terminé !',
      description: 'Découvrez les résultats et préparez-vous pour le second tour.',
      cta: 'Voir les résultats',
      ctaLink: 'ElectionNight',
      icon: TrendingUp,
      tips: [
        '📊 Analysez vos performances',
        '🎯 Préparez le second tour',
        '🏅 Badges spéciaux débloqués'
      ]
    },
    post_election: {
      title: 'Élections terminées ! 🏆',
      description: 'Consultez le classement final et vos statistiques complètes.',
      cta: 'Classement final',
      ctaLink: 'Leaderboard',
      icon: Trophy,
      tips: [
        '👑 Découvrez les champions',
        '📈 Analysez vos stats',
        '🎁 Réclamez vos badges'
      ]
    }
  };

  const config = content[phase];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{config.title}</h2>
              <p className="text-slate-600 mb-4">{config.description}</p>
              
              <div className="space-y-2 mb-4">
                {config.tips.map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              <Link to={createPageUrl(config.ctaLink)}>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {config.cta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
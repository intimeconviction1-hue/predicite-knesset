import React, { useState } from 'react';
import { HelpCircle, X, Target, Gift, Trophy, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function GameRulesButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2 bg-white hover:bg-slate-50"
      >
        <HelpCircle className="w-4 h-4" />
        Règles du jeu
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
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-2xl p-3">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Comment jouer ?</h2>
                      <p className="text-white/90 text-sm">Lecture : moins de 3 minutes</p>
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
                {/* What is this */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-900">À quoi sert cette application ?</h3>
                  </div>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Apprendre</strong> le fonctionnement des élections municipales en s'amusant</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Découvrir</strong> l'histoire politique de 20 grandes villes françaises</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Prédire</strong> les résultats et gagner des points virtuels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Participer</strong> à une expérience pédagogique collective</span>
                    </li>
                  </ul>
                </div>

                {/* How to play */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">🎮 Comment jouer</h3>
                  <div className="grid gap-3">
                    {[
                      { icon: Target, title: 'Faire des prédictions', desc: 'Choisissez une ville et prédisez le vainqueur, les scores et la participation' },
                      { icon: HelpCircle, title: 'Répondre aux quiz', desc: 'Testez vos connaissances sur les institutions, l\'histoire et les enjeux locaux' },
                      { icon: Gift, title: 'Relever les défis quotidiens', desc: 'Un nouveau défi chaque jour avec des points bonus et événements spéciaux' },
                      { icon: Trophy, title: 'Progresser dans le classement', desc: 'Gagnez des points, débloquez des badges et montez dans votre rôle' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                        <div className="bg-indigo-100 rounded-lg p-2 flex-shrink-0">
                          <item.icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{item.title}</p>
                          <p className="text-slate-600 text-sm mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important info */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-amber-900">Important à savoir</h3>
                  </div>
                  <ul className="space-y-2 text-amber-800 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 flex-shrink-0">GRATUIT</Badge>
                      <span>100% gratuit, aucun achat, aucune publicité</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-purple-100 text-purple-700 flex-shrink-0">VIRTUEL</Badge>
                      <span>Points virtuels uniquement, aucun argent réel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-blue-100 text-blue-700 flex-shrink-0">NEUTRE</Badge>
                      <span>Objectif pédagogique, pas de promotion politique</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="bg-indigo-100 text-indigo-700 flex-shrink-0">ÉDUCATIF</Badge>
                      <span>Chaque action = apprentissage sur la démocratie locale</span>
                    </li>
                  </ul>
                </div>

                {/* Roles system */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 text-lg">🎭 Système de rôles</h3>
                  <p className="text-slate-600 mb-3">Votre rôle évolue automatiquement selon votre participation :</p>
                  <div className="space-y-2">
                    {[
                      { icon: '👀', name: 'Observateur Local', desc: 'Débutant' },
                      { icon: '📚', name: 'Apprenti Citoyen', desc: 'Engagé' },
                      { icon: '🎯', name: 'Expert Municipal', desc: 'Confirmé' },
                      { icon: '📖', name: 'Historien Citoyen', desc: 'Avancé' },
                      { icon: '🏆', name: 'Analyste Politique', desc: 'Expert' }
                    ].map((role, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-2xl">{role.icon}</span>
                        <span className="font-semibold text-slate-800">{role.name}</span>
                        <Badge variant="outline" className="text-xs">{role.desc}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    C'est parti ! 🚀
                  </Button>
                  <p className="text-xs text-slate-500 mt-3">
                    📅 Élections : 15 et 22 mars 2026
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
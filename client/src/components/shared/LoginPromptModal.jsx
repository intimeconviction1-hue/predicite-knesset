import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/client';
import { LogIn, X, Target, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PERKS = [
  { icon: Target, text: 'Enregistrez vos pronostics pour 20 villes' },
  { icon: Trophy, text: 'Rejoignez le classement national' },
  { icon: Users, text: 'Créez ou rejoignez des ligues privées' },
];

export default function LoginPromptModal({ open, onClose, message }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0D1B3E] border border-white/15 rounded-2xl max-w-sm w-full p-6 shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#034EA2]/30 border border-[#034EA2]/40 mx-auto mb-4">
            <LogIn className="w-6 h-6 text-[#4A7FD4]" />
          </div>

          {/* Title */}
          <h2 className="text-white font-bold text-lg text-center mb-1">
            Créez un compte gratuit
          </h2>
          <p className="text-white/50 text-sm text-center mb-5">
            {message || 'Créez un compte pour enregistrer votre anticipation.'}
          </p>

          {/* Perks */}
          <ul className="space-y-2.5 mb-6">
            {PERKS.map(({ icon: PerkIcon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/65">
                <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <PerkIcon className="w-3.5 h-3.5 text-[#4A7FD4]" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <Button
            className="w-full bg-[#034EA2] hover:bg-[#023882] text-white font-bold mb-3"
            onClick={() => base44.auth.redirectToLogin()}
          >
            <LogIn className="w-4 h-4 mr-2" />
            S'inscrire / Se connecter
          </Button>
          <button
            onClick={onClose}
            className="w-full text-xs text-white/30 hover:text-white/50 transition py-1"
          >
            Continuer en mode visiteur
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RepublicanFooter() {
  return (
    <footer className="bg-[#034EA2] text-white py-8 mt-16">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-6">
          <p className="text-3xl font-bold mb-2">🏛️ RÉPUBLIQUE FRANÇAISE</p>
          <p className="text-xl tracking-wider">LIBERTÉ • ÉGALITÉ • FRATERNITÉ</p>
        </div>
        <div className="border-t border-white/20 pt-6 mt-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
            <Link to={createPageUrl('Learn')} className="hover:underline hover:text-[#E1B530]">
              Mentions légales
            </Link>
            <Link to={createPageUrl('Learn')} className="hover:underline hover:text-[#E1B530]">
              CGU
            </Link>
            <Link to={createPageUrl('Learn')} className="hover:underline hover:text-[#E1B530]">
              Contact
            </Link>
            <Link to={createPageUrl('Learn')} className="hover:underline hover:text-[#E1B530]">
              Sources
            </Link>
            <span className="text-white/80">Neutralité politique</span>
          </div>
          <p className="text-center text-sm text-white/70">
            © 2026 - Municipales 2026 - Tous droits réservés
          </p>
          <p className="text-center text-xs text-white/50 mt-2">
            Application citoyenne, gratuite et pédagogique - Aucun parti politique n'est associé à ce projet
          </p>
        </div>
      </div>
    </footer>
  );
}
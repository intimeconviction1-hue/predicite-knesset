import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShieldCheck, ChevronRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const INSTITUTES = [
  { name: 'IFOP', description: 'Institut Français d\'Opinion Publique', url: 'https://www.ifop.com', color: '#034EA2' },
  { name: 'Ipsos', description: 'Leader mondial des sondages', url: 'https://www.ipsos.com/fr-fr', color: '#1A3580' },
  { name: 'OpinionWay', description: 'Institut de sondage français', url: 'https://www.opinion-way.com', color: '#4A7FD4' },
  { name: 'Elabe', description: 'Études & conseils politiques', url: 'https://elabe.fr', color: '#034EA2' },
];

export default function InstitutesCredibility() {
  return (
    <div className="bg-white border-b border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          {/* Left: title + description */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#034EA2]/8 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#034EA2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A3580]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Sondages utilisés
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 max-w-md leading-relaxed">
                Données issues des derniers sondages publics publiés par les instituts.<br />
                Chaque ville indique sa source et sa date de publication.
              </p>
            </div>
          </div>

          {/* Right: institute badges */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            {INSTITUTES.map((inst, i) => (
              <motion.a
                key={inst.name}
                href={inst.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-[#034EA2]/30 hover:bg-[#034EA2]/4 transition-all"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: inst.color }}
                />
                <span className="text-sm font-bold text-gray-800">{inst.name}</span>
                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-[#034EA2] transition-colors" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Méthodologie complète et sources détaillées disponibles sur chaque sondage
          </p>
          <Link to={createPageUrl('Methodologie')} className="text-xs text-[#034EA2] font-medium hover:underline flex items-center gap-1">
            Sources & Méthodologie <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
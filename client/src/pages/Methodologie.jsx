import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Shield, CheckCircle, ExternalLink, BookOpen, 
  BarChart3, AlertCircle, Star, ChevronRight 
} from 'lucide-react';
import { ReliabilityScore } from '@/components/ui/PollBadge';

const INSTITUTES = [
  { name: 'IFOP', description: "Institut Français d'Opinion Publique, fondé en 1938. Référence nationale.", reliability: 5, website: 'https://www.ifop.com' },
  { name: 'Harris Interactive', description: 'Cabinet de conseil en data et opinion. Forte présence électorale.', reliability: 5, website: 'https://harris-interactive.fr' },
  { name: 'Ipsos', description: 'Groupe international de sondages, présent dans 90 pays.', reliability: 5, website: 'https://www.ipsos.com/fr-fr' },
  { name: 'OpinionWay', description: 'Institut de sondages créé en 2000, spécialisé dans les études politiques.', reliability: 4, website: 'https://www.opinion-way.com' },
  { name: 'BVA', description: 'Institut de sondages créé en 1970, expertise reconnue en opinion publique.', reliability: 4, website: 'https://www.bva-group.com' },
  { name: 'Elabe', description: 'Cabinet d\'études et de conseil, sondages référencés par les médias nationaux.', reliability: 4, website: 'https://elabe.fr' },
];

const GLOSSARY = [
  { term: 'Intention de vote', def: 'Proportion d\'électeurs déclarant vouloir voter pour un candidat au moment du sondage. Ne reflète pas le résultat final.' },
  { term: 'Marge d\'erreur', def: 'Incertitude statistique inhérente à tout sondage. Un résultat de 45% ±2,5% signifie que la valeur réelle est entre 42,5% et 47,5%.' },
  { term: 'Triangulaire', def: 'Configuration où trois candidats obtiennent plus de 12,5% des inscrits au 1er tour, permettant à tous trois de se maintenir au second.' },
  { term: 'Volatilité électorale', def: 'Mesure du changement d\'opinions entre deux sondages successifs. Une forte volatilité indique un électorat indécis.' },
  { term: 'Indice de tension', def: 'Score composite calculé par PARIVOTE combinant l\'écart entre candidats, la présence de triangulaires et la volatilité récente.' },
  { term: 'Taux de participation', def: 'Proportion d\'électeurs inscrits qui se rendent aux urnes. En 2020, il était de 41,6% au 1er tour des municipales.' },
  { term: 'Redressement', def: 'Ajustement statistique opéré par les instituts pour corriger les biais de l\'échantillon (surreprésentations, sous-représentations).' },
];

export default function Methodologie() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-7 h-7 text-[#E1B530]" />
              <h1 className="text-3xl font-bold">Sources & Transparence</h1>
            </div>
            <p className="text-white/75 max-w-2xl">
              PARIVOTE s'engage à une transparence totale sur ses sources de données, 
              sa méthodologie de calcul et la distinction entre données réelles et simulations.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Nos engagements */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Nos engagements éditoriaux
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Séparation stricte', desc: 'Toute donnée est clairement identifiée : sondage réel, simulation interne ou sondage communautaire.' },
              { title: 'Sources citées', desc: 'Chaque sondage affiche son institut, son commanditaire, la taille de l\'échantillon et la marge d\'erreur.' },
              { title: 'Neutralité partisane', desc: 'PARIVOTE ne prend aucun parti. Les données sont affichées sans commentaire orienté.' },
              { title: 'Données officielles', desc: 'Les résultats historiques proviennent de data.gouv.fr et du Ministère de l\'Intérieur.' },
            ].map((e, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <p className="font-semibold text-slate-800 mb-1">{e.title}</p>
                <p className="text-sm text-slate-500">{e.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Calcul indice tension */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#034EA2]" />
            Comment est calculé l'indice de tension ?
          </h2>
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#034EA2] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <p className="font-medium text-slate-800">Écart entre candidats</p>
                  <p className="text-sm text-slate-500">L'écart de points entre le 1er et le 2e candidat. Un écart ≤3% génère un score de tension élevé.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#034EA2] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <p className="font-medium text-slate-800">Détection de triangulaire</p>
                  <p className="text-sm text-slate-500">Si 3 candidats ou plus dépassent 15%, la tension augmente de 15 points.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#034EA2] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <p className="font-medium text-slate-800">Score final (0–100)</p>
                  <p className="text-sm text-slate-500">
                    Tendue ≥75 · Incertaine 50–74 · Stable 30–49 · Calme &lt;30
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Score de fiabilité */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#E1B530]" />
            Score de fiabilité des instituts
          </h2>
          <p className="text-sm text-slate-500 mb-4">Évaluation basée sur : taille d'échantillon, ancienneté, indépendance, méthodologie publiée.</p>
          <div className="space-y-3">
            {INSTITUTES.map((inst, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-800">{inst.name}</p>
                    <a href={inst.website} target="_blank" rel="noopener noreferrer" className="text-[#034EA2] hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-sm text-slate-500">{inst.description}</p>
                </div>
                <ReliabilityScore score={inst.reliability} />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Glossaire */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-600" />
            Glossaire électoral
          </h2>
          <div className="space-y-3">
            {GLOSSARY.map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <p className="font-semibold text-[#034EA2] mb-1">{item.term}</p>
                <p className="text-sm text-slate-600">{item.def}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Sources officielles */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-500" />
            Sources officielles
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { name: 'data.gouv.fr', desc: 'Résultats électoraux officiels', url: 'https://www.data.gouv.fr/fr/datasets/?topic=elections' },
              { name: 'Ministère de l\'Intérieur', desc: 'Résultats et statistiques officiels', url: 'https://www.interieur.gouv.fr/Elections' },
              { name: 'vie-publique.fr', desc: 'Contenus institutionnels et analyses', url: 'https://www.vie-publique.fr' },
              { name: 'conseil-constitutionnel.fr', desc: 'Cadre légal des élections', url: 'https://www.conseil-constitutionnel.fr' },
            ].map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-[#034EA2]/30 transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-[#034EA2] transition-colors">{s.name}</p>
                    <p className="text-sm text-slate-500">{s.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#034EA2] transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </motion.section>

        <div className="text-center pt-4 pb-8">
          <Link to={createPageUrl('Surveys')} className="inline-flex items-center gap-2 text-[#034EA2] font-medium hover:underline">
            Voir les sondages <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
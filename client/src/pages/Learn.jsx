import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  BookOpen, Building2, Users, Calendar, Vote, Scale,
  MapPin, ChevronRight, Lightbulb, HelpCircle, Sparkles, Star
} from 'lucide-react';
import ElectionRulesModule from '@/components/election/ElectionRulesModule';

const TOPICS = [
  {
    id: 'municipales',
    icon: Building2,
    title: 'Les élections municipales',
    accent: '#2B5CE6',
    content: `
## Qu'est-ce que les élections municipales ?
Les élections municipales permettent aux citoyens français d'élire leurs représentants locaux : le conseil municipal et le maire.

### Qui vote ?
- Tous les citoyens français de 18 ans et plus
- Les citoyens européens résidant en France peuvent aussi voter

### Quand ont-elles lieu ?
- Tous les 6 ans
- Prochaines élections : mars 2026 (1er tour le 15 mars, 2nd tour le 22 mars)

### Comment ça marche ?
Dans les communes de plus de 1 000 habitants, les élections se font au scrutin de liste à deux tours :
- **1er tour** : une liste qui obtient la majorité absolue (>50%) l'emporte directement
- **2nd tour** : si aucune liste n'obtient 50%, les listes ayant obtenu au moins 10% peuvent se maintenir
    `
  },
  {
    id: 'conseil',
    icon: Users,
    title: 'Le conseil municipal',
    accent: '#1A8C55',
    content: `
## Le conseil municipal

### Composition
Le nombre de conseillers municipaux dépend de la population :
- Moins de 100 habitants : 7 conseillers
- 100 000 à 149 999 habitants : 55 conseillers
- Paris, Lyon, Marseille : règles spéciales

### Rôle
Le conseil municipal :
- Vote le budget de la commune
- Décide des projets d'aménagement
- Gère les services publics locaux (écoles, voirie, eau...)
- Élit le maire et les adjoints

### Réunions
Le conseil se réunit au moins une fois par trimestre, présidé par le maire.
    `
  },
  {
    id: 'maire',
    icon: Vote,
    title: 'Le maire',
    accent: '#7C3AED',
    content: `
## Le rôle du maire
Le maire est élu par le conseil municipal lors de sa première réunion après les élections.

### Double casquette
Le maire a deux fonctions :
1. **Agent de l'État** : état civil, élections, recensement
2. **Chef de l'exécutif communal** : met en œuvre les décisions du conseil

### Pouvoirs
- Police municipale et ordre public
- Urbanisme et permis de construire
- Gestion du personnel communal
- Représentation de la commune

### Durée du mandat
Le maire est élu pour 6 ans, comme les conseillers municipaux.
    `
  },
  {
    id: 'histoire',
    icon: Calendar,
    title: 'Histoire des municipales',
    accent: '#EA580C',
    content: `
## Un peu d'histoire

### Origines
- **1789** : création des communes pendant la Révolution française
- **1831** : premières élections municipales (suffrage censitaire)
- **1848** : suffrage universel masculin
- **1944** : droit de vote des femmes

### Évolutions récentes
- **1982** : décentralisation, plus de pouvoir aux communes
- **2014** : parité obligatoire sur les listes
- **2020** : dernières élections (report du 2nd tour à cause du Covid)

### Chiffres clés
- 34 965 communes en France métropolitaine
- C'est le pays avec le plus de communes en Europe !
- Plus de 500 000 conseillers municipaux élus
    `
  },
  {
    id: 'participation',
    icon: Scale,
    title: 'Participation et abstention',
    accent: '#0891B2',
    content: `
## La participation électorale

### Tendances
La participation aux municipales a tendance à baisser :
- **1983** : 78,4%
- **2001** : 67,4%
- **2014** : 63,5%
- **2020** : 44,7% (contexte Covid)

### Facteurs influençant la participation
- **Taille de la commune** : plus forte participation dans les petites communes
- **Enjeux locaux** : une élection serrée mobilise davantage
- **Météo et actualité** : peuvent impacter le jour du vote

### Pourquoi voter ?
Les décisions municipales impactent directement votre quotidien :
- Écoles et crèches
- Transports et voirie
- Culture et sports
- Urbanisme et logement
    `
  }
];

function renderContent(content) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--p-learn-text)', margin: '1.5rem 0 0.75rem' }}>{line.replace('## ', '')}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--p-learn-text)', margin: '1.25rem 0 0.5rem' }}>{line.replace('### ', '')}</h3>;
    }
    if (line.match(/^\d\./)) {
      const text = line.replace(/^\d\.\s*/, '');
      const parts = text.split('**');
      return (
        <li key={i} style={{ color: 'var(--p-learn-muted)', marginLeft: '1rem', marginBottom: '0.25rem' }}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--p-learn-text)' }}>{p}</strong> : p)}
        </li>
      );
    }
    if (line.startsWith('- **')) {
      const [bold, rest] = line.replace('- **', '').split('**');
      return (
        <li key={i} style={{ color: 'var(--p-learn-muted)', marginLeft: '1rem', marginBottom: '0.25rem' }}>
          <strong style={{ color: 'var(--p-learn-text)' }}>{bold}</strong>{rest}
        </li>
      );
    }
    if (line.startsWith('- ')) {
      return <li key={i} style={{ color: 'var(--p-learn-muted)', marginLeft: '1rem', marginBottom: '0.25rem' }}>{line.replace('- ', '')}</li>;
    }
    if (line.trim()) {
      return <p key={i} style={{ color: 'var(--p-learn-muted)', marginBottom: '0.5rem', lineHeight: 1.65 }}>{line}</p>;
    }
    return null;
  });
}

export default function Learn() {
  const [activeTab, setActiveTab] = useState('municipales');
  const activeTopic = TOPICS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-learn-bg)' }}>

      {/* Header sombre — identité unifiée */}
      <div style={{ background: 'var(--p-night)', borderBottom: '0.5px solid var(--p-border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="w-5 h-5" style={{ color: 'var(--p-gold)' }} />
              <h1 className="p-display text-2xl md:text-3xl">Comprendre les municipales</h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>
              Tout ce qu'il faut savoir — du plus simple au plus précis
            </p>
          </motion.div>
        </div>
      </div>

      {/* Navigation topics */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div
          className="rounded-2xl p-3 overflow-x-auto"
          style={{ background: 'var(--p-learn-card)', border: '0.5px solid var(--p-learn-border)' }}
        >
          <div className="flex gap-2">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isActive = activeTab === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTab(topic.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm font-medium"
                  style={{
                    background: isActive ? topic.accent : 'transparent',
                    color: isActive ? '#fff' : 'var(--p-learn-muted)',
                    fontFamily: 'var(--font-body)',
                    border: isActive ? 'none' : `0.5px solid var(--p-learn-border)`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {topic.title.split(' ').slice(0, 2).join(' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Module règles — pleine largeur */}
          <div className="lg:col-span-3 mb-2">
            <ElectionRulesModule />
          </div>

          {/* Article principal */}
          <div className="lg:col-span-2">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              if (activeTab !== topic.id) return null;
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--p-learn-card)', border: '0.5px solid var(--p-learn-border)' }}
                >
                  {/* En-tête coloré */}
                  <div className="p-6 text-white flex items-center gap-4" style={{ background: topic.accent }}>
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
                      {topic.title}
                    </h2>
                  </div>

                  {/* Corps */}
                  <div className="p-6">
                    {renderContent(topic.content)}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Quiz */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--p-night)', border: '0.5px solid var(--p-border)' }}
            >
              <HelpCircle className="w-7 h-7 mb-3" style={{ color: '#A78BFA' }} />
              <h3 className="p-title text-base mb-2">Testez vos connaissances</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>Quiz et défis quotidiens pour gagner des points.</p>
              <Link to={createPageUrl('Quiz')}>
                <button className="p-btn-primary w-full text-sm justify-center flex items-center gap-2" style={{ background: '#7C3AED' }}>
                  <Sparkles className="w-4 h-4" />
                  Lancer un quiz
                </button>
              </Link>
            </motion.div>

            {/* PLM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)' }}
            >
              <Star className="w-7 h-7 mb-3" style={{ color: 'var(--p-gold)' }} />
              <h3 className="p-title text-base mb-2">Paris, Lyon, Marseille</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>
                Ces 3 villes ont un mode de scrutin unique : la loi PLM de 1982.
              </p>
              <Link to={createPageUrl('ScrutinPLM')}>
                <button className="p-btn-gold w-full text-sm flex items-center justify-center gap-2">
                  Fiche spéciale PLM <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Le saviez-vous */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--p-learn-card)', border: '0.5px solid var(--p-learn-border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" style={{ color: '#D97706' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--p-learn-text)', fontSize: '0.95rem' }}>
                  Le saviez-vous ?
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  'La plus petite commune de France est Rochefourchat (Drôme) avec 1 habitant.',
                  'Le plus jeune maire de France a été élu à 18 ans en 2020.',
                  'Paris, Lyon et Marseille votent par arrondissement.',
                ].map((fact, i) => (
                  <div key={i} className="rounded-xl p-3 text-sm"
                    style={{ background: 'rgba(217,119,6,0.08)', color: '#92400E' }}>
                    {fact}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Règles du scrutin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}
            >
              <Scale className="w-7 h-7 mb-3" style={{ color: 'var(--p-gold)' }} />
              <h3 className="p-title text-base mb-2">Règles du scrutin</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>
                Tours, sièges, parité, seuils : tout le détail des règles électorales.
              </p>
              <Link to={createPageUrl('ScrutinMunicipal')}>
                <button className="p-btn-primary w-full text-sm flex items-center justify-center gap-2">
                  Voir les règles <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Villes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="rounded-2xl p-6"
              style={{ background: 'var(--p-card)', border: '0.5px solid rgba(26,140,85,0.3)' }}
            >
              <MapPin className="w-7 h-7 mb-3" style={{ color: 'var(--p-green)' }} />
              <h3 className="p-title text-base mb-2">Explorez les villes</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>
                Découvrez l'histoire politique de chaque ville.
              </p>
              <Link to={createPageUrl('Cities')}>
                <button className="p-btn-primary w-full text-sm flex items-center justify-center gap-2"
                  style={{ background: 'var(--p-green)' }}>
                  Voir les villes <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
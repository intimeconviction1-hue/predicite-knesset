import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Vote, Gamepad2, BookOpen, Compass, Landmark, Wind, ShieldCheck, HelpCircle, Zap, MapPin, Newspaper, UserCheck, ArrowRight } from 'lucide-react';

// Orientation de la Home : une plateforme inédite doit se comprendre en un coup
// d'œil. Trois étapes (Prédis → Joue → Apprends) + deux « portes » Jouer/Apprendre
// qui lancent aussi directement les jeux et les sujets (règle « où sont les jeux »).
const jeux = [
  { name: 'Paris', label: 'Le direct', icon: Zap },
  { name: 'SensDuVent', label: 'Le sens du vent', icon: Wind },
  { name: 'Boussole', label: 'Quel parti te ressemble ?', icon: Compass },
  { name: 'FormeCoalition', label: 'Forme ta coalition', icon: Landmark },
  { name: 'VraiOuFake', label: 'Vrai ou Fake ?', icon: ShieldCheck },
  { name: 'Quiz', label: 'Quiz', icon: HelpCircle },
];
const apprentissages = [
  { name: 'Learn', label: "L'élection en bref", icon: BookOpen },
  { name: 'Voter', label: 'Comment on vote', icon: UserCheck },
  { name: 'Listes', label: 'Les listes', icon: MapPin },
  { name: 'Actu', label: 'Actu de la campagne', icon: Newspaper },
];

/**
 * Une étape du mode d'emploi. C'était un <div> : trois cartes qui annoncent
 * « Prédis », « Joue », « Apprends » — les trois gestes du produit — et sur
 * lesquelles il ne se passait rien. Une carte avec un numéro, une icône et un
 * verbe à l'impératif RESSEMBLE à un bouton ; ne pas l'être, c'est promettre
 * puis refuser. Chacune mène maintenant à son geste.
 */
function Step({ n, title, text, icon: Icon, color, to }) {
  return (
    /* `!flex !items-start w-full` n'est pas de la décoration. globals.css impose
       `display:inline-flex; align-items:center` à tout lien autonome (plancher
       tactile de 44 px), avec une spécificité qui bat les classes Tailwind : sans
       les `!`, la carte se réduirait à son contenu dans sa cellule de grille et
       le texte se centrerait verticalement contre la pastille. */
    <Link
      to={createPageUrl(to)}
      className="group p-card p-4 !flex !items-start w-full gap-3 transition-transform duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[.99]"
    >
      <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-black text-sm transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}1f`, color }}>{n}</span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 mb-0.5">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
          <span className="p-title text-base">{title}</span>
          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color }} />
        </span>
        <span className="p-body text-xs block" style={{ lineHeight: 1.5 }}>{text}</span>
      </span>
    </Link>
  );
}

function Chip({ name, label, icon: Icon }) {
  return (
    <Link to={createPageUrl(name)}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--p-bg-2)', border: '0.5px solid var(--p-border)', color: 'var(--p-text)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--p-text-40)' }} /> {label}
    </Link>
  );
}

export default function HomeIntro() {
  return (
    <div className="p-reveal max-w-3xl mx-auto px-4 py-6">
      <p className="text-center text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--p-text-40)' }}>Comprendre en 30 secondes</p>
      <div className="grid md:grid-cols-3 gap-3 mb-7">
        <Step n="1" title="Prédis" icon={Vote} color="#2B5CE6" to="MaRepartition" text="Compose l'hémicycle et dis qui gouvernera le 27 octobre." />
        <Step n="2" title="Joue" icon={Gamepad2} color="#7A5F1A" to="Paris" text="Parie tes jetons, enchaîne les mini-jeux, grimpe au classement." />
        <Step n="3" title="Apprends" icon={BookOpen} color="#1A8C55" to="Learn" text="Comprends le scrutin, les partis et l'actu — sourcé, neutre, gratuit." />
      </div>

      {/* Les deux portes. Leur TITRE aussi était mort : « Jouer » et
          « Apprendre » nommaient les deux axes du site sans y mener, alors que
          les deux menus du header portent exactement ces mots et, eux, mènent
          quelque part. */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-card p-5" style={{ borderTop: '2px solid var(--p-blue)' }}>
          <Link to={createPageUrl('Paris')} className="group flex items-center gap-2 mb-0.5">
            <Gamepad2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--p-blue)' }} />
            <h3 className="p-title text-lg">Jouer</h3>
            <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--p-blue)' }} />
          </Link>
          <p className="p-body text-xs mb-3">Prédis, parie, teste-toi.</p>
          <div className="flex flex-wrap gap-2">{jeux.map(j => <Chip key={j.name} {...j} />)}</div>
        </div>
        <div className="p-card p-5" style={{ borderTop: '2px solid var(--p-gold)' }}>
          <Link to={createPageUrl('Learn')} className="group flex items-center gap-2 mb-0.5">
            <BookOpen className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--p-gold-text)' }} />
            <h3 className="p-title text-lg">Apprendre</h3>
            <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--p-gold-text)' }} />
          </Link>
          <p className="p-body text-xs mb-3">L'élection israélienne, décryptée.</p>
          <div className="flex flex-wrap gap-2">{apprentissages.map(a => <Chip key={a.name} {...a} />)}</div>
        </div>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--p-text-40)' }}>
        Nouveau ici ? <Link to={createPageUrl('ReglesDuJeu')} className="font-semibold" style={{ color: 'var(--p-blue)' }}>Comment ça marche →</Link>
      </p>
    </div>
  );
}

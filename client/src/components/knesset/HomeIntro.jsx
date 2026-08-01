import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Vote, Gamepad2, BookOpen, Compass, Landmark, Wind, ShieldCheck, HelpCircle, Zap, MapPin, Newspaper, UserCheck } from 'lucide-react';

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

function Step({ n, title, text, icon: Icon, color }) {
  return (
    <div className="p-card p-4 flex gap-3 items-start">
      <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-black text-sm" style={{ background: `${color}1f`, color }}>{n}</span>
      <div>
        <div className="flex items-center gap-1.5 mb-0.5"><Icon className="w-4 h-4" style={{ color }} /><span className="p-title text-base">{title}</span></div>
        <p className="p-body text-xs" style={{ lineHeight: 1.5 }}>{text}</p>
      </div>
    </div>
  );
}

function Chip({ name, label, icon: Icon }) {
  return (
    <Link to={createPageUrl(name)}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-border)', color: 'var(--p-text)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--p-text-40)' }} /> {label}
    </Link>
  );
}

export default function HomeIntro() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <p className="text-center text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--p-text-40)' }}>Comprendre en 30 secondes</p>
      <div className="grid md:grid-cols-3 gap-3 mb-7">
        <Step n="1" title="Prédis" icon={Vote} color="#2B5CE6" text="Compose l'hémicycle et dis qui gouvernera le 27 octobre." />
        <Step n="2" title="Joue" icon={Gamepad2} color="#7A5F1A" text="Parie tes jetons, enchaîne les mini-jeux, grimpe au classement." />
        <Step n="3" title="Apprends" icon={BookOpen} color="#1A8C55" text="Comprends le scrutin, les partis et l'actu — sourcé, neutre, gratuit." />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-card p-5" style={{ borderTop: '2px solid var(--p-blue)' }}>
          <div className="flex items-center gap-2 mb-0.5"><Gamepad2 className="w-5 h-5" style={{ color: 'var(--p-blue)' }} /><h3 className="p-title text-lg">Jouer</h3></div>
          <p className="p-body text-xs mb-3">Prédis, parie, teste-toi.</p>
          <div className="flex flex-wrap gap-2">{jeux.map(j => <Chip key={j.name} {...j} />)}</div>
        </div>
        <div className="p-card p-5" style={{ borderTop: '2px solid var(--p-gold)' }}>
          <div className="flex items-center gap-2 mb-0.5"><BookOpen className="w-5 h-5" style={{ color: 'var(--p-gold-text)' }} /><h3 className="p-title text-lg">Apprendre</h3></div>
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

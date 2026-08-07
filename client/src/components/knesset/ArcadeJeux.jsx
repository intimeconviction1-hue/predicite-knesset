import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Wind, Landmark, Compass, ShieldCheck, HelpCircle, ArrowRight, Gamepad2 } from 'lucide-react';

/**
 * L'ARCADE — les cinq jeux courts, posés à plat et cliquables.
 *
 * Ils n'existaient QUE dans un menu déroulant du header, sous un titre de
 * groupe « Mini-jeux ». Pour découvrir qu'on peut jouer à « Vrai ou Fake », il
 * fallait ouvrir « Jouer », descendre trois groupes, et lire. Un jeu qu'on ne
 * voit pas n'existe pas : les quatre jeux sans compte — les SEULS qu'un inconnu
 * arrivé par un lien partagé puisse essayer — étaient les mieux cachés du site.
 *
 * Honnêteté des promesses (vérifié dans le code, pas supposé) :
 *   · les quatre mini-jeux passent par useGuestGate : 3 parties en découverte
 *     SANS COMPTE, comptées globalement, tous jeux confondus (lib/useGuestGate.js,
 *     LIMIT = 3) — d'où la mention unique sous la bande, et pas « 3 parties »
 *     répétée sur chaque tuile, qui laisserait croire à 3 parties chacune ;
 *   · le Quiz ne passe PAS par ce mur : il se joue sans limite, mais les points
 *     ne sont crédités qu'à un compte connecté (QuizWidget).
 */

export const JEUX = [
  {
    name: 'SensDuVent',
    label: 'Le sens du vent',
    promesse: 'Monte ou descend ? Devine le mouvement d’une liste entre deux sondages.',
    duree: '2 min',
    icon: Wind,
    couleur: 'var(--p-blue)',
    texte: 'var(--p-blue)',
  },
  {
    name: 'FormeCoalition',
    label: 'Forme ta coalition',
    promesse: 'Assemble 61 sièges. Avec qui, et à quel prix politique ?',
    duree: '3 min',
    icon: Landmark,
    couleur: 'var(--p-gold)',
    texte: 'var(--p-gold-text)',
  },
  {
    name: 'Boussole',
    label: 'Quel parti te ressemble ?',
    promesse: 'Quelques questions, et la carte politique israélienne te situe.',
    duree: '4 min',
    icon: Compass,
    couleur: 'var(--p-green)',
    texte: 'var(--p-green-text)',
  },
  {
    name: 'VraiOuFake',
    label: 'Vrai ou Fake ?',
    promesse: 'Un chiffre, une affirmation. À toi de repérer celle qui cloche.',
    duree: '2 min',
    icon: ShieldCheck,
    couleur: 'var(--p-red)',
    texte: 'var(--p-red)',
  },
  {
    name: 'Quiz',
    label: 'Le quiz de la campagne',
    promesse: 'Six thèmes, trois niveaux. Le seul jeu où l’on gagne des points en apprenant.',
    duree: 'à ton rythme',
    icon: HelpCircle,
    couleur: 'var(--p-teal-text)',
    texte: 'var(--p-teal-text)',
  },
];

function TuileJeu({ jeu }) {
  const Icon = jeu.icon;
  return (
    <Link
      to={createPageUrl(jeu.name)}
      className="group relative flex flex-col rounded-2xl p-4 h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--p-card)',
        border: '0.5px solid var(--p-border)',
        boxShadow: 'var(--p-elev-1)',
      }}
    >
      {/* Lavis de couleur du jeu — chaque jeu a sa teinte, on la reconnaît avant
          d'avoir lu le titre. Il s'intensifie au survol. */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-24 pointer-events-none transition-opacity duration-300 opacity-70 group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 100% at 20% 0%, color-mix(in srgb, ${jeu.couleur} 18%, transparent), transparent 70%)` }} />
      {/* Filet de couleur en tête de tuile */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: jeu.couleur, opacity: 0.85 }} />

      <span className="relative flex items-center justify-between mb-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ background: `color-mix(in srgb, ${jeu.couleur} 14%, transparent)`, border: `0.5px solid color-mix(in srgb, ${jeu.couleur} 34%, transparent)` }}>
          <Icon className="w-5 h-5" style={{ color: jeu.texte }} />
        </span>
        <span className="text-[9.5px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
          style={{ color: 'var(--p-text-40)', border: '0.5px solid var(--p-border)' }}>
          {jeu.duree}
        </span>
      </span>

      <span className="relative block font-bold text-[15px] leading-tight mb-1.5"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
        {jeu.label}
      </span>
      <span className="relative block text-[12px] leading-snug mb-3" style={{ color: 'var(--p-text-60)' }}>
        {jeu.promesse}
      </span>

      <span className="relative mt-auto inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: jeu.texte }}>
        Jouer <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

/**
 * @param {string}  [exclure]  nom de page à retirer (pour la bande posée SOUS un
 *                             jeu : proposer de rejouer celui qu'on quitte serait
 *                             la seule suggestion inutile de la liste)
 * @param {boolean} [compact]  version resserrée, sans titre de section
 */
export default function ArcadeJeux({ exclure, compact = false, titre, className = '' }) {
  const jeux = JEUX.filter(j => j.name !== exclure);
  if (!jeux.length) return null;

  return (
    <section className={className} aria-label="Les mini-jeux">
      <div className="max-w-5xl mx-auto px-4">
        {!compact && (
          <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1 inline-flex items-center gap-1.5" style={{ color: 'var(--p-blue)' }}>
                <Gamepad2 className="w-3.5 h-3.5" /> L’arcade
              </p>
              <h2 className="p-title text-xl md:text-2xl">
                {titre || <>Cinq jeux courts. <span className="p-gradient-gold">Aucun n’est un test.</span></>}
              </h2>
            </div>
            <p className="text-[11px] max-w-[16rem] text-right hidden sm:block" style={{ color: 'var(--p-text-40)' }}>
              On y apprend le scrutin israélien en jouant — pas l’inverse.
            </p>
          </div>
        )}
        {compact && titre && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-3 inline-flex items-center gap-1.5" style={{ color: 'var(--p-blue)' }}>
            <Gamepad2 className="w-3.5 h-3.5" /> {titre}
          </p>
        )}

        {/* Mobile : rail qui défile. Desktop : tout tient sur une ligne. */}
        <div className="p-scroll-x flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-3
                        md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible md:mx-0 md:px-0">
          {jeux.map(j => (
            <div key={j.name} className="snap-start flex-shrink-0 w-[68vw] max-w-[240px] md:w-auto md:max-w-none">
              <TuileJeu jeu={j} />
            </div>
          ))}
        </div>

        <p className="text-[11px] mt-1" style={{ color: 'var(--p-text-40)' }}>
          Les quatre premiers s’essaient sans compte — 3 parties de découverte, tous jeux confondus. Le quiz, lui, est ouvert sans limite&nbsp;: seuls les points demandent un compte.
        </p>
      </div>
    </section>
  );
}

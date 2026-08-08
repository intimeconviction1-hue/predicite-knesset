import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowRight } from 'lucide-react';
import CoteTile from '@/components/knesset/CoteTile';

/**
 * LA CARTE RECTO/VERSO — la signature des « vases communicants ».
 *
 * Une FACE MARBRE (le fait : sobre, institutionnel, sourcé) qui se retourne sur
 * sa FACE JEU (ce que ce fait permet de jouer). « Toute info se joue, tout jeu
 * s'explique. »
 *
 * Ce qui change par rapport à la v1 :
 *
 *  · Le retournement se VOIT avant d'être découvert. La v1 ne l'annonçait que
 *    par une ligne de texte en bas ; une carte qui tourne doit avoir l'air de
 *    tourner. Un coin corné doré marque l'angle, il se déplie au survol.
 *
 *  · Le dos est un TAPIS DE JEU, plus une carte blanche. La v1 retournait du
 *    bleu institutionnel sur du blanc : deux faces du même registre, donc aucune
 *    bascule. Le contraste marbre → tapis est tout le propos.
 *
 *  · Les cotes du dos passent par <CoteTile> : même grammaire que le hub des
 *    paris, mouvement de cote compris.
 *
 *  · La zone cliquable n'est plus un role="button" contenant des liens (des
 *    éléments interactifs imbriqués, que les lecteurs d'écran annoncent mal).
 *    Le conteneur ne prend plus le focus ; un vrai <button> porte l'action, et
 *    la face cachée reste retirée de l'arbre (aria-hidden + inert).
 *
 * Honnêteté : `cotes` ne doit contenir que des marchés RÉELS portant sur le fait
 * affiché. Aucun rapprochement inventé — sans marché, le dos propose le geste
 * générique (composer sa Knesset, se tester) et rien d'autre.
 */

export default function RectoVersoCard({
  // ── Face Marbre : le fait
  badge, title, fact, nums = [], source,
  // ── Face Jeu : ce que le fait permet de jouer
  jeuKicker = 'Ce fait se joue',
  jeuTitre,
  cotes = [],        // [{ id, label, kicker, cote, to }] — marchés réels
  actions = [],      // [{ icon, label, hint, to }]
  hauteur = 330,
  className = '',
}) {
  const [flipped, setFlipped] = useState(false);
  const id = useId();

  const retourner = (e) => { e?.stopPropagation?.(); setFlipped(f => !f); };

  return (
    <div className={`p-flip ${className}`}>
      {/* Les deux faces sont en position absolue : la hauteur du conteneur ne
          vient donc QUE de `hauteur`, jamais du contenu. C'est ce qui garantit
          que le recto et le verso font exactement la même taille — une carte
          qui change de hauteur en tournant fait sauter toute la page. */}
      <div
        className="p-flip-inner"
        style={{ minHeight: hauteur, transform: flipped ? 'rotateY(180deg)' : 'none' }}
        onClick={retourner}
      >

        {/* ══ FACE MARBRE ══ */}
        <div
          id={`${id}-recto`}
          aria-hidden={flipped} inert={flipped ? '' : undefined}
          className="p-flip-face p-sheen rounded-2xl overflow-hidden flex flex-col cursor-pointer"
          style={{
            background: 'linear-gradient(160deg,#00259a,#0038B8)',
            border: '0.5px solid rgba(255,255,255,0.14)',
            boxShadow: '0 24px 50px -26px rgba(0,32,120,0.7)',
          }}
        >
          <div className="p-tricolor"><div /><div /><div /></div>

          {/* Menorah en filigrane */}
          <svg aria-hidden="true" viewBox="0 0 200 210" className="absolute -right-5 -top-2 w-44 pointer-events-none"
            style={{ opacity: 0.08, color: '#fff' }}
            fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M100,60 L100,176" /><path d="M54,60 A46,46 0 0 0 146,60" /><path d="M67,60 A33,33 0 0 0 133,60" /><path d="M80,60 A20,20 0 0 0 120,60" />
          </svg>

          {/* Coin corné doré — l'affordance du retournement. Un pli de carte à
              jouer : il dit « il y a quelque chose derrière » sans une phrase. */}
          <span aria-hidden="true" className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: 44, height: 44,
              background: 'linear-gradient(225deg, var(--p-gold-bright) 0%, var(--p-gold) 48%, transparent 49%)',
              opacity: 0.9,
            }} />

          <div className="relative p-5 flex flex-col h-full">
            {badge && (
              <span className="self-start text-[9.5px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)', color: '#fff' }}>
                {badge}
              </span>
            )}

            <h4 className="text-white font-black text-xl mt-3 mb-1.5 pr-6" style={{ fontFamily: 'var(--font-display)' }}>{title}</h4>
            {fact && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{fact}</p>}

            {nums.length > 0 && (
              <div className="flex gap-5 mt-4">
                {nums.map((x, i) => (
                  <div key={i}>
                    <div className="font-mono font-bold text-2xl leading-none" style={{ color: 'var(--p-gold-bright)' }}>{x.n}</div>
                    <div className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{x.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-4">
              {source && <p className="text-[11px] mb-2.5 leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>↳ {source}</p>}
              <button
                type="button"
                onClick={retourner}
                aria-pressed={flipped}
                aria-controls={`${id}-verso`}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98]"
                style={{ background: 'var(--p-grad-gold)', color: '#1A1408', boxShadow: '0 10px 24px -12px var(--p-gold-glow)' }}
              >
                <RotateCcw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-180" />
                Retourne la carte — ça se joue
              </button>
            </div>
          </div>
        </div>

        {/* ══ FACE JEU — le tapis ══ */}
        <div
          id={`${id}-verso`}
          aria-hidden={!flipped} inert={!flipped ? '' : undefined}
          className="p-flip-face p-flip-back rounded-2xl overflow-hidden flex flex-col cursor-pointer"
          style={{
            background: 'var(--p-jeu-surface)',
            border: '1px solid var(--p-gold-strong)',
            boxShadow: '0 24px 50px -26px var(--p-gold-glow)',
          }}
        >
          {/* halo d'ambiance du tapis */}
          <span aria-hidden="true" className="absolute pointer-events-none"
            style={{ width: 300, height: 300, left: '-22%', top: '-38%', borderRadius: '9999px', background: 'radial-gradient(circle,#D4AF37,transparent 70%)', opacity: 0.3, filter: 'blur(50px)' }} />

          <div className="relative p-5 flex flex-col h-full gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9.5px] font-mono uppercase tracking-widest" style={{ color: 'var(--p-gold-bright)' }}>◆ {jeuKicker}</span>
              <button
                type="button"
                onClick={retourner}
                aria-pressed={flipped}
                aria-controls={`${id}-recto`}
                className="group inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full transition-colors"
                style={{ color: 'var(--p-jeu-text)', border: '0.5px solid var(--p-jeu-brd)' }}
              >
                <RotateCcw className="w-3 h-3 transition-transform duration-500 group-hover:rotate-180" />
                le fait
              </button>
            </div>

            {jeuTitre && (
              <p className="text-white font-black text-[17px] leading-tight -mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{jeuTitre}</p>
            )}

            {/* Les cotes réelles du marché lié au fait */}
            {cotes.length > 0 && (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(cotes.length, 2)}, minmax(0,1fr))` }}>
                {cotes.map((c) => (
                  <div key={c.id} className="min-w-0" onClick={(e) => e.stopPropagation()}>
                    <CoteTile
                      registre="sombre" taille="sm"
                      kicker={c.kicker} label={c.label} cote={c.cote} to={c.to}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Les gestes annexes — apprendre, composer, se tester */}
            {actions.length > 0 && (
              <div className="grid gap-2">
                {actions.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <Link key={i} to={a.to} onClick={(e) => e.stopPropagation()}
                      className="group flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--p-jeu-tile)', border: '1px solid var(--p-jeu-brd)' }}>
                      {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-gold-bright)' }} />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-white leading-tight">{a.label}</span>
                        {a.hint && <span className="block text-[10.5px] mt-0.5" style={{ color: 'var(--p-jeu-text-lo)' }}>{a.hint}</span>}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--p-jeu-text-lo)' }} />
                    </Link>
                  );
                })}
              </div>
            )}

            <p className="text-[10.5px] mt-auto pt-1" style={{ color: 'var(--p-jeu-text-lo)' }}>
              ↳ chaque pari reste relié au fait qui l'a produit
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

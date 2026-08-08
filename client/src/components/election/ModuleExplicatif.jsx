import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * Accordéon explicatif — l'échafaudage commun à « Comment on vote à la Knesset »
 * et « Comment se forme un gouvernement ».
 *
 * Les deux existaient en deux fichiers (213 et 131 lignes) dont les 60 dernières
 * lignes étaient identiques au titre, à l'icône et au dégradé près : même
 * accordéon, même moteur de rendu de blocs. Toute retouche visuelle coûtait deux
 * éditions, et la deuxième finissait tôt ou tard par être oubliée — c'est déjà
 * arrivé, le moteur de blocs de la coalition n'avait jamais reçu les types
 * `stat`, `threshold-bar` et `seats-bar` ajoutés à celui de la Knesset.
 * Le contenu vit désormais dans regles-knesset.js et regles-coalition.js.
 *
 * TEINTE / ENCRE — chaque rubrique porte deux tokens, pas un.
 * C'est la doctrine déjà écrite dans globals.css : --p-gold en texte ne fait que
 * 1,95:1 de contraste et --p-green 4,26:1, tous deux sous le seuil AA. La teinte
 * sert au décor (pastille, filet, fond teinté), l'encre au texte lisible. Les
 * confondre remettrait des titres illisibles sur les deux pages que consulte
 * justement un visiteur qui découvre le site.
 */

/** Fond teinté et filet dérivés d'un seul token, via color-mix. */
const fond = (teinte) => `color-mix(in srgb, var(${teinte}) 8%, transparent)`;
const filet = (teinte) => `color-mix(in srgb, var(${teinte}) 30%, transparent)`;

function BlocContenu({ item }) {
  if (item.type === 'threshold-bar') {
    return (
      <div className="rounded-lg p-3.5" style={{ background: 'rgba(20,32,61,0.03)', border: '1px solid var(--p-border)' }}>
        <div className="relative h-2 rounded-full mb-3 mt-2" style={{ background: 'var(--p-border-hover)' }}>
          <div
            className="absolute top-0 h-full rounded-l-full"
            style={{ width: `${item.threshold * 4}%`, background: 'var(--p-red)', opacity: 0.35 }}
          />
          <div
            className="absolute -top-1 w-0.5 h-4"
            style={{ left: `${item.threshold * 4}%`, background: 'var(--p-text)' }}
          />
          {item.examples.map((ex, i) => (
            <div
              key={i}
              className="absolute -top-1.5 w-3 h-3 rounded-full border-2"
              style={{
                left: `calc(${Math.min(ex.pct * 4, 96)}% - 6px)`,
                background: ex.pass ? 'var(--p-green)' : 'var(--p-red)',
                borderColor: 'var(--p-card)',
              }}
              title={`${ex.label} — ${ex.pct}%`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] mb-2.5" style={{ color: 'var(--p-text-40)' }}>
          <span>0%</span>
          <span className="font-bold" style={{ color: 'var(--p-text)' }}>seuil {item.threshold}%</span>
          <span>25%</span>
        </div>
        <div className="space-y-1">
          {item.examples.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ex.pass ? 'var(--p-green)' : 'var(--p-red)' }} />
              <span style={{ color: 'var(--p-text-60)' }}>{ex.label} ({ex.pct}%)</span>
              <span className="ml-auto font-semibold" style={{ color: ex.pass ? 'var(--p-green-text)' : 'var(--p-red)' }}>
                {ex.pass ? 'entre à la Knesset' : 'aucun siège'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (item.type === 'seats-bar') {
    const majorityPct = (item.majority / item.total) * 100;
    return (
      <div className="rounded-lg p-3.5" style={{ background: 'rgba(20,32,61,0.03)', border: '1px solid var(--p-border)' }}>
        <div className="relative h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--p-border-hover)' }}>
          <div className="h-full" style={{ width: `${majorityPct}%`, background: 'linear-gradient(90deg,var(--p-blue),var(--p-blue-lift))' }} />
          <div className="h-full flex-1" style={{ background: 'linear-gradient(90deg,var(--p-red),#E24A63)', opacity: 0.5 }} />
          <div className="absolute -top-1 w-0.5 h-5" style={{ left: `${majorityPct}%`, background: 'var(--p-text)' }} />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-2" style={{ color: 'var(--p-text-40)' }}>
          <span>0</span>
          <span className="font-bold" style={{ color: 'var(--p-text)' }}>{item.majority} = majorité</span>
          <span>{item.total} sièges</span>
        </div>
      </div>
    );
  }
  if (item.type === 'stat') {
    return (
      <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'rgba(20,32,61,0.04)', border: '1px solid var(--p-border)' }}>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--p-text-40)' }}>{item.label}</p>
          <p className="text-sm font-bold" style={{ color: 'var(--p-text)' }}>{item.value}</p>
        </div>
      </div>
    );
  }
  if (item.type === 'highlight') {
    return (
      <div className="rounded-lg p-3" style={{ background: 'var(--p-gold-faint)', border: '1px solid var(--p-gold-border)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--p-gold-text)' }}>{item.label}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{item.value}</p>
      </div>
    );
  }
  return <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{item.value}</p>;
}

export default function ModuleExplicatif({ entete, regles, compact = false }) {
  const [openId, setOpenId] = useState(compact ? null : regles[0]?.id ?? null);
  const IconeEntete = entete.icon;

  return (
    <div className={compact ? '' : 'rounded-2xl border overflow-hidden'} style={compact ? {} : { borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
      {!compact && (
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: entete.degrade }}>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <IconeEntete className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{entete.title}</h2>
            {/* /90 et non /60 : à 12 px sur le bout clair du dégradé bleu, du
                blanc à 60 % ne fait que 3,0:1 (mesuré) — la ligne qui explique
                à quoi sert le module était moins lisible que le module. */}
            <p className="text-white/90 text-xs">{entete.subtitle}</p>
          </div>
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'divide-y'} style={compact ? {} : { borderColor: 'var(--p-border)' }}>
        {regles.map((regle) => {
          const Icon = regle.icon;
          const isOpen = openId === regle.id;

          return (
            <div
              key={regle.id}
              className={compact ? 'rounded-xl border overflow-hidden' : ''}
              style={compact ? { background: fond(regle.teinte), borderColor: filet(regle.teinte) } : {}}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : regle.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(20,32,61,0.04)]"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                  style={{ background: fond(regle.teinte), borderColor: filet(regle.teinte) }}
                >
                  <Icon className="w-4 h-4" style={{ color: `var(${regle.encre})` }} />
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: `var(${regle.encre})` }}>{regle.title}</span>
                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--p-text-25)' }} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--p-border)' }}>
                      {regle.content.map((item, i) => (
                        <BlocContenu key={i} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

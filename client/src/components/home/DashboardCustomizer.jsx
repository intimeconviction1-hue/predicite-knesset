import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X, Eye, EyeOff } from 'lucide-react';

export const DEFAULT_WIDGETS = {
  comprendre_sondages: { label: 'Sondages du jour', axis: 'comprendre' },
  comprendre_spotlight: { label: 'Rendez-vous du jour', axis: 'comprendre' },
  comprendre_villes: { label: 'Villes suivies', axis: 'comprendre' },
  pronostiquer_stats: { label: 'Mes stats & rôle', axis: 'pronostiquer' },
  pronostiquer_classement: { label: 'Classement citoyen', axis: 'pronostiquer' },
  pronostiquer_activite: { label: 'Activité récente', axis: 'pronostiquer' },
  voter_phase: { label: 'Phase de campagne', axis: 'voter' },
  voter_apprendre: { label: 'Apprendre la République', axis: 'voter' },
};

const AXIS_META = {
  comprendre: { label: 'Comprendre', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  pronostiquer: { label: 'Pronostiquer', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  voter: { label: 'Voter', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export function useWidgetVisibility() {
  const [hidden, setHidden] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('parivote_hidden_widgets') || '[]');
    } catch { return []; }
  });

  const isVisible = (id) => !hidden.includes(id);

  const toggle = (id) => {
    setHidden(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('parivote_hidden_widgets', JSON.stringify(next));
      return next;
    });
  };

  const resetAll = () => {
    setHidden([]);
    localStorage.removeItem('parivote_hidden_widgets');
  };

  return { isVisible, toggle, hidden, resetAll };
}

export default function DashboardCustomizer({ isVisible, toggle, hidden, resetAll }) {
  const [open, setOpen] = useState(false);

  const byAxis = Object.entries(DEFAULT_WIDGETS).reduce((acc, [id, w]) => {
    if (!acc[w.axis]) acc[w.axis] = [];
    acc[w.axis].push({ id, ...w });
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors text-sm"
      >
        <Settings2 className="w-3.5 h-3.5" />
        Personnaliser
        {hidden.length > 0 && (
          <span className="bg-[#034EA2] text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{hidden.length}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-slate-800 text-sm">Personnaliser le dashboard</span>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(byAxis).map(([axis, widgets]) => {
                  const meta = AXIS_META[axis];
                  return (
                    <div key={axis}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${meta.color}`}>
                        {meta.label}
                      </p>
                      <div className="space-y-1">
                        {widgets.map(({ id, label }) => {
                          const visible = isVisible(id);
                          return (
                            <button
                              key={id}
                              onClick={() => toggle(id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                                visible
                                  ? `${meta.bg} ${meta.border} ${meta.color}`
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <span>{label}</span>
                              {visible
                                ? <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                                : <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                              }
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hidden.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100">
                  <button
                    onClick={() => { resetAll(); setOpen(false); }}
                    className="text-xs text-slate-500 hover:text-[#034EA2] transition-colors"
                  >
                    Tout réafficher
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
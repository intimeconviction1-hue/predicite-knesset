import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function JustificationField({ value, onChange, candidateName }) {
  return (
    <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-[#034EA2]" />
        <span className="text-sm font-semibold text-slate-700">Justifiez votre choix</span>
        <span className="text-xs text-[#C8102E] font-medium">obligatoire</span>
      </div>
      <p className="text-xs text-slate-500 mb-2">
        Pourquoi pensez-vous que {candidateName || 'ce candidat'} va l'emporter ? Votre analyse vous rapporte des points bonus.
      </p>
      <Textarea
        placeholder="Ex: La dynamique locale, les résultats précédents, le contexte national..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] text-sm resize-none"
      />
      <div className="flex justify-between mt-2">
        <span className="text-xs text-slate-400">Min. 20 caractères</span>
        <span className={`text-xs font-medium ${(value?.length || 0) >= 20 ? 'text-green-600' : 'text-slate-400'}`}>
          {value?.length || 0}/20
        </span>
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PollBar({ candidate_name, candidate_color, percentage, is_leader = false, show_delta = false, delta = 0 }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-40 shrink-0 flex items-center gap-1.5">
        {is_leader && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
        <span className="text-sm font-medium text-gray-800 overflow-hidden" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '152px' }}>{candidate_name}</span>
      </div>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: candidate_color || '#2B5CE6' }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(0, Math.min(100, percentage || 0))}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        />
      </div>
      <div className="w-14 flex items-center justify-end gap-1.5 shrink-0">
        <span className="font-mono font-bold text-sm text-gray-900">{percentage}%</span>
        {show_delta && delta !== 0 && (
          delta > 0
            ? <span className="text-green-600 text-xs flex items-center"><TrendingUp className="w-3 h-3" />+{delta}</span>
            : <span className="text-red-500 text-xs flex items-center"><TrendingDown className="w-3 h-3" />{delta}</span>
        )}
        {show_delta && delta === 0 && <Minus className="w-3 h-3 text-gray-400" />}
      </div>
    </div>
  );
}
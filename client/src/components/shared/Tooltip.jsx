import React, { useState, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  const posClass = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  const arrowClass = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-[var(--p-card)] border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--p-card)] border-x-transparent border-t-transparent border-4',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-[var(--p-card)] border-y-transparent border-r-transparent border-4',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-[var(--p-card)] border-y-transparent border-l-transparent border-4',
  }[position] || 'top-full left-1/2 -translate-x-1/2 border-t-[var(--p-card)] border-x-transparent border-b-transparent border-4';

  const yOffset = position === 'bottom' ? -4 : 4;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: yOffset }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: yOffset }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-max max-w-[220px] px-3 py-2 rounded-lg text-xs text-white font-medium leading-snug pointer-events-none ${posClass}`}
            style={{ background: 'var(--p-card)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
          >
            {text}
            <span className={`absolute ${arrowClass}`} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
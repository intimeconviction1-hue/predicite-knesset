export const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};

export const barGrow = (targetWidth) => ({
  hidden:  { width: '0%' },
  visible: { width: `${targetWidth}%`, transition: { duration: 0.7, ease: 'easeOut', delay: 0.2 } },
});

export const pulseOnUpdate = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.06, 1], transition: { duration: 0.3 } },
};
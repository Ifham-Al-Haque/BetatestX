export const TRANSITIONS = {
  quick: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
  smooth: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  modal: { type: 'spring', damping: 24, stiffness: 260 },
};

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { ...TRANSITIONS.smooth, delay },
});

export const safeMotion = (prefersReducedMotion, full, reduced = {}) =>
  prefersReducedMotion ? reduced : full;

import type { Transition } from 'motion/react';

/** House spring (§9): explains a change, never decorates. */
export const spring: Transition = { type: 'spring', stiffness: 300, damping: 30 };
export const springSoft: Transition = { type: 'spring', stiffness: 220, damping: 28 };
export const fade: Transition = { duration: 0.1 };

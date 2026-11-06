import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// The hero's one orchestrated moment: a plate cylinder whose halftone dots print in from the lower right
// (small to large, as in the UniDots mark) once on load, then it turns slowly. Decorative only.
const SIZE = 13;
const STEP = 34;

const HeroPlate = ({ className = '' }) => {
  const reduce = useReducedMotion();
  const dots = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const cx = c * STEP + STEP / 2;
      const cy = r * STEP + STEP / 2;
      const d = Math.hypot(cx - (SIZE * STEP) / 2, cy - (SIZE * STEP) / 2);
      if (d > (SIZE * STEP) / 2 - 8) continue;
      const radius = 1.5 + ((r + c) / (2 * (SIZE - 1))) * 13;
      // order of appearance: from the top-left corner outward
      const delay = 0.15 + ((r + c) / (2 * (SIZE - 1))) * 1.1;
      dots.push({ key: `${r}-${c}`, cx, cy, radius, delay });
    }
  }
  return (
    <motion.svg
      viewBox={`0 0 ${SIZE * STEP} ${SIZE * STEP}`}
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={reduce ? undefined : { duration: 120, ease: 'linear', repeat: Infinity }}
    >
      {dots.map((d) => (
        <motion.circle
          key={d.key}
          cx={d.cx}
          cy={d.cy}
          initial={reduce ? { r: d.radius } : { r: 0 }}
          animate={{ r: d.radius }}
          transition={{ delay: reduce ? 0 : d.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      <circle cx={(SIZE * STEP) / 2} cy={(SIZE * STEP) / 2} r={(SIZE * STEP) / 2 - 3} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.5" />
    </motion.svg>
  );
};

export default HeroPlate;

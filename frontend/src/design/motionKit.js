import React, { useEffect, useRef, useState } from 'react';

// Counts from 0 up to `value` once when it first appears (and tweens on later changes). Respects reduced motion.
export const CountUp = ({ value, duration = 700 }) => {
  const n = Number(value);
  const [shown, setShown] = useState(Number.isFinite(n) ? 0 : value);
  const from = useRef(0);
  useEffect(() => {
    if (!Number.isFinite(n)) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(n);
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(a + (n - a) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = n;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, duration]);
  return <span className="ud-num">{shown}</span>;
};

export const Skeleton = ({ width = '100%', height = 16, style }) => <div className="ud-skel" style={{ width, height, ...style }} aria-hidden="true" />;

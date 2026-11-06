import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Each page eases in when you navigate (fade and a small rise). Skipped for reduced motion.
const PageTransition = ({ children }) => {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      className="ud-page"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

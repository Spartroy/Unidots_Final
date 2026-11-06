import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import FlexoPress from './FlexoPress';
import { useLanguage } from '../../context/LanguageContext';

const STEPS = [1, 2, 3, 4];

// The story of an order, told by a press that runs as you scroll. The section is tall and its stage is sticky,
// so scrolling "feeds" the machine. With reduced motion it is a plain, fully printed picture with the same text.
const PressSection = () => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [step, setStep] = useState(1);
  const staticProgress = useMotionValue(1);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const progress = reduce ? staticProgress : scrollYProgress;

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = v < 0.22 ? 1 : v < 0.5 ? 2 : v < 0.82 ? 3 : 4;
    setStep((cur) => (cur === next ? cur : next));
  });

  if (reduce) {
    return (
      <section id="process" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.process.title')}</h2>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4"><FlexoPress progress={progress} /></div>
          <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((n) => (
              <li key={n}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-base font-bold text-white">{n}</span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{t(`landing.process.s${n}.title`)}</h3>
                <p className="mt-1 text-gray-600">{t(`landing.process.s${n}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section id="process" ref={ref} className="relative scroll-mt-20" style={{ height: '420vh' }} aria-label={t('landing.process.title')}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-gray-50">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{t('landing.process.title')}</h2>
            <div className="mt-8 min-h-[170px]" aria-live="polite">
              <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-700 text-lg font-bold text-white">{step}</span>
                <h3 className="mt-4 text-2xl font-semibold text-gray-900">{t(`landing.process.s${step}.title`)}</h3>
                <p className="mt-2 max-w-md text-lg text-gray-700">{t(`landing.process.s${step}.body`)}</p>
              </motion.div>
            </div>
            <div className="mt-6 flex gap-2" aria-hidden="true">
              {STEPS.map((n) => (
                <span key={n} className={`h-1.5 w-10 rounded-full transition-colors duration-500 ${n <= step ? 'bg-primary-700' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
              <FlexoPress progress={progress} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PressSection;

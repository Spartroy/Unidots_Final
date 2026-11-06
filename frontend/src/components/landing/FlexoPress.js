import React from 'react';
import { motion, useTransform } from 'framer-motion';

/**
 * A four-colour flexographic press drawn in SVG and driven by one number: `progress` (0 to 1).
 * As progress grows the web (film) runs left to right, the plate and impression cylinders turn,
 * each colour station prints its halftone dots onto the film, the reels change size, and the dryer glows.
 * `progress` is a framer-motion MotionValue (scroll position on the landing page).
 */

const W = 1200;
const H = 520;
const FILM_TOP = 300;
const FILM_BOTTOM = 380;
const FILM_LEFT = 150;
const FILM_RIGHT = 1060;
const STATIONS = [
  { x: 300, color: '#00aeef', name: 'Cyan', start: 0.2 },
  { x: 470, color: '#ec008c', name: 'Magenta', start: 0.32 },
  { x: 640, color: '#f5c400', name: 'Yellow', start: 0.44 },
  { x: 810, color: '#1b2733', name: 'Black', start: 0.56 },
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Halftone dots that grow along the web, as in the UniDots mark
const dotPattern = (id, color, dx, dy) => (
  <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform={`translate(${dx} ${dy})`}>
    <circle cx="9" cy="9" r="4.2" fill={color} />
  </pattern>
);

const Cylinder = ({ cx, cy, r, rotate, color = '#9fb1c0', dots = false, stripe = false }) => (
  <motion.g style={{ rotate, originX: 0.5, originY: 0.5 }}>
    <circle cx={cx} cy={cy} r={r} fill="var(--bg-card)" stroke="var(--border-control)" strokeWidth="3" />
    {dots &&
      Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const rr = 2.2 + (i / 14) * 4.6;
        return <circle key={i} cx={cx + Math.cos(a) * (r - 13)} cy={cy + Math.sin(a) * (r - 13)} r={rr} fill={color} />;
      })}
    {stripe && <path d={`M ${cx - r + 6} ${cy} L ${cx + r - 6} ${cy}`} stroke={color} strokeWidth="5" strokeLinecap="round" />}
    {!dots && !stripe &&
      Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={cx + Math.cos(a) * (r - 9)} y1={cy + Math.sin(a) * (r - 9)} x2={cx + Math.cos(a) * (r - 2)} y2={cy + Math.sin(a) * (r - 2)} stroke={color} strokeWidth="3" />;
      })}
    <circle cx={cx} cy={cy} r="5" fill="var(--text-muted)" />
  </motion.g>
);

const FlexoPress = ({ progress, labels = {} }) => {
  // Everything below is derived from the single progress value
  const platTurn = useTransform(progress, [0, 1], [0, 1440]);
  const aniloxTurn = useTransform(progress, [0, 1], [0, -2160]);
  const impressTurn = useTransform(progress, [0, 1], [0, -1440]);
  const unwindR = useTransform(progress, [0, 1], [56, 26]);
  const rewindR = useTransform(progress, [0, 1], [22, 56]);
  const sprocket = useTransform(progress, [0, 1], [0, -900]);
  const dryerGlow = useTransform(progress, [0.55, 0.75, 1], [0, 0.55, 0.9]);
  const widths = STATIONS.map((s) => useTransform(progress, (p) => clamp01((p - s.start) / (1 - s.start)) * (FILM_RIGHT - s.x + 6))); // eslint-disable-line react-hooks/rules-of-hooks
  const highlight = STATIONS.map((s) => useTransform(progress, (p) => (p > s.start - 0.02 && p < s.start + 0.14 ? 1 : 0))); // eslint-disable-line react-hooks/rules-of-hooks

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.aria || 'A four-colour flexographic press printing a web of film'} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        {STATIONS.map((s, i) => dotPattern(`dots-${i}`, s.color, i * 4, (i % 2) * 6))}
        {STATIONS.map((s, i) => (
          <clipPath key={s.name} id={`reveal-${i}`}>
            <motion.rect x={s.x - 6} y={FILM_TOP} height={FILM_BOTTOM - FILM_TOP} width={widths[i]} />
          </clipPath>
        ))}
      </defs>

      {/* Frame of the machine */}
      <rect x="20" y="20" width={W - 40} height={H - 40} rx="18" fill="none" stroke="var(--border)" strokeWidth="2" />

      {/* Unwind and rewind reels */}
      <g>
        <motion.circle cx="86" cy="340" r={unwindR} fill="var(--selected)" stroke="var(--border-control)" strokeWidth="3" />
        <circle cx="86" cy="340" r="14" fill="var(--bg-card)" stroke="var(--border-control)" strokeWidth="3" />
        <motion.circle cx="1114" cy="340" r={rewindR} fill="var(--selected)" stroke="var(--border-control)" strokeWidth="3" />
        <circle cx="1114" cy="340" r="14" fill="var(--bg-card)" stroke="var(--border-control)" strokeWidth="3" />
      </g>

      {/* The web (film) */}
      <rect x={FILM_LEFT - 70} y={FILM_TOP} width={FILM_RIGHT - FILM_LEFT + 140} height={FILM_BOTTOM - FILM_TOP} fill="var(--bg-card)" stroke="var(--border-control)" strokeWidth="2" />
      <motion.line x1={FILM_LEFT - 70} x2={FILM_RIGHT + 70} y1={FILM_TOP + 7} y2={FILM_TOP + 7} stroke="var(--border-control)" strokeWidth="3" strokeDasharray="6 14" style={{ strokeDashoffset: sprocket }} />
      <motion.line x1={FILM_LEFT - 70} x2={FILM_RIGHT + 70} y1={FILM_BOTTOM - 7} y2={FILM_BOTTOM - 7} stroke="var(--border-control)" strokeWidth="3" strokeDasharray="6 14" style={{ strokeDashoffset: sprocket }} />

      {/* Printed colours, revealed station by station */}
      {STATIONS.map((s, i) => (
        <g key={s.name} clipPath={`url(#reveal-${i})`}>
          <rect x={s.x - 6} y={FILM_TOP + 14} width={FILM_RIGHT - s.x + 6} height={FILM_BOTTOM - FILM_TOP - 28} fill={`url(#dots-${i})`} />
        </g>
      ))}

      {/* Dryer */}
      <g>
        <rect x="880" y="214" width="150" height="80" rx="10" fill="var(--selected)" stroke="var(--border-control)" strokeWidth="2" />
        <motion.rect x="888" y="222" width="134" height="64" rx="6" fill="#f59e0b" style={{ opacity: dryerGlow }} />
        {[0, 1, 2].map((i) => (
          <motion.path key={i} d={`M ${910 + i * 38} 276 q 8 -12 0 -24 q -8 -12 0 -24`} fill="none" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 7" style={{ strokeDashoffset: sprocket }} />
        ))}
      </g>

      {/* Print stations: anilox roller, plate cylinder, impression cylinder */}
      {STATIONS.map((s, i) => (
        <g key={s.name}>
          <Cylinder cx={s.x} cy={137} r={38} rotate={aniloxTurn} color={s.color} />
          <Cylinder cx={s.x} cy={235} r={60} rotate={platTurn} color={s.color} dots />
          <Cylinder cx={s.x} cy={445} r={60} rotate={impressTurn} color="var(--text-muted)" stripe />
          <motion.circle cx={s.x} cy={235} r={66} fill="none" stroke={s.color} strokeWidth="4" style={{ opacity: highlight[i] }} />
          <text x={s.x} y={H - 24} textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--text)">
            {labels[s.name] || s.name}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default FlexoPress;

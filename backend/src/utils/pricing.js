// Pure pricing helpers (no database access), so they are easy to test.

const THICKNESS_KEYS = { 1.14: 't114', 1.7: 't170', 2.54: 't254' };

export const rateKeyForThickness = (thickness) => THICKNESS_KEYS[Number(thickness)] || null;

// Plate area in square centimetres, including repeat counts. Dimensions may be in mm, cm or inch.
export const areaCm2 = (dimensions = {}) => {
  const width = parseFloat(dimensions.width);
  const height = parseFloat(dimensions.height);
  if (!(width > 0) || !(height > 0)) return 0;
  const toCm = { mm: 0.1, cm: 1, inch: 2.54 }[dimensions.unit || 'mm'] ?? 0.1;
  const wRep = Math.max(1, parseInt(dimensions.widthRepeatCount, 10) || 1);
  const hRep = Math.max(1, parseInt(dimensions.heightRepeatCount, 10) || 1);
  return width * toCm * wRep * (height * toCm * hRep);
};

export const areaM2 = (dimensions) => areaCm2(dimensions) / 10000;

/**
 * Suggested quote from the price list: area (cm²) x number of colors x rate for the plate thickness,
 * never below the minimum charge. Returns { amount, breakdown, reason } where reason explains a zero.
 */
export const suggestQuote = (order, priceList) => {
  const spec = order?.specifications || {};
  const area = areaCm2(spec.dimensions);
  const colors = Math.max(1, Number(spec.colors) || 1);
  const key = rateKeyForThickness(spec.materialThickness);
  const rate = key ? Number(priceList?.ratePerCm2PerColor?.[key]) || 0 : 0;
  const minimumCharge = Number(priceList?.minimumCharge) || 0;

  if (!area) return { amount: 0, reason: 'missing-size', breakdown: { area, colors, rate, minimumCharge } };
  if (!rate) return { amount: 0, reason: 'missing-rate', breakdown: { area, colors, rate, minimumCharge } };

  const raw = area * colors * rate;
  const amount = Math.round(Math.max(raw, minimumCharge) * 100) / 100;
  return { amount, reason: null, breakdown: { area, colors, rate, minimumCharge, raw: Math.round(raw * 100) / 100 } };
};

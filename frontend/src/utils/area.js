// Plate area from an order's dimensions, in square metres. Respects the unit (mm, cm, inch) and repeat counts.
// (The old prepress screen treated every size as centimetres, so solvent use was wrong for millimetre orders.)
const TO_METRES = { mm: 0.001, cm: 0.01, inch: 0.0254 };

export const areaM2 = (dimensions = {}) => {
  const w = parseFloat(dimensions.width);
  const h = parseFloat(dimensions.height);
  if (!(w > 0) || !(h > 0)) return 0;
  const k = TO_METRES[dimensions.unit || 'mm'] ?? TO_METRES.mm;
  const wr = Math.max(1, parseInt(dimensions.widthRepeatCount, 10) || 1);
  const hr = Math.max(1, parseInt(dimensions.heightRepeatCount, 10) || 1);
  return w * k * wr * (h * k * hr);
};

export const SOLVENT_LITERS_PER_M2 = 10;
export const solventLiters = (m2) => Math.round(m2 * SOLVENT_LITERS_PER_M2 * 100) / 100;

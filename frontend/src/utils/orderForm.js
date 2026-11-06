// Pure rules for the new-order form (kept apart from the screen so they can be tested).

export const COLORS = [
  { value: 'Cyan', swatch: '#00B7EB' },
  { value: 'Magenta', swatch: '#E4007C' },
  { value: 'Yellow', swatch: '#FFD500' },
  { value: 'Black', swatch: '#111111' },
  { value: 'CMYK Combined', swatch: 'conic-gradient(#00B7EB, #E4007C, #FFD500, #111111, #00B7EB)' },
  { value: 'Red', swatch: '#D92D20' },
  { value: 'Blue', swatch: '#1D4ED8' },
  { value: 'Green', swatch: '#15803D' },
  { value: 'Golden', swatch: '#D4A017' },
  { value: 'Silver', swatch: '#B8BCC2' },
  { value: 'White', swatch: '#FFFFFF' },
  { value: 'Other', swatch: 'repeating-linear-gradient(45deg, #E5E7EB, #E5E7EB 3px, #FFFFFF 3px, #FFFFFF 6px)' },
];

export const PACKAGE_TYPES = ['Central Seal', '2 Side Seal', '3 Side Seal', 'Custom Pouch', 'Label', 'Other'];
export const MATERIALS = ['Flint', 'Strong', 'Taiwan', 'Other'];
export const THICKNESSES = [1.14, 1.7, 2.54];
export const PRINTING_MODES = ['Surface Printing', 'Reverse Printing'];

const filled = (list) => (list || []).filter((c) => String(c).trim() !== '');

/** CMYK Combined counts as four colours; every other colour, and every custom colour, counts as one. Minimum 1. */
export const colorCount = (usedColors = [], customColors = []) => {
  const cmyk = usedColors.includes('CMYK Combined') ? 4 : 0;
  const others = usedColors.filter((c) => c !== 'CMYK Combined').length;
  return Math.max(cmyk + others + filled(customColors).length, 1);
};

const FACTOR = { 1.14: 0.75, 1.7: 0.85, 2.54: 0.95 };

/** Estimated price in EGP: total area x colours x material factor. 0 until a size is entered. */
export const estimatePrice = (spec) => {
  const d = spec?.dimensions || {};
  const w = parseFloat(d.width);
  const h = parseFloat(d.height);
  if (!(w > 0) || !(h > 0)) return 0;
  const area = w * (parseInt(d.widthRepeatCount, 10) || 1) * h * (parseInt(d.heightRepeatCount, 10) || 1);
  const factor = FACTOR[Number(spec.materialThickness)] ?? 0.77;
  return Math.round(area * colorCount(spec.usedColors, spec.customColors) * factor * 100) / 100;
};

/** Returns a map of field -> error key for one step (1 = basics, 2 = specifications). */
export const validateStep = (step, form) => {
  const e = {};
  const sp = form.specifications;
  if (step === 1 && !form.title.trim()) e.title = 'wizard.err.name';
  if (step === 2) {
    if (!(parseFloat(sp.dimensions.width) > 0 && parseFloat(sp.dimensions.height) > 0)) e.size = 'wizard.err.size';
    if (!sp.material || !sp.materialThickness) e.material = 'wizard.err.material';
    if (sp.usedColors.length === 0 && filled(sp.customColors).length === 0) e.colors = 'wizard.err.colors';
  }
  return e;
};

export const emptyForm = () => ({
  title: '',
  description: '',
  orderType: 'New Order',
  specifications: {
    packageType: 'Other',
    dimensions: { width: '', height: '', widthRepeatCount: 1, heightRepeatCount: 1, unit: 'mm' },
    colors: 1,
    usedColors: [],
    customColors: [],
    printingMode: 'Surface Printing',
    material: 'Flint',
    materialThickness: 1.7,
    distortion: '',
    jobPath: '',
    additionalDetails: '',
  },
});

/** Copy the specifications of an earlier order into a fresh form. */
export const formFromOrder = (o) => {
  const base = emptyForm();
  const s = o.specifications || {};
  const d = s.dimensions || {};
  return {
    ...base,
    title: o.title || '',
    description: o.description || '',
    orderType: 'Existing',
    specifications: {
      ...base.specifications,
      packageType: s.packageType || base.specifications.packageType,
      dimensions: { width: d.width ?? '', height: d.height ?? '', widthRepeatCount: d.widthRepeatCount ?? 1, heightRepeatCount: d.heightRepeatCount ?? 1, unit: d.unit || 'mm' },
      colors: s.colors || 1,
      usedColors: s.usedColors || [],
      customColors: s.customColors || [],
      printingMode: s.printingMode || base.specifications.printingMode,
      material: s.material || base.specifications.material,
      materialThickness: s.materialThickness || base.specifications.materialThickness,
      distortion: s.distortion ?? '',
      jobPath: s.jobPath || '',
      additionalDetails: s.additionalDetails || '',
    },
  };
};

import { colorCount, estimatePrice, validateStep, emptyForm, formFromOrder } from './orderForm';

describe('colorCount', () => {
  test('CMYK Combined counts as four, others as one, never below one', () => {
    expect(colorCount([], [])).toBe(1);
    expect(colorCount(['CMYK Combined'], [])).toBe(4);
    expect(colorCount(['CMYK Combined', 'Red'], ['Navy', '  '])).toBe(6);
  });
});

describe('estimatePrice', () => {
  const spec = (over = {}) => ({ dimensions: { width: 100, height: 200, widthRepeatCount: 2, heightRepeatCount: 1 }, usedColors: ['Red', 'Blue'], customColors: [], materialThickness: 1.7, ...over });
  test('is zero until a size is entered', () => {
    expect(estimatePrice(spec({ dimensions: { width: '', height: '' } }))).toBe(0);
  });
  test('multiplies area, colours and the material factor', () => {
    expect(estimatePrice(spec())).toBe(100 * 2 * 200 * 2 * 0.85);
  });
  test('uses the thickness factor', () => {
    expect(estimatePrice(spec({ materialThickness: 1.14 }))).toBe(100 * 2 * 200 * 2 * 0.75);
  });
});

describe('validateStep', () => {
  test('step 1 needs a name', () => {
    expect(validateStep(1, emptyForm())).toEqual({ title: 'wizard.err.name' });
    expect(validateStep(1, { ...emptyForm(), title: 'Pouch' })).toEqual({});
  });
  test('step 2 needs a size and a colour', () => {
    expect(Object.keys(validateStep(2, emptyForm())).sort()).toEqual(['colors', 'size']);
    const f = emptyForm();
    f.specifications.dimensions.width = 10;
    f.specifications.dimensions.height = 10;
    f.specifications.customColors = ['Navy'];
    expect(validateStep(2, f)).toEqual({});
  });
});

describe('formFromOrder', () => {
  test('copies specifications and marks the order as existing', () => {
    const f = formFromOrder({ title: 'Rice', specifications: { dimensions: { width: 5, height: 6 }, usedColors: ['Red'] } });
    expect(f.title).toBe('Rice');
    expect(f.orderType).toBe('Existing');
    expect(f.specifications.dimensions.width).toBe(5);
    expect(f.specifications.usedColors).toEqual(['Red']);
  });
});

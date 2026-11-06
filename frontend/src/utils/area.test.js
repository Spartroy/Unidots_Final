import { areaM2, solventLiters } from './area';

test('area respects the unit and the repeat counts', () => {
  expect(areaM2({ width: 1000, height: 1000, unit: 'mm' })).toBeCloseTo(1, 6);
  expect(areaM2({ width: 100, height: 100, unit: 'cm' })).toBeCloseTo(1, 6);
  expect(areaM2({ width: 288, height: 247, unit: 'mm' })).toBeCloseTo(0.0711, 4);
  expect(areaM2({ width: 50, height: 50, unit: 'cm', widthRepeatCount: 2, heightRepeatCount: 2 })).toBeCloseTo(1, 6);
  expect(areaM2({ width: 0, height: 5 })).toBe(0);
  expect(areaM2(undefined)).toBe(0);
});

test('solvent needed is ten litres per square metre', () => {
  expect(solventLiters(0.854)).toBe(8.54);
  expect(solventLiters(0)).toBe(0);
});

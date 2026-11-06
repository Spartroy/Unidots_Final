import en from './en';
import ar from './ar';
import landingEn from './landing.en';
import landingAr from './landing.ar';

const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');

const pairs = [
  ['app', en, ar],
  ['landing', landingEn, landingAr],
];

describe.each(pairs)('%s translations', (name, enDict, arDict) => {
  test('English and Arabic have exactly the same keys', () => {
    const missingInAr = Object.keys(enDict).filter((k) => !(k in arDict));
    const missingInEn = Object.keys(arDict).filter((k) => !(k in enDict));
    expect(missingInAr).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  test('placeholders such as {n} match in both languages', () => {
    const bad = Object.keys(enDict).filter((k) => k in arDict && placeholders(enDict[k]) !== placeholders(arDict[k]));
    expect(bad).toEqual([]);
  });

  test('no translation is empty', () => {
    const empty = [...Object.entries(enDict), ...Object.entries(arDict)].filter(([, v]) => !String(v).trim());
    expect(empty).toEqual([]);
  });
});

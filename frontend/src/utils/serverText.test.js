import { translateServer } from './serverText';
import { exact, patterns } from '../locales/servertexts';

describe('translateServer', () => {
  test('English is returned untouched', () => {
    expect(translateServer('Order not found', 'en')).toBe('Order not found');
  });

  test('exact texts are translated', () => {
    expect(translateServer('Order not found', 'ar')).toBe('الأوردر غير موجود');
    expect(translateServer('Claim Status Update', 'ar')).toBe('تحديث حالة الشكوى');
  });

  test('unknown texts pass through unchanged', () => {
    expect(translateServer('Something nobody wrote a translation for', 'ar')).toBe('Something nobody wrote a translation for');
  });

  test('parts that change are kept, statuses are translated', () => {
    expect(translateServer('Ahmed commented on order #ORD-2611-0001', 'ar')).toBe('Ahmed علّق على الأوردر #ORD-2611-0001');
    expect(translateServer('Order #ORD-1 status has been updated to In Prepress', 'ar')).toBe('تم تحديث حالة الأوردر #ORD-1 إلى في البري برس');
    expect(translateServer('Your claim "Faded red" has been resolved', 'ar')).toBe('تم تحديث حالة شكواك «Faded red» إلى تم الحل');
  });

  test('the more specific quote message wins', () => {
    expect(translateServer('Order ORD-9: 1500 EGP. Please approve it so we can start.', 'ar')).toBe('الأوردر ORD-9: 1500 EGP. وافق على العرض لنبدأ العمل.');
    expect(translateServer('Order ORD-9: 1500 EGP.', 'ar')).toBe('الأوردر ORD-9: 1500 EGP.');
  });

  test('a wrapped message is translated inside', () => {
    expect(translateServer('Upload error: File not found', 'ar')).toBe('خطأ في الرفع: الملف غير موجود');
  });
});

describe('server text tables', () => {
  test('every Arabic template keeps the same placeholders as its English one', () => {
    const names = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
    const bad = patterns.filter(([en, ar]) => names(en) !== names(ar)).map(([en]) => en);
    expect(bad).toEqual([]);
  });
  test('no exact translation is empty', () => {
    expect(Object.entries(exact).filter(([, v]) => !v.trim())).toEqual([]);
  });
});

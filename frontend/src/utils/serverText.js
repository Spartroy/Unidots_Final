import { exact, patterns, values } from '../locales/servertexts';

// Shows texts the server wrote in English (notifications, error messages) in the reader's language.
// Anything we have no translation for is returned exactly as received.

const MAPPED = /^(status|stage|process|method|role|dept)/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compiled = patterns.map(([en, ar]) => {
  const names = [];
  const source = esc(en).replace(/\\\{(\w+)\\\}/g, (_, n) => {
    names.push(n);
    return '(.+?)';
  });
  return { re: new RegExp(`^${source}$`), names, ar };
});

const showValue = (name, v) => {
  if (!MAPPED.test(name)) return v;
  const plain = String(v).trim().toLowerCase();
  return values[plain] || values[plain.replace(/[\s_-]+/g, '')] || v;
};

export const translateServer = (text, lang) => {
  if (lang !== 'ar' || typeof text !== 'string' || !text) return text;
  const t = text.trim();
  if (exact[t]) return exact[t];
  for (const { re, names, ar } of compiled) {
    const m = t.match(re);
    if (!m) continue;
    return ar.replace(/\{(\w+)\}/g, (_, n) => {
      const v = m[names.indexOf(n) + 1];
      if (v === undefined) return `{${n}}`;
      return n === 'msg' ? translateServer(v, lang) : showValue(n, v);
    });
  }
  return text;
};

export const currentLang = () => (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en');

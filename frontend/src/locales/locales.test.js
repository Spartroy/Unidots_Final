import en from './en';
import ar from './ar';
import landingEn from './landing.en';
import landingAr from './landing.ar';
import phase5En from './phase5.en';
import phase5Ar from './phase5.ar';
import prepressEn from './prepress.en';
import prepressAr from './prepress.ar';
import activityEn from './activity.en';
import activityAr from './activity.ar';
import courierEn from './courier.en';
import courierAr from './courier.ar';
import ordersEn from './orders.en';
import ordersAr from './orders.ar';
import managerEn from './manager.en';
import managerAr from './manager.ar';
import accountEn from './account.en';
import accountAr from './account.ar';
import profileEn from './profile.en';
import profileAr from './profile.ar';
import claimsEn from './claims.en';
import claimsAr from './claims.ar';
import clientOrderEn from './clientorder.en';
import clientOrderAr from './clientorder.ar';
import wizEn from './wiz.en';
import wizAr from './wiz.ar';
import peopleEn from './people.en';
import peopleAr from './people.ar';

const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');

const pairs = [
  ['app', en, ar],
  ['landing', landingEn, landingAr],
  ['phase5', phase5En, phase5Ar],
  ['prepress', prepressEn, prepressAr],
  ['activity', activityEn, activityAr],
  ['courier', courierEn, courierAr],
  ['orders', ordersEn, ordersAr],
  ['manager', managerEn, managerAr],
  ['account', accountEn, accountAr],
  ['profile', profileEn, profileAr],
  ['claims', claimsEn, claimsAr],
  ['clientorder', clientOrderEn, clientOrderAr],
  ['wiz', wizEn, wizAr],
  ['people', peopleEn, peopleAr],
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

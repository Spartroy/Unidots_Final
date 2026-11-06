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
import tasksEn from './tasks.en';
import tasksAr from './tasks.ar';
import mreportsEn from './mreports.en';
import mreportsAr from './mreports.ar';
import barrelsEn from './barrels.en';
import barrelsAr from './barrels.ar';
import empworkEn from './empwork.en';
import empworkAr from './empwork.ar';
import templatesEn from './templates.en';
import templatesAr from './templates.ar';
import acidEn from './acid.en';
import acidAr from './acid.ar';
import platesEn from './plates.en';
import platesAr from './plates.ar';
import notifEn from './notif.en';
import notifAr from './notif.ar';
import chatEn from './chat.en';
import chatAr from './chat.ar';
import detectorEn from './detector.en';
import detectorAr from './detector.ar';

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
  ['tasks', tasksEn, tasksAr],
  ['mreports', mreportsEn, mreportsAr],
  ['barrels', barrelsEn, barrelsAr],
  ['empwork', empworkEn, empworkAr],
  ['templates', templatesEn, templatesAr],
  ['acid', acidEn, acidAr],
  ['plates', platesEn, platesAr],
  ['notif', notifEn, notifAr],
  ['chat', chatEn, chatAr],
  ['detector', detectorEn, detectorAr],
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

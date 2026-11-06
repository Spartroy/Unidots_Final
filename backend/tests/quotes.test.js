import test from 'node:test';
import assert from 'node:assert/strict';
import { areaCm2, areaM2, suggestQuote, rateKeyForThickness } from '../src/utils/pricing.js';
import {
  isWorkBlockedByQuote,
  isBlockedTransition,
  validateQuoteInput,
  validateResponseInput,
  statusAfterResponse,
} from '../src/utils/quoteLogic.js';
import { stockUsedForOrder, isLow } from '../src/utils/inventoryLogic.js';
import { buildClientReport, orderValue } from '../src/utils/clientReport.js';

const order = (extra = {}) => ({
  status: 'Submitted',
  specifications: {
    colors: 4,
    materialThickness: 1.7,
    dimensions: { width: 300, height: 200, unit: 'mm', widthRepeatCount: 1, heightRepeatCount: 1 },
  },
  ...extra,
});

const priceList = { ratePerCm2PerColor: { t114: 0.5, t170: 0.6, t254: 0.8 }, minimumCharge: 100 };

test('area is converted to cm2 and includes repeat counts', () => {
  assert.equal(areaCm2({ width: 300, height: 200, unit: 'mm' }), 600); // 30cm x 20cm
  assert.equal(areaCm2({ width: 30, height: 20, unit: 'cm' }), 600);
  assert.equal(areaCm2({ width: 10, height: 10, unit: 'cm', widthRepeatCount: 2, heightRepeatCount: 3 }), 600);
  assert.equal(areaCm2({ width: 0, height: 20 }), 0);
  assert.equal(areaM2({ width: 1000, height: 1000, unit: 'mm' }), 1);
});

test('thickness maps to a rate key', () => {
  assert.equal(rateKeyForThickness(1.14), 't114');
  assert.equal(rateKeyForThickness('1.7'), 't170');
  assert.equal(rateKeyForThickness(9), null);
});

test('suggested quote = area x colors x rate, with a minimum charge', () => {
  const q = suggestQuote(order(), priceList);
  assert.equal(q.amount, 600 * 4 * 0.6); // 1440
  const small = suggestQuote(order({ specifications: { colors: 1, materialThickness: 1.14, dimensions: { width: 10, height: 10, unit: 'mm' } } }), priceList);
  assert.equal(small.amount, 100); // minimum charge
});

test('suggested quote explains why it is zero', () => {
  assert.equal(suggestQuote(order(), {}).reason, 'missing-rate');
  assert.equal(suggestQuote(order({ specifications: { colors: 1, materialThickness: 1.7, dimensions: {} } }), priceList).reason, 'missing-size');
});

test('an outstanding required quote blocks the start of work, an optional one does not', () => {
  assert.equal(isWorkBlockedByQuote(order({ quote: { required: true, status: 'Sent' } })), true);
  assert.equal(isWorkBlockedByQuote(order({ quote: { required: true, status: 'Approved' } })), false);
  assert.equal(isWorkBlockedByQuote(order({ quote: { required: false, status: 'Sent' } })), false);
  assert.equal(isWorkBlockedByQuote(order()), false);
  const blocked = order({ quote: { required: true, status: 'Sent' } });
  assert.equal(isBlockedTransition(blocked, 'Designing'), true);
  assert.equal(isBlockedTransition(blocked, 'In Prepress'), true);
  assert.equal(isBlockedTransition(blocked, 'On Hold'), false);
});

test('quote input is validated', () => {
  assert.deepEqual(validateQuoteInput({ amount: 500, required: true }, order()), []);
  assert.ok(validateQuoteInput({ amount: 0 }, order()).length > 0);
  assert.ok(validateQuoteInput({ amount: 500 }, order({ status: 'Completed' })).length > 0);
  // required approval is impossible once work has started
  assert.ok(validateQuoteInput({ amount: 500, required: true }, order({ status: 'Designing' })).length > 0);
  assert.deepEqual(validateQuoteInput({ amount: 500, required: false }, order({ status: 'Designing' })), []);
});

test('client answers are validated and signed with a full name', () => {
  const sent = order({ quote: { status: 'Sent' } });
  assert.deepEqual(validateResponseInput({ decision: 'approve', signedName: 'Mona Hassan' }, sent), []);
  assert.ok(validateResponseInput({ decision: 'approve', signedName: 'Mo' }, sent).length > 0);
  assert.ok(validateResponseInput({ decision: 'maybe' }, sent).length > 0);
  assert.ok(validateResponseInput({ decision: 'reject' }, order({ quote: { status: 'Approved' } })).length > 0);
  assert.deepEqual(validateResponseInput({ decision: 'reject', reason: 'Too high' }, sent), []);
});

test('the order status after the client answers', () => {
  assert.equal(statusAfterResponse(order({ status: 'Awaiting Approval' }), 'approve'), 'Submitted');
  assert.equal(statusAfterResponse(order({ status: 'Awaiting Approval' }), 'reject'), 'On Hold');
  assert.equal(statusAfterResponse(order({ status: 'Designing' }), 'reject'), 'Designing');
});

test('stock use is the order area in m2, and low stock is detected', () => {
  assert.equal(stockUsedForOrder(order()), 0.06); // 600 cm2
  assert.equal(isLow({ quantity: 5, lowStockThreshold: 5 }), true);
  assert.equal(isLow({ quantity: 6, lowStockThreshold: 5 }), false);
  assert.equal(isLow({ quantity: -1, lowStockThreshold: 0 }), true);
});

test('client report groups orders by month and ignores cancelled value', () => {
  const orders = [
    { createdAt: '2026-01-10T10:00:00Z', status: 'Completed', quote: { status: 'Approved', amount: 1000 } },
    { createdAt: '2026-01-20T10:00:00Z', status: 'Designing', cost: { finalCost: 250 } },
    { createdAt: '2026-02-02T10:00:00Z', status: 'Cancelled', quote: { status: 'Approved', amount: 999 } },
    { createdAt: '2025-12-31T10:00:00Z', status: 'Completed', quote: { status: 'Approved', amount: 5000 } },
  ];
  const r = buildClientReport(orders, 2026);
  assert.equal(r.months[0].orders, 2);
  assert.equal(r.months[0].completed, 1);
  assert.equal(r.months[0].value, 1250);
  assert.equal(r.months[1].cancelled, 1);
  assert.equal(r.months[1].value, 0);
  assert.deepEqual(r.totals, { orders: 3, completed: 1, cancelled: 1, value: 1250 });
  assert.equal(orderValue({ quote: { status: 'Sent', amount: 10 } }), 0);
});

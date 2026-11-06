import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManagerOverview } from '../src/utils/managerOverview.js';

const now = new Date(2026, 10, 10, 15, 0, 0); // 10 Nov 2026
const day = (offset) => new Date(2026, 10, 10 + offset, 9, 0, 0);

const orders = [
  { _id: '1', orderNumber: 'A', status: 'Submitted', deadline: day(-3), createdAt: day(-20), client: { name: 'Etman' }, assignedTo: null },
  { _id: '2', orderNumber: 'B', status: 'In Prepress', deadline: day(-10), createdAt: new Date(2026, 9, 5), client: { name: 'Tulip' }, assignedTo: { name: 'Arwa' } },
  { _id: '3', orderNumber: 'C', status: 'In Prepress', deadline: day(0), createdAt: new Date(2026, 8, 2), assignedTo: { name: 'Marwan' } },
  { _id: '4', orderNumber: 'D', status: 'Completed', deadline: day(-30), createdAt: new Date(2025, 11, 1) },
  { _id: '5', orderNumber: 'E', status: 'Awaiting Approval', createdAt: day(-1), assignedTo: null },
  { _id: '6', orderNumber: 'F', status: 'On Hold', deadline: day(5), createdAt: day(-2), assignedTo: { name: 'Arwa' } },
  { _id: '7', orderNumber: 'G', status: 'Cancelled', deadline: day(-40), createdAt: day(-50) },
];

test('counts, open orders and status totals', () => {
  const o = buildManagerOverview(orders, now);
  assert.equal(o.total, 7);
  assert.equal(o.open, 5); // not completed or cancelled
  assert.equal(o.byStatus['In Prepress'], 2);
  assert.equal(o.inPrepress, 2);
  assert.equal(o.onHold, 1);
  assert.equal(o.awaitingApproval, 1);
});

test('overdue ignores closed orders, is sorted by lateness and reports days late', () => {
  const o = buildManagerOverview(orders, now);
  assert.equal(o.overdue.count, 2);
  assert.deepEqual(o.overdue.items.map((i) => i.orderNumber), ['B', 'A']);
  assert.equal(o.overdue.items[0].daysLate, 10);
  assert.equal(o.overdue.oldestDays, 10);
  assert.equal(o.overdue.items[0].assignedTo, 'Arwa');
  assert.equal(o.overdue.items[1].assignedTo, null);
});

test('due today and unassigned', () => {
  const o = buildManagerOverview(orders, now);
  assert.equal(o.dueToday.count, 1);
  assert.equal(o.dueToday.inPrepress, 1);
  assert.equal(o.unassigned, 1); // only Submitted orders without a designer
});

test('orders per month cover twelve months ending now', () => {
  const o = buildManagerOverview(orders, now);
  assert.equal(o.perMonth.length, 12);
  assert.deepEqual(o.perMonth[11], { year: 2026, month: 10, value: 2 }); // E and F were created in November
  assert.equal(o.perMonth[10].value, 2); // A and B in October
  assert.deepEqual(o.perMonth[0], { year: 2025, month: 11, value: 1 }); // D in December 2025
});

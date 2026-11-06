import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleOrderFilter, canViewOrder, redactOrderForUser, PREPRESS_STATUSES } from '../src/utils/orderVisibility.js';

const client = { _id: 'c1', role: 'client' };
const otherClient = { _id: 'c2', role: 'client' };
const designer = { _id: 'e1', role: 'employee', department: 'design' };
const prepressEmployee = { _id: 'e2', role: 'employee', department: 'prepress' };
const prepressRole = { _id: 'p1', role: 'prepress', department: 'none' };
const courier = { _id: 'k1', role: 'courier' };
const manager = { _id: 'm1', role: 'manager' };

const order = (extra = {}) => ({
  client: 'c1',
  status: 'Designing',
  assignedTo: 'e1',
  stages: { delivery: {} },
  ...extra,
});

test('managers see everything, unknown roles see nothing', () => {
  assert.deepEqual(visibleOrderFilter(manager), {});
  assert.deepEqual(visibleOrderFilter({ role: 'admin' }), {});
  assert.deepEqual(visibleOrderFilter({ role: 'mystery' }), { _id: null });
  assert.equal(canViewOrder({ role: 'mystery' }, order()), false);
});

test('a client sees only their own orders', () => {
  assert.deepEqual(visibleOrderFilter(client), { client: 'c1' });
  assert.equal(canViewOrder(client, order()), true);
  assert.equal(canViewOrder(otherClient, order()), false);
  assert.equal(canViewOrder(client, order({ client: { _id: 'c1', name: 'X' } })), true);
});

test('a designer sees assigned orders only', () => {
  assert.equal(canViewOrder(designer, order()), true);
  assert.equal(canViewOrder(designer, order({ assignedTo: 'someone-else' })), false);
  assert.equal(canViewOrder(designer, order({ assignedTo: 'x', stages: { production: { assignedTo: 'e1' } } })), true);
  assert.ok(visibleOrderFilter(designer).$or.some((r) => r.assignedTo === 'e1'));
});

test('prepress staff see orders from the plate room onward, not earlier ones', () => {
  for (const u of [prepressEmployee, prepressRole]) {
    assert.equal(canViewOrder(u, order({ status: 'In Prepress', assignedTo: 'x' })), true);
    assert.equal(canViewOrder(u, order({ status: 'Completed', assignedTo: 'x' })), true);
    assert.equal(canViewOrder(u, order({ status: 'Designing', assignedTo: 'x' })), false);
    assert.equal(canViewOrder(u, order({ status: 'Submitted', assignedTo: 'x' })), false);
  }
  assert.ok(visibleOrderFilter(prepressRole).$or[0].status.$in.every((s) => PREPRESS_STATUSES.includes(s)));
});

test('couriers see only orders with a delivery method that are ready, on the road or done', () => {
  const delivery = { stages: { delivery: { courierInfo: { mode: 'direct' } } } };
  assert.equal(canViewOrder(courier, order({ ...delivery, status: 'Ready for Delivery' })), true);
  assert.equal(canViewOrder(courier, order({ ...delivery, status: 'In Prepress' })), false);
  assert.equal(canViewOrder(courier, order({ status: 'Ready for Delivery' })), false);
});

test('clients lose internal fields and staff emails', () => {
  const full = {
    specifications: { jobPath: '/jobs/x.ai', distortion: 12, colors: 4 },
    cost: { finalCost: 100, breakdown: { a: 1 } },
    history: [{ action: 'x', user: { _id: 'e1', name: 'Designer', email: 'd@x.com' } }],
    comments: [{ content: 'hi', author: { _id: 'c1', name: 'Me', email: 'me@x.com' } }],
  };
  const r = redactOrderForUser(full, client);
  assert.equal(r.specifications.jobPath, undefined);
  assert.equal(r.specifications.distortion, undefined);
  assert.equal(r.specifications.colors, 4);
  assert.equal(r.cost.breakdown, undefined);
  assert.equal(r.cost.finalCost, 100);
  assert.equal(r.history[0].user.email, undefined);
  assert.equal(r.history[0].user.name, 'Designer');
  assert.equal(r.comments[0].author.email, 'me@x.com'); // their own details stay
  assert.ok(full.specifications.jobPath); // the original is not modified
});

test('staff never see prices, couriers lose conversation data, prepress loses client contact', () => {
  const full = {
    cost: { finalCost: 100 },
    quote: { amount: 100 },
    comments: [{}],
    history: [{}],
    client: { name: 'Tulip', company: 'T', email: 't@x.com', phone: '0100', address: { city: 'Cairo' } },
    specifications: { jobPath: '/x', distortion: 3 },
  };
  const d = redactOrderForUser(full, designer);
  assert.equal(d.cost, undefined);
  assert.equal(d.quote, undefined);
  assert.equal(d.client.email, 't@x.com');
  assert.ok(d.specifications.jobPath);

  const p = redactOrderForUser(full, prepressRole);
  assert.equal(p.client.email, undefined);
  assert.equal(p.client.phone, undefined);
  assert.equal(p.client.name, 'Tulip');

  const k = redactOrderForUser(full, courier);
  assert.equal(k.comments, undefined);
  assert.equal(k.history, undefined);
  assert.equal(k.client.email, undefined);
  assert.equal(k.client.phone, '0100');
  assert.equal(k.specifications.jobPath, undefined);

  assert.deepEqual(redactOrderForUser(full, manager), full);
});

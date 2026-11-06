import test from 'node:test';
import assert from 'node:assert/strict';
import { prepress, prepressOrManager, authorize, manager, client } from '../src/middleware/authMiddleware.js';

const run = async (mw, user) => {
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; } };
  let nextCalled = false;
  let error = null;
  try {
    // express-async-handler reports thrown errors through next(err)
    await mw({ user }, res, (err) => { if (err) error = err; else nextCalled = true; });
  } catch (e) {
    error = e;
  }
  return { nextCalled, status: res.statusCode, error };
};

test('prepress access: department OR role prepress, plus managers and admins', async () => {
  for (const mw of [prepress, prepressOrManager]) {
    assert.equal((await run(mw, { role: 'employee', department: 'prepress' })).nextCalled, true);
    assert.equal((await run(mw, { role: 'prepress', department: 'none' })).nextCalled, true);
    assert.equal((await run(mw, { role: 'manager' })).nextCalled, true);
    assert.equal((await run(mw, { role: 'admin' })).nextCalled, true);
  }
});

test('prepress access is refused for everyone else with a 403', async () => {
  for (const mw of [prepress, prepressOrManager]) {
    for (const user of [{ role: 'client' }, { role: 'courier' }, { role: 'employee', department: 'design' }, undefined]) {
      const r = await run(mw, user);
      assert.equal(r.nextCalled, false);
      assert.equal(r.status, 403);
    }
  }
});

test('manager guard allows manager/admin only', async () => {
  assert.equal((await run(manager, { role: 'manager' })).nextCalled, true);
  assert.equal((await run(manager, { role: 'admin' })).nextCalled, true);
  const r = await run(manager, { role: 'employee' });
  assert.equal(r.nextCalled, false);
  assert.equal(r.status, 403);
});

test('client guard allows clients only', async () => {
  assert.equal((await run(client, { role: 'client' })).nextCalled, true);
  assert.equal((await run(client, { role: 'manager' })).nextCalled, false);
});

test('authorize(...roles) checks the role list', async () => {
  const mw = authorize('employee', 'manager');
  assert.equal((await run(mw, { role: 'employee' })).nextCalled, true);
  const r = await run(mw, { role: 'client' });
  assert.equal(r.nextCalled, false);
  assert.equal(r.status, 403);
});

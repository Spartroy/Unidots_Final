import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresManagerAuth } from '../src/utils/registrationPolicy.js';

test('public sign-up may only create clients', () => {
  assert.equal(requiresManagerAuth(undefined), false);
  assert.equal(requiresManagerAuth(''), false);
  assert.equal(requiresManagerAuth('client'), false);
});

test('every other role needs a manager or admin', () => {
  for (const role of ['employee', 'manager', 'admin', 'prepress', 'courier', 'anything-else']) {
    assert.equal(requiresManagerAuth(role), true, role);
  }
});

import { statusKey, stepperIndex } from './orderStatus';

test('every order status maps to a design-system status key', () => {
  expect(statusKey('Submitted')).toBe('submitted');
  expect(statusKey('Design Done')).toBe('design-done');
  expect(statusKey('In Prepress')).toBe('in-prepress');
  expect(statusKey('Ready for Delivery')).toBe('ready');
  expect(statusKey('Delivered')).toBe('completed');
  expect(statusKey('Awaiting Approval')).toBe('awaiting-approval');
  expect(statusKey('On Hold')).toBe('on-hold');
  expect(statusKey('something new')).toBe('submitted');
});

test('the stepper follows the status and finishes on completion', () => {
  expect(stepperIndex('Submitted')).toBe(0);
  expect(stepperIndex('Designing')).toBe(1);
  expect(stepperIndex('In Prepress')).toBe(3);
  expect(stepperIndex('Delivering')).toBe(4);
  expect(stepperIndex('Completed')).toBe(5);
});

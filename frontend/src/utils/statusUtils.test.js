import { getDisplayStatus, getStatusColor, getOrderSteps } from './statusUtils';

test('clients see friendly, upper-case statuses', () => {
  expect(getDisplayStatus('Ready for Delivery', 'client')).toBe('OUT FOR DELIVERY');
  expect(getDisplayStatus('Delivering', 'client')).toBe('OUT FOR DELIVERY');
  expect(getDisplayStatus('Delivered', 'client')).toBe('COMPLETED');
  expect(getDisplayStatus('In Prepress', 'manager')).toBe('IN PREPRESS');
  expect(getDisplayStatus('', 'client')).toBe('');
});

test('each status has a badge colour, including Delivering', () => {
  expect(getStatusColor('Completed')).toContain('green');
  expect(getStatusColor('Cancelled')).toContain('red');
  expect(getStatusColor('Delivering')).toContain('cyan');
  expect(getStatusColor('something new')).toContain('gray');
});

test('order steps follow the status', () => {
  expect(getOrderSteps(null)).toEqual({ steps: [], currentStep: 0 });
  expect(getOrderSteps({ status: 'Submitted' }).currentStep).toBe(0);
  expect(getOrderSteps({ status: 'Designing' }).currentStep).toBe(1);
  expect(getOrderSteps({ status: 'In Prepress' }).currentStep).toBe(3);
  expect(getOrderSteps({ status: 'Completed' }).steps.every((s) => s.completed)).toBe(true);
});

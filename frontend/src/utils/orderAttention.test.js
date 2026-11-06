import { groupOrdersNeedingAttention } from './orderAttention';

const now = new Date('2026-11-10T12:00:00Z').getTime();
const day = 24 * 60 * 60 * 1000;

test('finds overdue, on-hold and unassigned orders, ignoring closed ones', () => {
  const orders = [
    { _id: '1', status: 'Designing', deadline: new Date(now - day).toISOString() },
    { _id: '2', status: 'Designing', deadline: new Date(now + day).toISOString() },
    { _id: '3', status: 'On Hold' },
    { _id: '4', status: 'Submitted', assignedTo: null },
    { _id: '5', status: 'Submitted', assignedTo: 'u1' },
    { _id: '6', status: 'Completed', deadline: new Date(now - 5 * day).toISOString() },
    { _id: '7', status: 'Cancelled', deadline: new Date(now - 5 * day).toISOString() },
  ];
  const g = groupOrdersNeedingAttention(orders, now);
  expect(g.overdue.map((o) => o._id)).toEqual(['1']);
  expect(g.onHold.map((o) => o._id)).toEqual(['3']);
  expect(g.unassigned.map((o) => o._id)).toEqual(['4']);
});

test('handles empty input', () => {
  expect(groupOrdersNeedingAttention(undefined, now)).toEqual({ overdue: [], onHold: [], unassigned: [] });
});

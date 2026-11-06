import { stageStates, nextStep } from './orderFlow';

test('stages follow the status', () => {
  expect(stageStates({ status: 'Submitted' })).toEqual({ submission: 'done', design: 'todo', ripping: 'todo', prepress: 'todo', delivery: 'todo' });
  expect(stageStates({ status: 'Designing' }).design).toBe('current');
  expect(stageStates({ status: 'Design Done' })).toMatchObject({ design: 'done', ripping: 'current' });
  expect(stageStates({ status: 'In Prepress' })).toMatchObject({ design: 'done', ripping: 'done', prepress: 'current', delivery: 'todo' });
  expect(stageStates({ status: 'Ready for Delivery' })).toMatchObject({ prepress: 'done', delivery: 'current' });
  expect(Object.values(stageStates({ status: 'Completed' })).every((v) => v === 'done')).toBe(true);
});

test('the next step is the one primary action', () => {
  expect(nextStep({ status: 'Submitted', assignedTo: null })).toEqual({ type: 'assign' });
  expect(nextStep({ status: 'Submitted', assignedTo: { _id: 'x' } })).toBeNull();
  expect(nextStep({ status: 'Awaiting Approval' })).toEqual({ type: 'waiting' });
  expect(nextStep({ status: 'Design Done' })).toEqual({ type: 'inPrepress', status: 'In Prepress' });
  expect(nextStep({ status: 'In Prepress' })).toEqual({ type: 'ready', status: 'Ready for Delivery' });
  expect(nextStep({ status: 'Delivering' })).toEqual({ type: 'complete', status: 'Completed' });
  expect(nextStep({ status: 'On Hold', assignedTo: { _id: 'x' } })).toEqual({ type: 'resume', status: 'Designing' });
  expect(nextStep({ status: 'Completed' })).toBeNull();
  expect(nextStep({ status: 'Cancelled' })).toBeNull();
});

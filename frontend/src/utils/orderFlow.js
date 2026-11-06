// Pure rules for the manager's order page: where each stage stands, and what the next step is.
const CLOSED = ['Completed', 'Delivered', 'Cancelled'];
const AFTER_DESIGN = ['In Prepress', 'Ready for Delivery', 'Delivering', 'Completed', 'Delivered'];
const AFTER_PREPRESS = ['Ready for Delivery', 'Delivering', 'Completed', 'Delivered'];

/** State of the five stages: 'done' | 'current' | 'todo'. */
export const stageStates = (order) => {
  const s = order?.status;
  const ripping = order?.stages?.production?.subProcesses?.ripping?.status === 'Completed';
  const designDone = AFTER_DESIGN.includes(s) || s === 'Design Done' || order?.stages?.production?.status === 'Completed';
  const prepressDone = AFTER_PREPRESS.includes(s) || order?.stages?.prepress?.status === 'Completed';
  const delivered = ['Completed', 'Delivered'].includes(s);
  return {
    submission: 'done',
    design: designDone ? 'done' : ['Designing', 'Submitted', 'Awaiting Approval'].includes(s) && s === 'Designing' ? 'current' : 'todo',
    ripping: ripping || AFTER_DESIGN.includes(s) ? 'done' : s === 'Design Done' ? 'current' : 'todo',
    prepress: prepressDone ? 'done' : s === 'In Prepress' ? 'current' : 'todo',
    delivery: delivered ? 'done' : ['Ready for Delivery', 'Delivering'].includes(s) ? 'current' : 'todo',
  };
};

/** The one primary action a manager should take next, or null. */
export const nextStep = (order) => {
  if (!order || CLOSED.includes(order.status)) return null;
  if (order.status === 'Awaiting Approval') return { type: 'waiting' };
  if (order.status === 'On Hold') return { type: 'resume', status: order.assignedTo ? 'Designing' : 'Submitted' };
  if (order.status === 'Submitted' && !order.assignedTo) return { type: 'assign' };
  if (order.status === 'Design Done') return { type: 'inPrepress', status: 'In Prepress' };
  if (order.status === 'In Prepress') return { type: 'ready', status: 'Ready for Delivery' };
  if (['Ready for Delivery', 'Delivering'].includes(order.status)) return { type: 'complete', status: 'Completed' };
  return null;
};

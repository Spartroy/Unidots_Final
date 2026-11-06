const CLOSED = ['Completed', 'Delivered', 'Cancelled'];

// Groups open orders into the things a manager must act on.
export const groupOrdersNeedingAttention = (orders, now = Date.now()) => {
  const open = (orders || []).filter((o) => !CLOSED.includes(o.status));
  return {
    overdue: open.filter((o) => o.deadline && new Date(o.deadline).getTime() < now),
    onHold: open.filter((o) => o.status === 'On Hold'),
    unassigned: open.filter((o) => o.status === 'Submitted' && !o.assignedTo),
    awaitingApproval: open.filter((o) => o.status === 'Awaiting Approval'),
  };
};

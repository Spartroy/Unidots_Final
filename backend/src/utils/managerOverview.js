// Numbers for the manager dashboard, built from lightweight order records (pure function, easy to test).
const CLOSED = ['Completed', 'Delivered', 'Cancelled'];
const PIPELINE = ['Submitted', 'Awaiting Approval', 'Designing', 'Design Done', 'In Prepress', 'Ready for Delivery', 'Delivering', 'Completed', 'On Hold', 'Cancelled'];
const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const buildManagerOverview = (orders, now = new Date(), months = 12) => {
  const today = startOfDay(now).getTime();
  const byStatus = Object.fromEntries(PIPELINE.map((s) => [s, 0]));
  const open = orders.filter((o) => !CLOSED.includes(o.status));

  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  // Orders created per month, ending with the current month
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, year: d.getFullYear(), month: d.getMonth(), value: 0 });
  }
  for (const o of orders) {
    const c = new Date(o.createdAt);
    const b = buckets.find((x) => x.year === c.getFullYear() && x.month === c.getMonth());
    if (b) b.value += 1;
  }

  const overdue = open
    .filter((o) => o.deadline && startOfDay(o.deadline).getTime() < today)
    .map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      title: o.title,
      status: o.status,
      deadline: o.deadline,
      client: o.client?.name || null,
      assignedTo: o.assignedTo?.name || null,
      daysLate: Math.max(1, Math.round((today - startOfDay(o.deadline).getTime()) / DAY)),
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  const dueToday = open.filter((o) => o.deadline && startOfDay(o.deadline).getTime() === today);

  return {
    total: orders.length,
    open: open.length,
    byStatus,
    perMonth: buckets.map((b) => ({ year: b.year, month: b.month, value: b.value })),
    overdue: { count: overdue.length, oldestDays: overdue[0]?.daysLate || 0, items: overdue.slice(0, 8) },
    dueToday: { count: dueToday.length, inPrepress: dueToday.filter((o) => o.status === 'In Prepress').length },
    unassigned: open.filter((o) => o.status === 'Submitted' && !o.assignedTo).length,
    awaitingApproval: byStatus['Awaiting Approval'] || 0,
    onHold: byStatus['On Hold'] || 0,
    inPrepress: byStatus['In Prepress'] || 0,
  };
};

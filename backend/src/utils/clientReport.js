// Builds a client's monthly report from their orders (pure function).
const CANCELLED = 'Cancelled';

export const orderValue = (order) => {
  if (order?.quote?.status === 'Approved' && Number(order.quote.amount) > 0) return Number(order.quote.amount);
  if (Number(order?.cost?.finalCost) > 0) return Number(order.cost.finalCost);
  return 0;
};

export const buildClientReport = (orders, year) => {
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, orders: 0, completed: 0, cancelled: 0, value: 0 }));
  for (const o of orders || []) {
    const d = new Date(o.createdAt);
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() !== year) continue;
    const m = months[d.getUTCMonth()];
    m.orders += 1;
    if (o.status === 'Completed' || o.status === 'Delivered') m.completed += 1;
    if (o.status === CANCELLED) m.cancelled += 1;
    else m.value += orderValue(o);
  }
  months.forEach((m) => (m.value = Math.round(m.value * 100) / 100));
  const totals = months.reduce(
    (t, m) => ({ orders: t.orders + m.orders, completed: t.completed + m.completed, cancelled: t.cancelled + m.cancelled, value: t.value + m.value }),
    { orders: 0, completed: 0, cancelled: 0, value: 0 }
  );
  totals.value = Math.round(totals.value * 100) / 100;
  return { year, months, totals };
};

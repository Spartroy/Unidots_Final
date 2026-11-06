// Turns a client report into CSV text. Cells that start with = + - @ are prefixed so spreadsheets
// never treat them as formulas, and quotes are escaped.
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const reportToCsv = (report, monthNames, labels) => {
  const rows = [[labels.month, labels.orders, labels.completed, labels.cancelled, labels.value]];
  report.months.forEach((m, i) => rows.push([monthNames[i], m.orders, m.completed, m.cancelled, m.value]));
  const t = report.totals;
  rows.push([labels.total, t.orders, t.completed, t.cancelled, t.value]);
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
};

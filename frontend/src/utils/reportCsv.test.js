import { reportToCsv } from './reportCsv';

const labels = { month: 'Month', orders: 'Orders', completed: 'Completed', cancelled: 'Cancelled', value: 'Value', total: 'Total' };
const months = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);
const report = {
  months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, orders: i === 0 ? 2 : 0, completed: 1, cancelled: 0, value: i === 0 ? 1250.5 : 0 })),
  totals: { orders: 2, completed: 12, cancelled: 0, value: 1250.5 },
};

test('CSV has a header, twelve months and a total row', () => {
  const lines = reportToCsv(report, months, labels).split('\r\n');
  expect(lines[0]).toBe('Month,Orders,Completed,Cancelled,Value');
  expect(lines).toHaveLength(14);
  expect(lines[1]).toBe('M1,2,1,0,1250.5');
  expect(lines[13]).toBe('Total,2,12,0,1250.5');
});

test('values that could be read as spreadsheet formulas are neutralised and quotes are escaped', () => {
  const csv = reportToCsv(report, ['=SUM(A1)', ...months.slice(1)], { ...labels, total: 'Say "hi", ok' });
  const lines = csv.split('\r\n');
  expect(lines[1].startsWith("'=SUM(A1),")).toBe(true);
  expect(lines[13].startsWith('"Say ""hi"", ok",')).toBe(true);
});

// utils/reportGenerator.js
// Generates a CSV string for financial report (last N months) including income, expenses, and net profit
export const generateCSVReport = (payments, expenses, months = 3) => {
  const headers = ['Date', 'Type', 'Amount', 'Description'];
  const rows = [];
  const now = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const fmtDate = d => d.toISOString().split('T')[0];
  // Payments (Income)
  payments.forEach(p => {
    const d = new Date(p.date || p.created_at || now);
    if (d >= startDate && d <= now && p.status === 'SUCCESS') {
      rows.push([fmtDate(d), 'Income', Number(p.amount).toFixed(2), p.description || '']);
    }
  });
  // Expenses
  expenses.forEach(e => {
    const d = new Date(e.date || e.created_at || now);
    if (d >= startDate && d <= now) {
      rows.push([fmtDate(d), 'Expense', Number(e.amount).toFixed(2), e.description || '']);
    }
  });
  // Sort by date
  rows.sort((a, b) => new Date(a[0]) - new Date(b[0]));
  // Calculate totals
  const totalIncome = rows
    .filter(r => r[1] === 'Income')
    .reduce((sum, r) => sum + Number(r[2]), 0);
  const totalExpense = rows
    .filter(r => r[1] === 'Expense')
    .reduce((sum, r) => sum + Number(r[2]), 0);
  const netProfit = totalIncome - totalExpense;
  // Add summary rows
  rows.push(['', 'Total Income', totalIncome.toFixed(2), '']);
  rows.push(['', 'Total Expense', totalExpense.toFixed(2), '']);
  rows.push(['', 'Net Profit', netProfit.toFixed(2), netProfit >= 0 ? 'Profit' : 'Loss']);
  const csvLines = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))];
  return csvLines.join('\n');
};

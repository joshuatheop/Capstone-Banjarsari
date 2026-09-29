export interface FinancialAssumptions {
  dailyPaidOrders: number;
  averageOrderValue: number;
  growthPercent: number;
  feePercent: number;
  fixedCost: number;
  variableCost: number;
  months: number;
}
/** Scenario arithmetic, not a learned revenue forecast or actual profit statement. */
export function projectFinancials(input: FinancialAssumptions) {
  if (Object.values(input).some(value => !Number.isFinite(value)) || input.dailyPaidOrders < 0 || input.averageOrderValue < 0 || input.fixedCost < 0 || input.variableCost < 0 || input.growthPercent < -50 || input.growthPercent > 100 || input.feePercent < 0 || input.feePercent > 100 || !Number.isInteger(input.months) || input.months < 1 || input.months > 12) throw new Error('Periksa asumsi: angka nonnegatif, pertumbuhan -50–100%, fee 0–100%, periode 1–12 bulan.');
  const rows = Array.from({ length: input.months }, (_, index) => {
    const orders = Math.round(input.dailyPaidOrders * 30 * (1 + input.growthPercent / 100) ** (index + 1));
    const gmv = Math.round(orders * input.averageOrderValue);
    const revenue = Math.round(gmv * input.feePercent / 100);
    const cost = Math.round(input.fixedCost + orders * input.variableCost);
    return { month: index + 1, orders, gmv, revenue, cost, net: revenue - cost };
  });
  if (rows.some(row => Object.values(row).some(value => !Number.isSafeInteger(value)))) throw new Error('Asumsi terlalu besar. Gunakan nilai yang lebih kecil.');
  for (const key of ['gmv', 'revenue', 'cost', 'net'] as const) {
    if (!Number.isSafeInteger(rows.reduce((sum, row) => sum + row[key], 0))) throw new Error('Total skenario terlalu besar. Gunakan nilai yang lebih kecil.');
  }
  return rows;
}

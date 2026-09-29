export const demoVouchers = [
  { code: 'DEMOHEMAT10', title: 'Hemat 10%', minimum: 50000, percent: 10, fixed: 0, maximum: 15000, detail: 'Min. Rp50.000 · maksimal Rp15.000' },
  { code: 'DEMOLOKAL5', title: 'Potongan Rp5.000', minimum: 25000, percent: 0, fixed: 5000, maximum: 5000, detail: 'Min. Rp25.000' },
] as const;
export function voucherDiscount(code: string | undefined, subtotal: number): number {
  if (!code) return 0;
  const voucher = demoVouchers.find(v => v.code === code);
  if (!voucher || !Number.isSafeInteger(subtotal) || subtotal < voucher.minimum) return 0;
  return Math.min(subtotal, voucher.maximum, voucher.fixed || Math.floor(subtotal * voucher.percent / 100));
}
export function allocateDiscount(subtotals: number[], discount: number): number[] {
  const total = subtotals.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(discount) || discount < 0 || discount > total || subtotals.some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error('Diskon tidak valid.');
  const allocations = subtotals.map(subtotal => total ? Math.floor(discount * subtotal / total) : 0);
  let remainder = discount - allocations.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < allocations.length && remainder > 0; index++) if (allocations[index] < subtotals[index]) { allocations[index]++; remainder--; }
  return allocations;
}

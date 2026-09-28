export interface DailySale { date: string; quantity: number }
export interface StockInput {
  id: string; name: string; kind: 'RETAIL' | 'FOOD'; unit: string;
  onHand: number; incoming: number; leadDays: number; reviewDays: number; shelfLifeDays: number | null;
  history: DailySale[];
}
export interface ForecastResult {
  id: string; name: string; kind: StockInput['kind']; unit: string; onHand: number; incoming: number;
  eligible: boolean; reason: string; historyDays: number; missingDays: number; method: string;
  predictions: DailySale[]; tomorrow: number; week: number; mae: number | null; wape: number | null;
  stockTarget: number; suggested: number; coverageDays: number | null; planningDays: number;
  trendPercent: number | null; risk: 'insufficient' | 'low' | 'healthy' | 'excess';
  validation: { method: string; mae: number }[];
}

const DAY = 86400000;
export const datePlus = (date: string, days: number) => new Date(Date.parse(date + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const models = [
  { name: 'Rata-rata 7 hari', predict: (history: number[]) => mean(history.slice(-7)) },
  { name: 'Rata-rata 28 hari', predict: (history: number[]) => mean(history.slice(-28)) },
  { name: 'Pola mingguan', predict: (history: number[]) => history[history.length - 7] ?? 0 },
  { name: 'Pemulusan eksponensial', predict: (history: number[]) => history.reduce((level, value) => .3 * value + .7 * level, history[0] ?? 0) },
];

export const forecastStock = (input: StockInput, asOf: string): ForecastResult => {
  const base: ForecastResult = { id: input.id, name: input.name, kind: input.kind, unit: input.unit, onHand: input.onHand, incoming: input.incoming,
    eligible: false, reason: '', historyDays: 0, missingDays: 0, method: 'Belum tersedia', predictions: [], tomorrow: 0, week: 0,
    mae: null, wape: null, stockTarget: 0, suggested: 0, coverageDays: null, planningDays: 0, trendPercent: null, risk: 'insufficient', validation: [] };
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + 'T00:00:00Z')) && datePlus(date, 0) === date;
  if (!validDate(asOf) || input.history.some((row) => !validDate(row.date) || !Number.isFinite(row.quantity) || row.quantity < 0 || row.date > asOf)) return { ...base, reason: 'Tanggal atau kuantitas tidak valid; data masa depan tidak boleh masuk.' };
  if ([input.onHand, input.incoming, input.leadDays, input.reviewDays].some((value) => !Number.isInteger(value) || value < 0) || input.reviewDays < 1 || input.leadDays + input.reviewDays > 30 || (input.shelfLifeDays !== null && (!Number.isInteger(input.shelfLifeDays) || input.shelfLifeDays < 1))) return { ...base, reason: 'Stok dan periode perencanaan tidak valid (maksimal 30 hari).' };
  if (input.kind === 'FOOD' && input.shelfLifeDays === null) return { ...base, reason: 'Umur simpan makanan wajib diisi.' };
  const byDate = new Map(input.history.map((row) => [row.date, row.quantity]));
  if (byDate.size !== input.history.length) return { ...base, reason: 'Ada tanggal duplikat. Agregasikan penjualan per produk per hari.' };
  const sorted = [...byDate.keys()].sort();
  if (!sorted.length) return { ...base, reason: 'Belum ada riwayat penjualan.' };
  const start = sorted[0] < datePlus(asOf, -55) ? datePlus(asOf, -55) : sorted[0];
  const days = Math.round((Date.parse(asOf) - Date.parse(start)) / DAY) + 1;
  const series = Array.from({ length: days }, (_, i) => byDate.get(datePlus(start, i)));
  const missing = series.filter((value) => value === undefined).length;
  base.historyDays = days - missing; base.missingDays = missing;
  // Missing observations are unknown, never silently interpreted as zero sales.
  if (missing || days < 28) return { ...base, reason: missing ? `${missing} hari belum tercatat. Isi 0 hanya jika memang tidak ada penjualan.` : 'Minimal 28 hari lengkap diperlukan untuk menghitung perkiraan.' };
  const values = series as number[];
  const validationStart = Math.max(14, values.length - 14);
  const evaluated = models.map((model) => {
    const errors = values.slice(validationStart).map((value, i) => Math.abs(value - model.predict(values.slice(0, validationStart + i))));
    return { model, mae: mean(errors), totalError: errors.reduce((sum, error) => sum + error, 0) };
  }).sort((a, b) => a.mae - b.mae);
  const best = evaluated[0];
  const future = [...values];
  const predictions = Array.from({ length: 30 }, (_, i) => {
    const quantity = Math.max(0, best.model.predict(future)); future.push(quantity);
    return { date: datePlus(asOf, i + 1), quantity: Math.round(quantity * 100) / 100 };
  });
  const requestedDays = input.leadDays + input.reviewDays;
  const planningDays = input.kind === 'FOOD' && input.shelfLifeDays !== null ? Math.min(requestedDays, input.shelfLifeDays) : requestedDays;
  const demand = predictions.slice(0, planningDays).reduce((sum, day) => sum + day.quantity, 0);
  // Error buffer is a planning heuristic, not a statistical confidence interval.
  const buffer = input.kind === 'FOOD' ? 0 : Math.ceil(best.mae * Math.sqrt(planningDays));
  const stockTarget = Math.ceil(demand + buffer);
  const available = input.onHand + input.incoming;
  const daily = mean(predictions.slice(0, 7).map((day) => day.quantity));
  const recent = mean(values.slice(-7)), previous = mean(values.slice(-14, -7));
  const totalObserved = values.slice(validationStart).reduce((sum, value) => sum + value, 0);
  const risk = available < demand ? 'low' : (daily === 0 ? available > 0 : available > Math.max(stockTarget * 1.5, 1)) ? 'excess' : 'healthy';
  return { ...base, eligible: true, reason: input.kind === 'FOOD' ? 'Rencana produksi dibatasi umur simpan. Stok harus layak jual sampai periode rencana; periksa kedaluwarsa sebelum menyiapkan.' : 'Rencana pengadaan memperhitungkan stok layak jual, barang masuk, lead time, dan buffer kesalahan.',
    method: best.model.name, predictions, tomorrow: Math.ceil(predictions[0].quantity), week: Math.ceil(predictions.slice(0, 7).reduce((sum, day) => sum + day.quantity, 0)),
    mae: best.mae, wape: totalObserved > 0 ? best.totalError / totalObserved * 100 : null, stockTarget, suggested: Math.max(0, stockTarget - available),
    coverageDays: daily > 0 ? Math.round(input.onHand / daily * 10) / 10 : null, planningDays,
    trendPercent: previous > 0 ? Math.round((recent - previous) / previous * 100) : null, risk,
    validation: evaluated.map(({ model, mae }) => ({ method: model.name, mae })) };
};

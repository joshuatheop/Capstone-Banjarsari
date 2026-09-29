import type { ForecastResult } from './forecast';
/** Presentation indicators only; the existing forecasting/stock policy is unchanged. */
export function forecastPresentation(result: ForecastResult) {
  if (!result.eligible) return { preparation: null, confidence: 'Belum tersedia', level: 'unavailable', basis: result.reason };
  const preparation = Math.max(0, Math.ceil(result.tomorrow - result.onHand));
  if (result.wape === null) return { preparation, confidence: 'Terbatas', level: 'low', basis: 'Demand aktual pada periode validasi nol; WAPE tidak tersedia. Belum cukup untuk menilai confidence relatif.' };
  const level = result.historyDays >= 42 && result.wape <= 20 ? 'high' : result.wape <= 40 ? 'medium' : 'low';
  return { preparation, confidence: level === 'high' ? 'Tinggi' : level === 'medium' ? 'Sedang' : 'Rendah', level,
    basis: `${result.historyDays} hari histori lengkap; WAPE ${result.wape.toFixed(1)}% pada validasi bergulir. Label indikatif, bukan probabilitas atau jaminan.` };
}

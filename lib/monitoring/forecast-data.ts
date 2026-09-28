import { datePlus, type StockInput } from './forecast';

// Separate labelled training example, not fabricated production demand.
export const FORECAST_AS_OF = '2026-09-28';
export const forecastSamples: StockInput[] = [
  { id: 'p1', name: 'Batik Tulis Motif Parang', kind: 'RETAIL', unit: 'lembar', onHand: 8, incoming: 2, leadDays: 3, reviewDays: 4, shelfLifeDays: null, history: [] },
  { id: 'p2', name: 'Tempe Mendoan Crispy', kind: 'FOOD', unit: 'porsi', onHand: 5, incoming: 0, leadDays: 0, reviewDays: 1, shelfLifeDays: 1, history: [] },
  { id: 'p3', name: 'Kripik Singkong Pedas Manis', kind: 'FOOD', unit: 'bungkus', onHand: 85, incoming: 0, leadDays: 2, reviewDays: 5, shelfLifeDays: 14, history: [] },
  { id: 'p4', name: 'Batik Cap Motif Truntum', kind: 'RETAIL', unit: 'lembar', onHand: 16, incoming: 0, leadDays: 2, reviewDays: 5, shelfLifeDays: null, history: [] },
].map((product, productIndex) => ({ ...product, history: Array.from({ length: 56 }, (_, i) => {
  const date = datePlus(FORECAST_AS_OF, i - 55);
  const weekend = [0, 6].includes(new Date(date + 'T00:00:00Z').getUTCDay());
  const base = [2, 18, 6, 1][productIndex];
  const trend = productIndex === 1 ? Math.floor(i / 14) : 0;
  return { date, quantity: Math.max(0, base + (weekend ? [1, 9, 3, 1][productIndex] : 0) + (i % 3 - 1) + trend) };
}) })) as StockInput[];

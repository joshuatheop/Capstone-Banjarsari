import type { StockInput } from './forecast';

export const FORECAST_COLUMNS = ['product_id', 'product_name', 'kind', 'unit', 'date', 'quantity', 'on_hand', 'incoming', 'lead_days', 'review_days', 'shelf_life_days'];
export const parseForecastCsv = (text: string): StockInput[] => {
  if (text.length > 1_000_000) throw new Error('CSV maksimal 1 MB.');
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') { if (quoted && source[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && char === '\n') { row.push(cell.replace(/\r$/, '')); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('Tanda kutip CSV tidak lengkap.');
  row.push(cell.replace(/\r$/, '')); if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2 || rows.length > 20001) throw new Error('CSV harus memiliki 1–20.000 baris data.');
  const header = rows.shift()!.map((value) => value.trim());
  if (FORECAST_COLUMNS.some((name) => !header.includes(name)) || new Set(header).size !== header.length) throw new Error('Kolom CSV tidak sesuai template.');
  const products = new Map<string, StockInput>();
  rows.forEach((values, index) => {
    if (values.length !== header.length) throw new Error(`Jumlah kolom tidak sesuai pada baris ${index + 2}.`);
    const item = Object.fromEntries(header.map((key, i) => [key, values[i].trim()]));
    const number = (key: string) => { const value = Number(item[key]); if (!item[key] || !Number.isInteger(value) || value < 0 || value > 1_000_000) throw new Error(`Nilai ${key} tidak valid di baris ${index + 2}.`); return value; };
    if (!item.product_id || item.product_id.length > 100 || !item.product_name || item.product_name.length > 160 || !['RETAIL', 'FOOD'].includes(item.kind) || !item.unit || item.unit.length > 30) throw new Error(`Identitas produk tidak valid di baris ${index + 2}.`);
    const product: StockInput = { id: item.product_id, name: item.product_name, kind: item.kind as StockInput['kind'], unit: item.unit, onHand: number('on_hand'), incoming: number('incoming'), leadDays: number('lead_days'), reviewDays: number('review_days'), shelfLifeDays: item.shelf_life_days ? number('shelf_life_days') : null, history: [] };
    if (product.kind === 'FOOD' && !product.shelfLifeDays) throw new Error(`Umur simpan makanan wajib diisi pada baris ${index + 2}.`);
    const existing = products.get(product.id);
    if (existing && JSON.stringify({ ...existing, history: [] }) !== JSON.stringify(product)) throw new Error(`Metadata atau stok ${product.id} berbeda antarbaris.`);
    const target = existing ?? product;
    target.history.push({ date: item.date, quantity: number('quantity') }); products.set(product.id, target);
  });
  if (products.size > 100) throw new Error('Maksimal 100 produk per impor.');
  return [...products.values()];
};

export const forecastCsv = (products: StockInput[]) => [FORECAST_COLUMNS.join(','), ...products.flatMap((p) => p.history.map((day) => [p.id, p.name, p.kind, p.unit, day.date, day.quantity, p.onHand, p.incoming, p.leadDays, p.reviewDays, p.shelfLifeDays ?? ''].map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(',')))].join('\r\n');

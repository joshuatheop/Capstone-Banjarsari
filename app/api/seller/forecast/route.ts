import { accountFailure, accountIdentity, accountInput, accountReply } from '@/lib/server/account-auth';
import { readWorkspace } from '@/lib/server/account-store';
import { AccountError, assertOwner } from '@/lib/accounts/policy';
import { parseForecastCsv } from '@/lib/monitoring/forecast-csv';
import { forecastStock } from '@/lib/monitoring/forecast';
export async function GET(request: Request) {
  try { const actor = await accountIdentity(request); assertOwner(await readWorkspace(actor), actor); return accountReply({ data: { source: 'upload', asOf: new Date().toISOString().slice(0,10), products: [], results: [] } }); }
  catch (error) { return accountFailure(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await accountIdentity(request), workspace = await readWorkspace(actor); assertOwner(workspace, actor);
    const input = await accountInput(request, 1100000);
    if (typeof input.csv !== 'string' || typeof input.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.asOf)) throw new AccountError('CSV dan tanggal data wajib valid.');
    const products = parseForecastCsv(input.csv);
    if (products.some(product => !workspace.listings.some(item => item.id === product.id && item.kind === product.kind))) throw new AccountError('CSV hanya boleh memuat ID produk milik toko Anda.', 403);
    return accountReply({ data: { source: 'upload', asOf: input.asOf, products, results: products.map(product => forecastStock(product, input.asOf as string)) } });
  } catch (error) { return accountFailure(error); }
}

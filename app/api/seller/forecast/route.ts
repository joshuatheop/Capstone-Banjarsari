import { accountFailure, accountIdentity, accountInput, accountReply } from '@/lib/server/account-auth';
import { readWorkspace } from '@/lib/server/account-store';
import { AccountError, assertOwner } from '@/lib/accounts/policy';
import { parseForecastCsv } from '@/lib/monitoring/forecast-csv';
import { forecastStock, datePlus, type StockInput } from '@/lib/monitoring/forecast';
import { sellerMonitoring } from '@/lib/server/seller-data';
import { wibDate } from '@/lib/monitoring/metrics';
import { getStock } from '@/lib/server/commerce-store';
import { nonprodEnabled } from '@/lib/server/nonprod-session';
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request), workspace = await readWorkspace(actor); assertOwner(workspace, actor);
    const data = await sellerMonitoring(workspace), stock = nonprodEnabled() ? await getStock() : {};
    const asOf = datePlus(wibDate(new Date().toISOString()), -1);
    const products: StockInput[] = workspace.listings.filter(item => item.kind !== 'SERVICE').map(item => {
      const quantities = new Map<string, number>();
      for (const order of data.orders.filter(order => order.status !== 'CANCELLED' && order.payment === 'PAID' && wibDate(order.createdAt) <= asOf)) {
        const quantity = order.items?.filter(row => row.productId === item.id).reduce((sum,row) => sum + row.quantity, 0) ?? 0;
        if (quantity) quantities.set(wibDate(order.createdAt), (quantities.get(wibDate(order.createdAt)) ?? 0) + quantity);
      }
      return { id:item.id, name:item.name, kind:item.kind as StockInput['kind'], unit:'unit', onHand:stock[item.id] ?? item.stock, incoming:0, leadDays:0, reviewDays:1, shelfLifeDays:item.shelfLifeDays ?? null, history:[...quantities].map(([date,quantity]) => ({ date,quantity })) };
    });
    return accountReply({ data: { source:'orders', asOf, products, results:products.map(product => forecastStock(product, asOf)) } });
  }
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

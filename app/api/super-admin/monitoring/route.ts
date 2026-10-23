import { accountFailure, accountIdentity, accountReply } from '@/lib/server/account-auth';
import { AccountError } from '@/lib/accounts/policy';
import { listBookings, listOrders } from '@/lib/server/commerce-store';
import { accountsFromDb } from '@/lib/server/nonprod-accounts';
import { nonprodEnabled } from '@/lib/server/nonprod-session';
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request); if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
    if (!nonprodEnabled()) throw new AccountError('Sumber transaksi production belum terhubung. Pengajuan seller tersedia di halaman review.', 503);
    const [orders, bookings, accounts] = await Promise.all([listOrders(), listBookings(), accountsFromDb()]);
    return accountReply({ data: { source: 'nonprod', asOf: new Date().toISOString(), orders, bookings, accounts } });
  } catch (error) { return accountFailure(error); }
}

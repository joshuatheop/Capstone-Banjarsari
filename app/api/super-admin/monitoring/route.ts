import { accountFailure, accountIdentity, accountReply } from '@/lib/server/account-auth';
import { AccountError } from '@/lib/accounts/policy';
import { monitoringFixture } from '@/lib/monitoring/fixtures';
import { readCommerce } from '@/lib/server/commerce-store';
import { listWorkspaces } from '@/lib/server/account-store';
import { previewEnabled } from '@/lib/server/preview-session';
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request); if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
    if (!previewEnabled()) throw new AccountError('Sumber transaksi production belum terhubung. Pengajuan seller tersedia di halaman review.', 503);
    const local = await readCommerce(), workspaces = await listWorkspaces();
    return accountReply({ data: { ...monitoringFixture, asOf: new Date().toISOString(), orders: [...local.orders, ...monitoringFixture.orders], bookings: [...local.bookings, ...monitoringFixture.bookings], accounts: [...monitoringFixture.accounts, ...workspaces.map(workspace => ({ id: workspace.access.uid, name: workspace.name || workspace.email, role: workspace.business ? 'seller' : 'customer', active: workspace.access.sellerStatus !== 'SUSPENDED', business: workspace.business?.businessName }))] } });
  } catch (error) { return accountFailure(error); }
}

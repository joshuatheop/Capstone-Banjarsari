import 'server-only';
import type { MonitorAccount } from '@/lib/monitoring/types';
import { rpc } from './nonprod-db';
import { listWorkspaces } from './account-store';

// Daftar akun untuk monitoring: customer dari tabel users, seller dari workspace yang punya toko.
export async function accountsFromDb(): Promise<MonitorAccount[]> {
  const [users, workspaces] = await Promise.all([
    rpc<{ user_id: string; display_name: string | null; email: string; role: string }[]>('users_list'),
    listWorkspaces(),
  ]);
  const sellers = new Map(workspaces.filter(w => w.business).map(w => [w.access.uid, w]));
  return [
    ...users.filter(u => u.role !== 'admin').map(u => {
      const seller = sellers.get(u.user_id);
      return { id: u.user_id, name: u.display_name || u.email, role: seller ? 'seller' as const : 'customer' as const, active: seller ? seller.access.sellerStatus !== 'SUSPENDED' : true, ...(seller?.business ? { business: seller.business.businessName } : {}) };
    }),
    ...[...sellers.values()].filter(w => !users.some(u => u.user_id === w.access.uid)).map(w => ({ id: w.access.uid, name: w.name || w.email, role: 'seller' as const, active: w.access.sellerStatus !== 'SUSPENDED', business: w.business?.businessName })),
  ];
}

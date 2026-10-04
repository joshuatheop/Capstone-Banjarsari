import { accountFailure, accountIdentity, accountReply } from '@/lib/server/account-auth';
import { adminServices, listWorkspaces } from '@/lib/server/account-store';
import { AccountError } from '@/lib/accounts/policy';
import { previewEnabled } from '@/lib/server/preview-session';
import { registeredCustomers } from '@/lib/server/preview-identities';
interface DirectoryUser { uid: string; email?: string; displayName?: string; disabled?: boolean; customClaims?: Record<string, unknown> }
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request); if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
    const workspaces = await listWorkspaces(), token = new URL(request.url).searchParams.get('pageToken') ?? undefined;
    const result: { users: DirectoryUser[]; pageToken?: string } = previewEnabled() ? { users: [{ uid:'preview-admin', email:'admin@palugada.local', displayName:'Admin Banjarsari', customClaims:{ role:'SUPER_ADMIN' } }, { uid:'preview-customer', email:'user@palugada.local', displayName:'Warga Banjarsari' }, ...await registeredCustomers()] } : await adminServices().auth.listUsers(100, token);
    return accountReply({ users: result.users.map(user => { const workspace = workspaces.find(workspace => workspace.access.uid === user.uid); return { uid:user.uid, name:user.displayName || user.email, email:user.email, roles:[...new Set([...(workspace?.access.roles ?? ['CUSTOMER']), ...(user.customClaims?.role === 'SUPER_ADMIN' || user.customClaims?.super_admin === true ? ['SUPER_ADMIN'] : [])])], sellerStatus:workspace?.access.sellerStatus ?? 'NONE', disabled:user.disabled ?? false }; }), nextPageToken: result.pageToken ?? null });
  } catch (error) { return accountFailure(error); }
}

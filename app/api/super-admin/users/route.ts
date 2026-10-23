import { accountFailure, accountIdentity, accountReply } from '@/lib/server/account-auth';
import { adminServices, listWorkspaces } from '@/lib/server/account-store';
import { AccountError } from '@/lib/accounts/policy';
import { nonprodEnabled } from '@/lib/server/nonprod-session';
import { rpc } from '@/lib/server/nonprod-db';
interface DirectoryUser { uid: string; email?: string; displayName?: string; disabled?: boolean; customClaims?: Record<string, unknown> }
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request); if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
    const workspaces = await listWorkspaces(), token = new URL(request.url).searchParams.get('pageToken') ?? undefined;
    const result: { users: DirectoryUser[]; pageToken?: string } = nonprodEnabled() ? { users: (await rpc<{ user_id: string; display_name: string | null; email: string; role: string }[]>('users_list')).map(row => ({ uid: row.user_id, email: row.email, displayName: row.display_name ?? undefined, ...(row.role === 'admin' ? { customClaims: { role: 'SUPER_ADMIN' } } : {}) })) } : await adminServices().auth.listUsers(100, token);
    return accountReply({ users: result.users.map(user => { const workspace = workspaces.find(workspace => workspace.access.uid === user.uid); return { uid:user.uid, name:user.displayName || user.email, email:user.email, roles:[...new Set([...(workspace?.access.roles ?? ['CUSTOMER']), ...(user.customClaims?.role === 'SUPER_ADMIN' || user.customClaims?.super_admin === true ? ['SUPER_ADMIN'] : [])])], sellerStatus:workspace?.access.sellerStatus ?? 'NONE', disabled:user.disabled ?? false }; }), nextPageToken: result.pageToken ?? null });
  } catch (error) { return accountFailure(error); }
}

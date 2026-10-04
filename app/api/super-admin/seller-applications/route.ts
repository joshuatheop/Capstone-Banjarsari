import { accountFailure, accountIdentity, accountInput, accountReply } from '@/lib/server/account-auth';
import { listWorkspaces, mutateWorkspace } from '@/lib/server/account-store';
import { AccountError, changeSellerStatus, reviewApplication } from '@/lib/accounts/policy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request); if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
    const workspaces = await listWorkspaces();
    return accountReply({ applications: workspaces.map(workspace => workspace.application).filter(Boolean), sellers: workspaces.filter(workspace => workspace.business).map(workspace => ({ business: workspace.business, email: workspace.email, access: workspace.access })) });
  } catch (error) { return accountFailure(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await accountIdentity(request); if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
    const input = await accountInput(request);
    if (typeof input.applicantId !== 'string' || !input.applicantId || input.applicantId.length > 128) throw new AccountError('Applicant tidak valid.');
    const subject = { uid: input.applicantId, email: '', name: '', superAdmin: false };
    const workspace = await mutateWorkspace(subject, workspace => {
      if (input.action === 'suspend' || input.action === 'reactivate') changeSellerStatus(workspace, actor, input.action === 'suspend');
      else reviewApplication(workspace, actor, String(input.action), input.reason, input.revision, new Date().toISOString());
    });
    return accountReply({ application: workspace.application, access: workspace.access });
  } catch (error) { return accountFailure(error); }
}

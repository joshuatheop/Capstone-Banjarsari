import { accountFailure, accountIdentity, accountInput, accountReply } from '@/lib/server/account-auth';
import { mutateWorkspace, readWorkspace } from '@/lib/server/account-store';
import { AccountError, saveApplication } from '@/lib/accounts/policy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const workspace = await readWorkspace(await accountIdentity(request)); return accountReply({ application: workspace.application, access: workspace.access }); }
  catch (error) { return accountFailure(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await accountIdentity(request), input = await accountInput(request);
    if (!['draft','submit'].includes(String(input.action))) throw new AccountError('Aksi pengajuan tidak valid.');
    const workspace = await mutateWorkspace(actor, workspace => saveApplication(workspace, actor, input, input.action === 'submit', new Date().toISOString()));
    return accountReply({ application: workspace.application });
  } catch (error) { return accountFailure(error); }
}

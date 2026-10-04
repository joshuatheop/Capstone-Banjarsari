import { accessFor, accountFailure, accountIdentity, accountReply } from '@/lib/server/account-auth';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { const identity = await accountIdentity(request); return accountReply({ access: await accessFor(identity) }); }
  catch (error) { return accountFailure(error); }
}

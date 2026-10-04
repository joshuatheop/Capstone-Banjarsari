import Link from 'next/link';
import { pageIdentity } from '@/lib/server/account-auth';
import { readWorkspace } from '@/lib/server/account-store';
import { AccountError, assertOwner } from '@/lib/accounts/policy';
import WorkspaceShell from './WorkspaceShell';
import styles from './accounts.module.css';
export default async function WorkspaceGate({ scope, children }: { scope: 'seller' | 'super-admin'; children: React.ReactNode }) {
  let error = '';
  try {
    const actor = await pageIdentity();
    if (scope === 'super-admin' && !actor.superAdmin) throw new AccountError('Dashboard ini hanya untuk SUPER_ADMIN.', 403);
    if (scope === 'seller') assertOwner(await readWorkspace(actor), actor);
  } catch (reason) { error = reason instanceof AccountError ? reason.message : 'Akses belum dapat diverifikasi. Coba lagi.'; }
  if (error) return <main className={styles.page}><h1>Akses workspace dibatasi</h1><p role="alert">{error}</p><Link className={styles.primary} href="/profile">Kembali ke akun</Link><Link className={styles.secondary} href="/login">Masuk</Link></main>;
  return <WorkspaceShell scope={scope}>{children}</WorkspaceShell>;
}

'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { accountFetch } from '@/lib/account-client';
import { customerAccess, type AccountAccess } from '@/lib/accounts/types';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
const Context = createContext<{ access: AccountAccess | null; loading: boolean; error: string; refresh: () => Promise<void> }>({ access: null, loading: true, error: '', refresh: async () => {} });
export function AccountAccessProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<AccountAccess | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const uid = user?.uid;
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!uid) { setAccess(null); setLoading(false); return; }
    try {
      const response = await accountFetch('/api/account'); const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (version === requestVersion.current) { setAccess(body.access); setError(''); }
    } catch (reason) { if (version === requestVersion.current) { setAccess(customerAccess(uid)); setError(reason instanceof Error ? reason.message : 'Akses akun belum tersedia.'); } }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [uid]);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const invalidatePending = () => { requestVersion.current++; };
    const reload = () => { if (active) void refresh(); };
    const timer = setTimeout(async () => {
      if (uid && !LOCAL_PREVIEW) { try { await accountFetch('/api/account/session', { method: 'POST' }); } catch {} }
      reload();
    }, 0);
    window.addEventListener('focus', reload);
    const interval = setInterval(reload, 30000);
    return () => { active = false; invalidatePending(); clearTimeout(timer); clearInterval(interval); window.removeEventListener('focus', reload); };
  }, [uid, authLoading, refresh]);
  const current = access?.uid === uid ? access : null;
  return <Context.Provider value={{ access: current, loading: authLoading || loading || !!uid && !current, error, refresh }}>{children}</Context.Provider>;
}
export const useAccountAccess = () => useContext(Context);

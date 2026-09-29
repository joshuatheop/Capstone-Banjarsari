'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { readCustomerProfile, saveCustomerProfile } from '@/lib/customer-profile';
import { emptyProfile, profileIsComplete, type CustomerProfile } from '@/lib/commerce/profile';
interface ProfileState { profile: CustomerProfile; ready: boolean; error: string; save: (value: CustomerProfile) => Promise<void>; reload: () => void }
const Context = createContext<ProfileState | null>(null);
export function CustomerProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth(); const pathname = usePathname(); const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile>(emptyProfile), [loadedUid, setLoadedUid] = useState(''), [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setError(''); setLoadedUid('');
      if (!user) { setProfile(emptyProfile); setLoadedUid('guest'); return; }
      readCustomerProfile(user.uid, user.displayName).then(value => { if (active) setProfile(value); })
        .catch(() => { if (active) { setProfile(emptyProfile); setError('Profil belum dapat dimuat. Coba lagi atau lengkapi profil kembali.'); } })
        .finally(() => { if (active) setLoadedUid(user.uid); });
    }, 0);
    window.addEventListener('storage', reload);
    return () => { active = false; clearTimeout(timer); window.removeEventListener('storage', reload); };
  }, [user, revision, reload]);
  const ready = !loading && loadedUid === (user?.uid ?? 'guest');
  useEffect(() => {
    if (ready && user && role !== 'admin' && !profileIsComplete(profile) && !pathname.startsWith('/profile/')) router.replace(`/profile/complete?next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [ready, user, role, profile, pathname, router]);
  const save = async (value: CustomerProfile) => { if (!user) throw new Error('Masuk untuk menyimpan profil.'); const saved = await saveCustomerProfile(user.uid, value); setProfile(saved); setError(''); };
  return <Context.Provider value={{ profile, ready, error, save, reload }}>{children}</Context.Provider>;
}
export function useCustomerProfile() { const value = useContext(Context); if (!value) throw new Error('CustomerProfileProvider is required'); return value; }

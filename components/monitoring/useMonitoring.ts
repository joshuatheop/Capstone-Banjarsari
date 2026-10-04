'use client';
import { usePathname } from 'next/navigation';
import { accountFetch } from '@/lib/account-client';
import { useCallback, useEffect, useState } from 'react';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import type { MonitoringData } from '@/lib/monitoring/types';

export const useMonitoring = (customer = false) => {
  const seller = usePathname().startsWith('/seller');
  const [data, setData] = useState<MonitoringData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    if (!LOCAL_PREVIEW && customer) { setError('Sumber data transaksi belum terhubung. Aktifkan pratinjau lokal untuk melihat contoh tampilan.'); setLoading(false); return; }
    try {
      const response = await accountFetch(customer ? '/api/local/activity' : seller ? '/api/seller' : '/api/super-admin/monitoring', { cache: 'no-store', signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Data gagal dimuat.');
      setData(body.data);
    } catch (reason) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : 'Koneksi gagal. Coba lagi.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [customer, seller]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    return () => controller.abort();
  }, [load]);
  return { data, error, loading, reload: () => load() };
};

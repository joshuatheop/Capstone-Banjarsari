'use client';
import { useCallback, useEffect, useState } from 'react';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import type { MonitoringData } from '@/lib/monitoring/types';

export const useMonitoring = (customer = false) => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    if (!LOCAL_PREVIEW) { setError('Sumber data transaksi belum terhubung. Aktifkan pratinjau lokal untuk melihat contoh tampilan.'); setLoading(false); return; }
    try {
      const response = await fetch(customer ? '/api/local/activity' : '/api/local/monitoring', { cache: 'no-store', signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Data gagal dimuat.');
      setData(body.data);
    } catch (reason) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : 'Koneksi gagal. Coba lagi.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [customer]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    return () => controller.abort();
  }, [load]);
  return { data, error, loading, reload: () => load() };
};

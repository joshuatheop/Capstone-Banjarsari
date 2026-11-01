'use client';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { serviceContactUrl } from '@/lib/commerce/service-contact';
import styles from '@/components/accounts/accounts.module.css';
export default function ServiceContact({ phone, name, provider, onContact }: { onContact?: () => void; phone?: string | null; name: string; provider: string }) {
  const [schedule, setSchedule] = useState(''), [notes, setNotes] = useState(''), [confirmed, setConfirmed] = useState(false), [error, setError] = useState('');
  const direct = serviceContactUrl(phone, name, provider);
  let scheduled: string | null = null;
  try { if (confirmed) scheduled = serviceContactUrl(phone, name, provider, schedule, notes); } catch {}
  return <section className={styles.card}><h2>Hubungi penyedia jasa</h2><p>Tanyakan ketersediaan langsung. Tidak perlu membuat booking terlebih dahulu.</p>{direct ? <a className={styles.primary} href={direct} onClick={onContact} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp Penyedia Jasa</a> : <p className={styles.notice}>Nomor WhatsApp penyedia belum tersedia atau tidak valid.</p>}
    <details className={styles.card}><summary>Usulkan jadwal (opsional)</summary><form className={styles.form} onSubmit={event => { event.preventDefault(); setError(''); try { if (!serviceContactUrl(phone, name, provider, schedule, notes)) throw new Error('Kontak penyedia belum tersedia.'); setConfirmed(true); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Permintaan tidak valid.'); } }}><label>Tanggal & jam (waktu perangkat)<input type="datetime-local" value={schedule} onChange={event => { setSchedule(event.target.value); setConfirmed(false); }}/></label><label>Kebutuhan (opsional)<textarea maxLength={500} value={notes} onChange={event => { setNotes(event.target.value); setConfirmed(false); }}/></label><button className={styles.secondary} disabled={!direct}>Konfirmasi permintaan</button>{error && <p className={styles.error} role="alert">{error}</p>}{scheduled && <a className={styles.primary} href={scheduled} onClick={onContact} target="_blank" rel="noopener noreferrer">Lanjut ke WhatsApp</a>}</form></details><p className={styles.muted}>Membuka WhatsApp hanya menyiapkan pesan. Layanan dan jadwal belum dikonfirmasi sampai penyedia menyetujuinya; permintaan ini tidak otomatis membuat booking internal.</p></section>;
}

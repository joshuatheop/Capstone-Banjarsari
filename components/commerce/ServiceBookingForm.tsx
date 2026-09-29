'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ArrowRight, MapPin, CalendarDays, CheckCircle2 } from 'lucide-react';
import type { CatalogEntry } from '@/lib/catalog';
import styles from './marketplace.module.css';
export default function ServiceBookingForm({ item }: { item: CatalogEntry }) {
  const [step, setStep] = useState(1), [address, setAddress] = useState(''), [schedule, setSchedule] = useState(''), [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [booked, setBooked] = useState(false);
  const [key] = useState(() => `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (step === 2) { const time = new Date(schedule).getTime(); if (!Number.isFinite(time) || time <= Date.now() || time > Date.now() + 90 * 86400000) { setError('Pilih jadwal di masa depan, maksimal 90 hari dari sekarang.'); return; } }
    if (step < 3) { setStep(step + 1); return; }
    setPending(true);
    try { const response = await fetch('/api/local/commerce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'booking', serviceId: item.id, schedule: new Date(schedule).toISOString(), address, notes, idempotencyKey: key }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setBooked(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Booking gagal. Coba lagi.'); } finally { setPending(false); }
  }
  if (booked) return <div className={styles.feedback} role="status"><CheckCircle2/><p>Booking uji berhasil dicatat. Penyedia belum mengonfirmasi jadwal.</p><Link href="/bookings" className={styles.mainButton}>Lihat booking saya</Link></div>;
  return <form className={styles.bookingForm} onSubmit={submit}><div className={styles.steps} aria-label={`Langkah ${step} dari 3`}><span data-active={step === 1}>1. Lokasi</span><span data-active={step === 2}>2. Jadwal</span><span data-active={step === 3}>3. Konfirmasi</span></div>
    {step === 1 && <label><span><MapPin size={15} style={{ display: 'inline' }}/> Alamat layanan</span><textarea required minLength={10} maxLength={500} value={address} onChange={event => setAddress(event.target.value)} placeholder="Jalan, nomor rumah, RT/RW, dan patokan lokasi"/></label>}
    {step === 2 && <><label><span><CalendarDays size={15} style={{ display: 'inline' }}/> Jadwal kunjungan (waktu perangkat Anda)</span><input type="datetime-local" required value={schedule} onChange={event => setSchedule(event.target.value)}/></label><label>Keluhan / kebutuhan (opsional)<textarea maxLength={500} value={notes} onChange={event => setNotes(event.target.value)}/></label></>}
    {step === 3 && <div className={styles.feedback}><strong>{item.name}</strong><p>{address}</p><p>{new Date(schedule).toLocaleString('id-ID')}</p>{notes && <p>{notes}</p>}<p>Estimasi: {item.priceLabel}. Harga dan jadwal akhir perlu dikonfirmasi penyedia.</p></div>}
    {error && <p role="alert" className={styles.feedback}>{error}</p>}<div className={styles.actionRow}>{step > 1 && <button className={styles.outlineButton} type="button" disabled={pending} onClick={() => { setError(''); setStep(step - 1); }}><ChevronLeft size={16}/>Kembali</button>}<button className={styles.mainButton} disabled={pending || !item.available}>{pending ? 'Mengirim…' : step === 3 ? 'Ajukan booking uji' : 'Lanjut'}<ArrowRight size={16}/></button></div>
  </form>;
}

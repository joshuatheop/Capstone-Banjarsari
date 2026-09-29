'use client';
import { useRef, useState } from 'react';
import { TicketPercent, ChevronRight, X } from 'lucide-react';
import { demoVouchers, voucherDiscount } from '@/lib/commerce/vouchers';
import { rupiah } from '@/lib/monitoring/metrics';
import market from './marketplace.module.css';
import styles from './refinement.module.css';
export default function VoucherSelector({ subtotal, code, onChange }: { subtotal: number; code: string; onChange: (code: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const [draft, setDraft] = useState(''), [error, setError] = useState('');
  const apply = (next: string) => { const normalized = next.trim().toUpperCase(); if (normalized && !voucherDiscount(normalized, subtotal)) { setError('Kode tidak tersedia atau minimum belanja belum terpenuhi.'); return; } onChange(normalized); dialog.current?.close(); setError(''); };
  return <section className={market.whitePanel}><h2><TicketPercent size={20}/>Voucher PALUGADA <small className={styles.demoBadge}>Demo</small></h2><button type="button" className={styles.voucherTrigger} onClick={() => { setDraft(code); setError(''); dialog.current?.showModal(); }}><span>{code ? `${code} · ${rupiah(voucherDiscount(code, subtotal))}` : 'Pilih / Masukkan Voucher'}</span><ChevronRight size={20}/></button>{code && !voucherDiscount(code, subtotal) && <p className={styles.muted}>Minimum belanja belum terpenuhi. Voucher tidak diterapkan.</p>}
    <dialog ref={dialog} className={market.sheet} aria-label="Voucher demo"><div className={market.sheetHeading}><h2>Voucher demo</h2><button type="button" aria-label="Tutup voucher" onClick={() => dialog.current?.close()}><X size={20}/></button></div><p>Potongan simulasi untuk transaksi lokal, bukan promo toko sesungguhnya. Satu voucher per checkout.</p><label>Kode voucher<input value={draft} maxLength={30} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); apply(draft); } }} onChange={e => setDraft(e.target.value)} placeholder="DEMOHEMAT10" autoCapitalize="characters"/></label><button type="button" className={market.mainButton} onClick={() => apply(draft)}>Terapkan kode</button>{error && <p role="alert" className={styles.error}>{error}</p>}<div className={styles.voucherList}>{demoVouchers.map(voucher => <article key={voucher.code}><strong>{voucher.title}</strong><p>{voucher.detail}</p><code>{voucher.code}</code><button type="button" className={market.outlineButton} disabled={!voucherDiscount(voucher.code, subtotal)} onClick={() => apply(voucher.code)}>{voucherDiscount(voucher.code, subtotal) ? `Pilih ${voucher.code}` : 'Minimum belum terpenuhi'}</button></article>)}</div><button type="button" className={styles.back} onClick={() => apply('')}>Tanpa voucher</button></dialog>
  </section>;
}

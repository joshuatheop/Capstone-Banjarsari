'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight, X } from 'lucide-react';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { addressIsComplete } from '@/lib/commerce/profile';
import market from './marketplace.module.css';
import styles from './refinement.module.css';
export default function AddressSelector({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { profile, ready, error } = useCustomerProfile(); const dialog = useRef<HTMLDialogElement>(null);
  const selected = profile.addresses.find(a => a.id === selectedId);
  return <section className={market.whitePanel}><h2><MapPin size={20}/>Alamat pengiriman / kontak</h2>{!ready ? <p role="status">Memuat profil…</p> : !addressIsComplete(selected) ? <p className={market.feedback}>Lengkapi nomor HP dan alamat terlebih dahulu sebelum melakukan transaksi. <Link href="/profile/complete">Lengkapi profil</Link></p> : <div className={market.savedContact}><strong>{selected!.recipient}</strong><p>{selected!.phone}</p><p>{selected!.label} · {selected!.address}</p>{selected!.note && <p>Patokan: {selected!.note}</p>}<button type="button" className={market.outlineButton} onClick={() => dialog.current?.showModal()}>Ubah <ChevronRight size={18}/></button></div>}{error && <p role="alert">{error}</p>}<p className={styles.muted}>Demo menggunakan ambil di toko. Alamat adalah kontak tersimpan, belum untuk pengantaran.</p>
    <dialog className={market.sheet} ref={dialog} aria-label="Pilih alamat tersimpan"><div className={market.sheetHeading}><h2>Pilih alamat tersimpan</h2><button type="button" aria-label="Tutup pilihan alamat" onClick={() => dialog.current?.close()}><X size={20}/></button></div><div className={styles.addressCards}>{profile.addresses.map(address => <button type="button" disabled={!addressIsComplete(address)} className={styles.addressCard} aria-pressed={address.id === selectedId} key={address.id} onClick={() => { onSelect(address.id); dialog.current?.close(); }}><MapPin size={20}/><span><strong>{address.label}{address.id === profile.defaultAddressId ? ' · Utama' : ''}</strong><span>{address.recipient} · {address.phone}</span><span>{address.address}</span></span></button>)}</div><Link className={market.outlineButton} href="/profile/addresses">Kelola / tambah alamat</Link></dialog>
  </section>;
}

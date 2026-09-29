'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Plus, Check, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { safeReturnPath, type CustomerProfile, type SavedAddress } from '@/lib/commerce/profile';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import ContactFields from './ContactFields';
import market from './marketplace.module.css';
import styles from './refinement.module.css';

export default function ProfileCompletion({ manage = false }: { manage?: boolean }) {
  const { user, loading } = useAuth(); const { profile, ready, error, reload } = useCustomerProfile();
  if (loading || !ready) return <main className={market.marketPage} role="status">Memuat profil…</main>;
  if (!user) return <main className={market.marketPage}><h1>Lengkapi profil</h1><Link className={market.mainButton} href="/login?next=/profile/complete">Masuk ke akun</Link></main>;
  return <main className={`${market.marketPage} ${styles.profilePage}`}><Link className={styles.back} href="/profile"><ChevronLeft size={20}/>Kembali ke akun</Link><h1>{manage ? 'Alamat tersimpan' : 'Lengkapi profilmu'}</h1><p>Lengkapi nomor HP dan alamat terlebih dahulu sebelum melakukan transaksi.</p>{error && <p role="alert">{error} <button onClick={reload}>Coba lagi</button></p>}<ProfileEditor initial={profile} manage={manage}/></main>;
}
function ProfileEditor({ initial, manage }: { initial: CustomerProfile; manage: boolean }) {
  const { profile, save } = useCustomerProfile(); const router = useRouter();
  const blank = (): SavedAddress => ({ id: `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: '', recipient: profile.name, address: '', phone: '', note: '' });
  const [name, setName] = useState(initial.name), [draft, setDraft] = useState<SavedAddress>(() => initial.addresses.find(a => a.id === initial.defaultAddressId) ?? blank());
  const [primary, setPrimary] = useState(true), [pending, setPending] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage(''); setPending(true);
    try {
      const addresses = profile.addresses.some(a => a.id === draft.id) ? profile.addresses.map(a => a.id === draft.id ? draft : a) : [...profile.addresses, draft];
      await save({ name, addresses, defaultAddressId: primary || !profile.addresses.length ? draft.id : profile.defaultAddressId });
      if (!manage) router.replace(safeReturnPath(new URLSearchParams(window.location.search).get('next')));
      else setMessage('Profil dan alamat berhasil disimpan.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Profil gagal disimpan.'); } finally { setPending(false); }
  }
  return <><div className={styles.addressCards}>{profile.addresses.map(address => <button className={styles.addressCard} key={address.id} onClick={() => { setDraft(address); setPrimary(address.id === profile.defaultAddressId); setMessage(''); }} aria-pressed={draft.id === address.id}><MapPin size={20}/><span><strong>{address.label} {profile.defaultAddressId === address.id && <small>Utama</small>}</strong><span>{address.recipient} · {address.phone}</span><span>{address.address}</span></span></button>)}{manage && profile.addresses.length < 10 && <button className={market.outlineButton} onClick={() => { setDraft(blank()); setPrimary(false); setMessage(''); }}><Plus size={18}/>Tambah alamat</button>}</div>
    <form onSubmit={submit} className={styles.profileForm}><h2>{profile.addresses.some(a => a.id === draft.id) ? 'Edit alamat' : 'Alamat pertama / baru'}</h2><label>Nama lengkap<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)}/></label><label>Label alamat<input required maxLength={40} value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="Rumah, Kantor, atau lainnya"/></label><label>Nama penerima<input required minLength={2} maxLength={100} autoComplete="shipping name" value={draft.recipient} onChange={e => setDraft({ ...draft, recipient: e.target.value })}/></label><ContactFields value={draft} onChange={value => setDraft({ ...draft, ...value })} disabled={pending}/><label>Patokan / catatan alamat (opsional)<input maxLength={200} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}/></label><label className={styles.check}><input type="checkbox" checked={primary} onChange={e => setPrimary(e.target.checked)}/>Jadikan alamat utama</label>
      {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={market.feedback}><Check size={17}/>{message}</p>}<button className={market.mainButton} disabled={pending}>{pending ? 'Menyimpan…' : manage ? 'Simpan alamat' : 'Simpan & lanjutkan'}</button>
      {manage && profile.addresses.length > 1 && profile.addresses.some(a => a.id === draft.id) && <button type="button" className={styles.subtleDanger} disabled={pending} onClick={async () => { if (!confirm('Hapus alamat ini?')) return; setPending(true); try { const addresses = profile.addresses.filter(a => a.id !== draft.id); await save({ ...profile, addresses, defaultAddressId: profile.defaultAddressId === draft.id ? addresses[0].id : profile.defaultAddressId }); setDraft(addresses[0]); setPrimary(profile.defaultAddressId === draft.id || profile.defaultAddressId === addresses[0].id); } catch { setError('Alamat gagal dihapus.'); } finally { setPending(false); } }}><Trash2 size={16}/>Hapus alamat ini</button>}
      <p className={styles.muted}>{LOCAL_PREVIEW ? 'Profil demo tersimpan per akun di browser ini.' : 'Kontak utama disimpan ke profil. Label, penerima, patokan, dan alamat tambahan tersimpan di browser ini.'}</p>
    </form></>;
}

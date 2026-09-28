'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Store, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { CatalogEntry } from '@/lib/catalog';
import { rupiah } from '@/lib/monitoring/metrics';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import ProductVisual from './ProductVisual';
import styles from './marketplace.module.css';

interface CartPageProps { catalog: CatalogEntry[]; checkout?: boolean }
const CartPage = ({ catalog, checkout = false }: CartPageProps) => {
  const cart = useCart(); const { user, role } = useAuth();
  const [stock, setStock] = useState<Record<string, number>>({});
  const [address, setAddress] = useState(''), [phone, setPhone] = useState(''), [note, setNote] = useState('');
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [key] = useState(() => `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  useEffect(() => { if (LOCAL_PREVIEW) fetch('/api/local/commerce').then((r) => r.json()).then((data) => setStock(data.stock ?? {})).catch(() => setError('Stok belum dapat dimuat. Muat ulang halaman.')); }, []);
  const lines = cart.items.map((line) => ({ ...line, item: catalog.find((p) => p.id === line.productId && p.kind !== 'service') }));
  const total = lines.reduce((sum, line) => sum + (line.item?.price ?? 0) * line.quantity, 0);
  const groups = [...new Set(lines.map((line) => line.item?.businessId ?? 'unknown'))];
  const invalid = lines.some((line) => !line.item || !line.item.available || line.quantity > (stock[line.productId] ?? 0));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setPending(true); setError('');
    try { const response = await fetch('/api/local/commerce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'checkout', items: cart.items, address, phone, note, idempotencyKey: key }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSuccess(data.orders[0].checkoutId); cart.clear(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pesanan gagal dibuat.'); } finally { setPending(false); }
  };
  return <main className={styles.marketPage}><div className={styles.breadcrumb}><Link href="/">Beranda</Link> / <Link href="/cart">Keranjang</Link>{checkout && ' / Checkout'}</div><h1>{checkout ? 'Checkout' : 'Keranjang belanja'}</h1><div className={styles.steps}><span data-active={!checkout}>1. Pilih produk</span><span data-active={checkout}>2. Alamat & pembayaran</span><span data-active={!!success}>3. Pesanan tercatat</span></div>
    {success ? <section className={styles.emptyState}><CheckCircle2 size={48} /><h2>Pesanan uji berhasil dibuat</h2><p>{success} · Pesanan dikelompokkan per seller dan menunggu konfirmasi. Tidak ada pembayaran nyata.</p><Link className={styles.mainButton} href="/orders">Lihat pesanan saya <ArrowRight size={18} /></Link></section> : !cart.ready ? <p role="status">Memuat keranjang…</p> : !lines.length ? <section className={styles.emptyState}><ShoppingCart size={48} /><h2>Keranjang masih kosong</h2><p>Temukan kebutuhan Anda dan tambahkan ke keranjang.</p><Link className={styles.mainButton} href="/katalog">Mulai belanja</Link></section> : <form onSubmit={submit} className={styles.cartLayout}><div>
      {checkout && <section className={styles.whitePanel}><h2>Informasi customer</h2><p>Demo menggunakan ambil di toko dan bayar tunai. Alamat dipakai sebagai catatan customer; delivery belum aktif.</p><label>Alamat lengkap<textarea required minLength={10} maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jalan, nomor rumah, RT/RW, Banjarsari" /></label><label>Nomor HP<input type="tel" inputMode="tel" autoComplete="tel" required pattern="0[0-9]{8,14}" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></label><label>Catatan untuk seller (opsional)<input maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label></section>}
      {groups.map((group) => <section className={styles.whitePanel} key={group}><h2><Store size={18} />{catalog.find((p) => p.businessId === group)?.business ?? 'Produk tidak tersedia'}</h2>{lines.filter((line) => (line.item?.businessId ?? 'unknown') === group).map((line) => <div className={styles.cartLine} key={line.productId}><div className={styles.cartImage}><ProductVisual id={line.productId} name={line.item?.name ?? 'Produk'} /></div><div className={styles.cartItemInfo}><Link href={line.item?.href ?? '/katalog'}>{line.item?.name ?? 'Produk tidak tersedia'}</Link><strong>{rupiah(line.item?.price ?? 0)}</strong><small>Stok: {stock[line.productId] ?? '…'}</small></div><div className={styles.quantity}><button type="button" aria-label={`Kurangi ${line.item?.name}`} onClick={() => cart.update(line.productId, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" aria-label={`Tambah ${line.item?.name}`} disabled={line.quantity >= (stock[line.productId] ?? 0)} onClick={() => cart.update(line.productId, line.quantity + 1)}>+</button></div><button type="button" className={styles.removeButton} aria-label={`Hapus ${line.item?.name}`} onClick={() => cart.update(line.productId, 0)}><Trash2 size={18} /></button></div>)}</section>)}
    </div><aside className={styles.summary}><h2>Ringkasan belanja</h2><div><span>Total produk ({cart.count})</span><strong>{rupiah(total)}</strong></div><div><span>Pengambilan</span><span>Ambil di toko</span></div><div><span>Biaya layanan demo</span><span>Rp 0</span></div><hr /><div><strong>Total pembayaran</strong><b>{rupiah(total)}</b></div>{checkout && <label className={styles.paymentChoice}><input type="radio" checked readOnly /> Tunai saat pengambilan (demo)</label>}{invalid && <p role="alert">Ada produk tidak tersedia atau stok belum dimuat. Perbarui keranjang.</p>}{error && <p role="alert">{error}</p>}{!user ? <Link className={styles.mainButton} href="/login?next=/cart">Masuk untuk melanjutkan</Link> : role !== 'customer' ? <p>Gunakan akun customer untuk berbelanja.</p> : checkout ? <button className={styles.mainButton} disabled={pending || invalid || !LOCAL_PREVIEW}>{pending ? 'Membuat pesanan…' : 'Buat pesanan uji'}</button> : <Link className={styles.mainButton} href="/checkout">Lanjut checkout <ArrowRight size={18} /></Link>}<p className={styles.summaryNote}><ShieldCheck size={16} /> Harga dan stok diperiksa ulang oleh server. Tidak ada pembayaran nyata.</p></aside></form>}
  </main>;
};
export default CartPage;

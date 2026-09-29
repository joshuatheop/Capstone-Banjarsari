'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { profileIsComplete, addressIsComplete } from '@/lib/commerce/profile';
import { voucherDiscount } from '@/lib/commerce/vouchers';
import AddressSelector from './AddressSelector';
import VoucherSelector from './VoucherSelector';


import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Store, CheckCircle2, ArrowRight, ShieldCheck, Leaf, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { CatalogEntry } from '@/lib/catalog';
import { rupiah } from '@/lib/monitoring/metrics';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import ProductVisual from './ProductVisual';
import CatalogCard from './CatalogCard';
import styles from './marketplace.module.css';

export default function CartPage({ catalog, checkout = false, directProductId, directQuantity = 1 }: { catalog: CatalogEntry[]; checkout?: boolean; directProductId?: string; directQuantity?: number }) {
  const cart = useCart(); const { user, role } = useAuth(); const router = useRouter();
  const direct = directProductId !== undefined;
  const { profile, ready: contactLoaded } = useCustomerProfile();
  const [selectedAddressId, setSelectedAddressId] = useState(''), [voucher, setVoucher] = useState('');
  const selectedAddress = profile.addresses.find(a => a.id === (selectedAddressId || profile.defaultAddressId));
  const contactReady = profileIsComplete(profile) && addressIsComplete(selectedAddress);
  const voucherKey = `palugada-voucher:${user?.uid ?? 'guest'}`;
  const [stock, setStock] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [key] = useState(() => `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  useEffect(() => { if (LOCAL_PREVIEW) fetch('/api/local/commerce').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => setStock(data.stock ?? {})).catch(() => setError('Stok belum dapat dimuat. Muat ulang halaman.')); }, []);
  useEffect(() => { const timer = setTimeout(() => { try { setVoucher(localStorage.getItem(voucherKey) ?? ''); } catch { setVoucher(''); } }, 0); return () => clearTimeout(timer); }, [voucherKey]);
  const chooseVoucher = (code: string) => { setVoucher(code); try { localStorage.setItem(voucherKey, code); } catch { setError('Voucher hanya tersimpan untuk halaman ini.'); } };
  const allLines = (direct ? [{ productId: directProductId, quantity: directQuantity, selected: true }] : cart.items).map(line => ({ ...line, item: catalog.find(p => p.id === line.productId && p.kind !== 'service') }));
  const selected = allLines.filter(line => line.selected !== false);
  const lines = checkout ? selected : allLines;
  const count = selected.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = selected.reduce((sum, line) => sum + (line.item?.price ?? 0) * line.quantity, 0);
  const discount = LOCAL_PREVIEW ? voucherDiscount(voucher, subtotal) : 0;
  const total = subtotal - discount;
  const groups = [...new Set(lines.map(line => line.item?.businessId ?? 'unknown'))];
  const invalid = !selected.length || selected.some(line => !line.item || !line.item.available || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 || line.quantity > (stock[line.productId] ?? 0));
  const remove = (id: string, name: string) => { if (window.confirm(`Hapus ${name} dari keranjang?`)) cart.remove([id]); };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending || invalid || !contactLoaded || !contactReady || !user || role !== 'customer') return; setPending(true); setError('');
    try {
      if (!selectedAddress) throw new Error('Pilih alamat tersimpan.');
      const response = await fetch('/api/local/commerce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'checkout', items: selected.map(({ productId, quantity }) => ({ productId, quantity })), address: selectedAddress.address, phone: selectedAddress.phone, customerName: profile.name, recipientName: selectedAddress.recipient, voucherCode: discount ? voucher : undefined, note, idempotencyKey: key }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setSuccess(data.orders[0].checkoutId); chooseVoucher(''); if (!direct) cart.remove(selected.map(line => line.productId)); router.replace(`/orders?checkout=${encodeURIComponent(data.orders[0].checkoutId)}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Pesanan gagal dibuat.'); } finally { setPending(false); }
  }
  return <main className={styles.marketPage}><div className={styles.breadcrumb}><Link href="/">Beranda</Link> / <Link href="/cart">Keranjang</Link>{checkout && ' / Checkout'}</div><h1>{checkout ? 'Selesaikan pesananmu' : 'Keranjang belanja'}</h1><div className={styles.steps}><span data-active={!checkout}>1. Pilih produk</span><span data-active={checkout}>2. Alamat & pembayaran</span><span data-active={!!success}>3. Pesanan tercatat</span></div>
    {success ? <section className={styles.emptyState}><CheckCircle2 size={48}/><h2>Pesanan uji berhasil dibuat</h2><p>{success} · Pesanan dikelompokkan per toko dan menunggu konfirmasi. Tidak ada pembayaran nyata.</p><Link className={styles.mainButton} href="/orders">Lihat pesanan saya <ArrowRight size={18}/></Link></section> : !cart.ready ? <p role="status">Memuat keranjang…</p> : !lines.length ? <section className={styles.emptyState}><ShoppingCart size={48}/><h2>{checkout && allLines.length ? 'Pilih produk untuk checkout' : 'Keranjang masih kosong'}</h2><p>Temukan kebutuhanmu dan pilih produk yang ingin dipesan.</p><Link className={styles.mainButton} href={checkout && allLines.length ? '/cart' : '/katalog'}>{checkout && allLines.length ? 'Kembali ke keranjang' : 'Mulai belanja'}</Link></section> : <>
    {!checkout && <><p className={styles.feedback}><Leaf size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }}/>Yuk, selesaikan pesananmu! Dukung produk lokal Banjarsari.</p><div className={styles.selectAll}><label><input type="checkbox" checked={selected.length === allLines.length} onChange={e => cart.select(allLines.map(line => line.productId), e.target.checked)}/>Pilih semua ({allLines.length})</label><button onClick={() => { if (window.confirm('Hapus semua produk dari keranjang?')) cart.clear(); }}><Trash2 size={15} style={{ display: 'inline', verticalAlign: 'middle' }}/> Hapus semua</button></div></>}
    <form onSubmit={submit} className={styles.cartLayout}><div>
      {checkout && <><AddressSelector selectedId={selectedAddressId || profile.defaultAddressId} onSelect={setSelectedAddressId}/><section className={styles.whitePanel}><div className={styles.fulfillment}><Store size={23}/><div><strong>Ambil di toko</strong><p>Bayar tunai saat pengambilan. Pengantaran belum aktif pada demo.</p></div></div><label>Catatan untuk toko (opsional)<input maxLength={500} value={note} onChange={e => setNote(e.target.value)}/></label></section></>}
      {groups.map(group => { const groupLines = lines.filter(line => (line.item?.businessId ?? 'unknown') === group); const seller = catalog.find(p => p.businessId === group)?.business ?? 'Produk tidak tersedia'; return <section className={styles.whitePanel} key={group}><h2>{!checkout && <label><input aria-label={`Pilih semua produk ${seller}`} type="checkbox" checked={groupLines.every(line => line.selected !== false)} onChange={e => cart.select(groupLines.map(line => line.productId), e.target.checked)}/></label>}<Store size={21}/><Link href={group === 'unknown' ? '/katalog' : `/bisnis/${group}`}>{seller}</Link></h2>{groupLines.map(line => <div className={styles.cartLine} key={line.productId}>{!checkout && <input type="checkbox" aria-label={`Pilih ${line.item?.name ?? 'produk'}`} checked={line.selected !== false} onChange={e => cart.select([line.productId], e.target.checked)}/>}<div className={styles.cartImage}>{line.item?.image ? <Image src={line.item.image} alt={line.item.name} width={84} height={84} unoptimized/> : <ProductVisual id={line.productId} name={line.item?.name ?? 'Produk'}/>}</div><div className={styles.cartItemInfo}><Link href={line.item?.href ?? '/katalog'}>{line.item?.name ?? 'Produk tidak tersedia'}</Link><strong>{rupiah(line.item?.price ?? 0)}</strong><small>{!line.item?.available ? 'Produk tidak tersedia' : `Stok: ${stock[line.productId] ?? 'memuat…'}`}</small>{line.quantity > (stock[line.productId] ?? Infinity) && <small role="alert">Kurangi jumlah sesuai stok tersedia.</small>}</div>{checkout ? <strong>{line.quantity} ×</strong> : <><div className={styles.quantity}><button type="button" aria-label={`Kurangi ${line.item?.name}`} onClick={() => line.quantity === 1 ? remove(line.productId, line.item?.name ?? 'produk') : cart.update(line.productId, line.quantity - 1)}><Minus size={16}/></button><span>{line.quantity}</span><button type="button" aria-label={`Tambah ${line.item?.name}`} disabled={line.quantity >= Math.min(stock[line.productId] ?? 0, 99)} onClick={() => cart.update(line.productId, line.quantity + 1)}><Plus size={16}/></button></div><button type="button" className={styles.removeButton} aria-label={`Hapus ${line.item?.name}`} onClick={() => remove(line.productId, line.item?.name ?? 'produk')}><Trash2 size={18}/></button></>}</div>)}<div className={styles.groupTotal}><span>Subtotal dipilih</span><strong>{rupiah(groupLines.filter(line => line.selected !== false).reduce((sum, line) => sum + (line.item?.price ?? 0) * line.quantity, 0))}</strong></div></section>; })}
    {LOCAL_PREVIEW && <VoucherSelector subtotal={subtotal} code={voucher} onChange={chooseVoucher}/>}</div><aside className={styles.summary} data-checkout={checkout}><h2>Ringkasan belanja</h2><div><span>Subtotal ({count} produk)</span><strong>{rupiah(subtotal)}</strong></div><div><span>Voucher / diskon demo</span><strong>−{rupiah(discount)}</strong></div><div><span>Biaya pengiriman</span><span>Rp 0 · Ambil di toko</span></div><hr/>{checkout && <label className={styles.paymentChoice}><input type="radio" checked readOnly/> Tunai saat pengambilan (demo)</label>}{checkout && contactLoaded && !contactReady && <p role="alert">Lengkapi nomor HP dan alamat terlebih dahulu sebelum melakukan transaksi. <Link href="/profile/complete">Lengkapi profil</Link></p>}{invalid && <p role="alert">{selected.length ? 'Periksa ketersediaan dan jumlah produk yang dipilih.' : 'Pilih minimal satu produk.'}</p>}{error && <p role="alert" className={styles.feedback}>{error}</p>}<div className={styles.checkoutDock}><span><small>Total dipilih</small><b>{rupiah(total)}</b></span>{!user ? <Link className={styles.mainButton} href={`/login?next=${encodeURIComponent(direct ? `/checkout?buy=${encodeURIComponent(directProductId)}&qty=${directQuantity}` : "/cart")}`}>Masuk</Link> : role !== 'customer' ? <p>Gunakan akun customer.</p> : checkout ? <button className={styles.mainButton} disabled={pending || invalid || !contactLoaded || !contactReady || !LOCAL_PREVIEW}>{pending ? 'Membuat pesanan…' : 'Buat pesanan uji'}</button> : invalid ? <button type="button" className={styles.mainButton} disabled>Checkout ({count})</button> : <Link className={styles.mainButton} href="/checkout">Checkout ({count}) <ArrowRight size={16}/></Link>}</div><p className={styles.summaryNote}><ShieldCheck size={15}/>Harga dan stok diperiksa ulang. Tidak ada pembayaran nyata.</p></aside></form></>}
    {!checkout && !success && cart.ready && <section><div className={styles.sectionTitle}><div><h2>Pilihan lain dari warga</h2><p>Lengkapi kebutuhanmu dari usaha lokal</p></div><Link href="/katalog">Lihat semua <ArrowRight size={16}/></Link></div><div className={styles.productGrid}>{catalog.filter(item => item.kind !== 'service' && item.available && !cart.items.some(line => line.productId === item.id)).slice(0, 4).map(item => <CatalogCard key={item.id} item={item}/>)}</div></section>}
  </main>;
}

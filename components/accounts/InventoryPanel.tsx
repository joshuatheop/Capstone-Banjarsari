'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { InventoryAdjustment, InventoryLocation, SellerListing } from '@/lib/accounts/types';
import type { MonitorOrder } from '@/lib/monitoring/types';
import ForecastDashboard from '@/components/monitoring/ForecastDashboard';
import styles from './accounts.module.css';
export default function InventoryPanel({ availableStock, listings, locations, adjustments, orders, pending, mutate }: {
  availableStock: Record<string, number>; listings: SellerListing[]; locations: InventoryLocation[]; adjustments: InventoryAdjustment[]; orders: MonitorOrder[]; pending: boolean;
  mutate: (action: string, values: Record<string, unknown>) => Promise<boolean>;
}) {
  const query = useSearchParams();
  const [selected, setSelected] = useState(query.get('product') ?? ''), [locationId, setLocationId] = useState('store'), [delta, setDelta] = useState(''), [reason, setReason] = useState(''), [name, setName] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const products = listings.filter(item => item.kind !== 'SERVICE'), item = products.find(row => row.id === selected) ?? products[0];
  const history = item ? orders.filter(order => order.items?.some(row => row.productId === item.id)) : [];
  return <><p className={styles.notice}>Saldo lokasi adalah catatan persediaan seller, terpisah dari stok tersedia transaksi. Reservasi dan fulfillment belum dialokasikan ke lokasi; jangan kurangi kembali stok pesanan yang sudah dicatat checkout. Penyesuaian di sini menambah/mengurangi stok tersedia sebesar perubahan unit.</p>
    <form className={`${styles.card} ${styles.form}`} onSubmit={async event => { event.preventDefault(); if (await mutate('location', { name })) setName(''); }}><h2>Lokasi persediaan</h2><p>{locations.map(row => row.name).join(' · ')}</p><label>Tambah lokasi toko / gudang<input required minLength={2} maxLength={80} value={name} onChange={event => setName(event.target.value)}/></label><button className={styles.secondary} disabled={pending}>Tambah lokasi</button></form>
    {!item ? <p className={styles.notice}>Tambahkan produk dahulu untuk mencatat persediaan.</p> : <><label>Pilih produk<select className={styles.filter} value={item.id} onChange={event => { setSelected(event.target.value); setKey(crypto.randomUUID()); setDelta(''); setReason(''); }}>{products.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
    <section className={styles.card}><h2>{item.name}</h2><p>Stok tersedia checkout: <strong>{availableStock[item.id] ?? 'Belum terhubung'}{availableStock[item.id] !== undefined ? ' unit' : ''}</strong></p><p>Total saldo tercatat: <strong>{item.stock} unit</strong></p><div className={styles.stats}>{locations.map(location => <article key={location.id}>{location.name}<strong>{(item.stockByLocation ?? { store: item.stock })[location.id] ?? 0}</strong><small>unit tercatat</small></article>)}</div>
    <form className={styles.form} onSubmit={async event => { event.preventDefault(); if (await mutate('adjustment', { listingId: item.id, locationId, delta: Number(delta), reason, idempotencyKey: key })) { setKey(crypto.randomUUID()); setDelta(''); setReason(''); } }}><h3>Penyesuaian stok</h3><label>Lokasi<select value={locationId} onChange={event => { setLocationId(event.target.value); setKey(crypto.randomUUID()); }}>{locations.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Perubahan unit (+ masuk / − keluar)<input type="number" step={1} min={-1000000} max={1000000} required value={delta} onChange={event => { setDelta(event.target.value); setKey(crypto.randomUUID()); }}/></label><label>Alasan<textarea minLength={5} maxLength={500} required value={reason} onChange={event => { setReason(event.target.value); setKey(crypto.randomUUID()); }}/></label><button className={styles.primary} disabled={pending || !Number(delta)}>{pending ? 'Menyimpan…' : 'Catat penyesuaian'}</button></form></section>
    <section className={styles.card}><h2>Riwayat stok</h2>{adjustments.filter(row => row.listingId === item.id).reverse().map(row => <article className={styles.journal} key={row.id}><strong>{row.delta > 0 ? '+' : ''}{row.delta} unit · {locations.find(location => location.id === row.locationId)?.name ?? row.locationId}</strong><p>{row.reason}</p><small>{row.before} → {row.after} · {new Date(row.at).toLocaleString('id-ID')} · {row.actorId}</small></article>)}{!adjustments.some(row => row.listingId === item.id) && <p>Belum ada penyesuaian tercatat. Saldo awal berasal dari katalog existing.</p>}</section>
    <details className={styles.card}><summary>Riwayat pesanan produk ({history.length})</summary>{history.length ? history.slice(-20).map(order => <p key={order.id}>{order.id} · {order.status} · {order.items?.find(row => row.productId === item.id)?.quantity} unit</p>) : <p>Belum ada pesanan produk yang terhubung ke toko ini.</p>}</details>
    <section className={styles.card}><h2>Forecasting {item.name}</h2><ForecastDashboard key={`${item.id}:${item.updatedAt}`} productId={item.id}/></section></>}
  </>;
}

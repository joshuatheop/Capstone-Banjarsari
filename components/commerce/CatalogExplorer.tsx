'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, SearchX } from 'lucide-react';
import type { CatalogEntry } from '@/lib/catalog';
import CatalogCard from './CatalogCard';
import { useFavorites } from '@/context/FavoritesContext';
import styles from './commerce.module.css';

interface CatalogExplorerProps { entries: CatalogEntry[]; kind?: CatalogEntry['kind']; initialQuery?: string; initialCategory?: string; favoritesOnly?: boolean }
const CatalogExplorer = ({ entries, kind, initialQuery = '', initialCategory = '', favoritesOnly = false }: CatalogExplorerProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(entries.find((item) => item.categoryId === initialCategory)?.category ?? initialCategory);
  const [area, setArea] = useState('');
  const [sort, setSort] = useState('name');
  const [availableOnly, setAvailableOnly] = useState(false);
  const favorites = useFavorites();
  const relevant = entries.filter((item) => (!kind || item.kind === kind) && (!favoritesOnly || (item.kind === 'service' ? favorites.isServiceFavorited(item.id) : favorites.isProductFavorited(item.id))));
  const categories = Array.from(new Set(relevant.map((item) => item.category))).sort();
  const areas = Array.from(new Set(relevant.map((item) => item.area).filter(Boolean))).sort();
  const filtered = relevant.filter((item) => `${item.name} ${item.description} ${item.business}`.toLowerCase().includes(query.toLowerCase().trim()) && (!category || item.category === category) && (!area || item.area === area) && (!availableOnly || item.available))
    .sort((a, b) => sort === 'popular' ? b.popularity - a.popularity : sort === 'low' ? (a.price ?? Infinity) - (b.price ?? Infinity) : sort === 'high' ? (b.price ?? -1) - (a.price ?? -1) : a.name.localeCompare(b.name, 'id'));
  const title = favoritesOnly ? 'Pilihan yang Anda simpan.' : kind === 'food' ? 'Rasa lokal, dekat di hati.' : kind === 'service' ? 'Ada ahlinya di sekitar kita.' : kind === 'product' ? 'Belanja baik, dari yang dekat.' : 'Cari kebutuhan Anda di sini.';
  return <main className={styles.page}>
    <header className={styles.pageHeading}><span className={styles.eyebrow}>JELAJAHI BANJARSARI</span><h1>{title}</h1><p>{favoritesOnly ? 'Produk dan jasa favorit tersimpan di browser ini.' : 'Temukan pilihan dari usaha warga. Kenali produknya, lihat usahanya, dukung tetangga.'}</p></header>
    <nav className={styles.tabs} aria-label="Jenis katalog">{[['/katalog', 'Semua'], ['/katalog?type=product', 'Produk'], ['/makanan', 'Makanan'], ['/jasa', 'Jasa'], ['/favorites', 'Favorit']].map(([href, label], index) => <Link key={href} href={href} aria-current={(favoritesOnly ? index === 4 : index === (kind === 'product' ? 1 : kind === 'food' ? 2 : kind === 'service' ? 3 : 0)) ? 'page' : undefined}>{label}</Link>)}</nav>
    <div className={styles.explorerLayout}>
      <aside className={styles.filters}><h2><SlidersHorizontal size={18} /> Filter pilihan</h2><label>Kategori<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Semua kategori</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label><label>Wilayah<select value={area} onChange={(event) => setArea(event.target.value)}><option value="">Semua wilayah</option>{areas.map((name) => <option key={name}>{name}</option>)}</select></label><label className={styles.checkbox}><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Tersedia saja</label><button className={styles.textLink} onClick={() => { setQuery(''); setCategory(''); setArea(''); setAvailableOnly(false); setSort('name'); }}>Reset filter</button><div className={styles.filterNote}>Setiap pilihan Anda membantu usaha lokal tumbuh.</div></aside>
      <section><div className={styles.searchToolbar}><label className={styles.search}><Search size={20} /><input aria-label="Cari di katalog" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, makanan, jasa, atau usaha…" /></label><select aria-label="Urutkan katalog" value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Nama A–Z</option><option value="popular">Paling dilihat</option><option value="low">Harga terendah</option><option value="high">Harga tertinggi</option></select></div><p className={styles.resultCount} aria-live="polite">{filtered.length} pilihan ditemukan</p>
        {filtered.length ? <div className={styles.catalogGrid}>{filtered.map((item) => <CatalogCard key={`${item.kind}-${item.id}`} item={item} />)}</div> : <div className={styles.empty}><SearchX size={40} /><h2>Belum ada pilihan yang cocok</h2><p>Coba kata kunci lain atau reset filter. Simpan produk untuk melihatnya di Favorit.</p><button className={styles.secondaryButton} onClick={() => { setQuery(''); setCategory(''); setArea(''); setAvailableOnly(false); }}>Reset pencarian</button></div>}
      </section>
    </div>
  </main>;
};
export default CatalogExplorer;

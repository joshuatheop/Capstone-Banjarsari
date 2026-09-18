'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllProduk } from '@/lib/firestore/produk';
import { getAllJasa } from '@/lib/firestore/jasa';
import { getAllBisnis } from '@/lib/firestore/bisnis';
import { getSeoMeta, saveSeoMeta, autoGenerateSeo } from '@/lib/firestore/seo';
import type { SeoMeta } from '@/lib/firestore/types';
import type { ProdukItem, ServiceItem, Business } from '@/lib/firestore/types';
import styles from './seo.module.css';

type Tab = 'produk' | 'jasa';

interface RowItem {
  id: string;
  name: string;
  businessName: string;
  description: string | null;
  type: 'product' | 'service';
  seo: SeoMeta | null;
}

function StatusChip({ seo }: { seo: SeoMeta | null }) {
  if (seo?.title && seo?.description) {
    return <span className={`${styles.chip} ${styles.chipGood}`}>✅ Lengkap</span>;
  }
  return <span className={`${styles.chip} ${styles.chipWarn}`}>⚠️ Belum diisi</span>;
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const ok = len <= max;
  return (
    <span className={styles.counter} style={{ color: ok ? 'var(--text-muted)' : '#e53e3e' }}>
      {len}/{max}
    </span>
  );
}

function SeoDrawer({
  item,
  onClose,
  onSaved,
}: {
  item: RowItem;
  onClose: () => void;
  onSaved: (id: string, seo: SeoMeta) => void;
}) {
  const initSeo = item.seo ?? autoGenerateSeo(item.name, item.description, item.businessName);
  const [form, setForm] = useState({
    title: initSeo.title,
    description: initSeo.description,
    ogTitle: initSeo.ogTitle,
    ogDescription: initSeo.ogDescription,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncOg, setSyncOg] = useState(true);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (syncOg) {
        if (field === 'title') next.ogTitle = value;
        if (field === 'description') next.ogDescription = value;
      }
      return next;
    });
    setSaved(false);
  };

  const handleAutoGenerate = () => {
    const generated = autoGenerateSeo(item.name, item.description, item.businessName);
    setForm({
      title: generated.title,
      description: generated.description,
      ogTitle: generated.ogTitle,
      ogDescription: generated.ogDescription,
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSeoMeta(item.type, item.id, form);
      onSaved(item.id, { ...form });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const previewTitle = form.ogTitle || form.title || item.name;
  const previewDesc = form.ogDescription || form.description || '';
  const siteLabel = 'umkm-banjarsari.com';

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <div>
            <h3 className={styles.drawerTitle}>SEO Editor</h3>
            <p className={styles.drawerSub}>{item.name}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <button className={styles.btnGenerate} onClick={handleAutoGenerate}>
          ✨ Auto-generate dari data Firestore
        </button>

        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Meta Title</label>
            <CharCounter value={form.title} max={60} />
          </div>
          <input
            className={styles.input}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Judul halaman (max 60 karakter)"
          />
        </div>

        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Meta Description</label>
            <CharCounter value={form.description} max={160} />
          </div>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Deskripsi halaman (max 160 karakter)"
            rows={3}
          />
        </div>

        <div className={styles.ogSection}>
          <div className={styles.ogToggleRow}>
            <span className={styles.ogLabel}>Open Graph (preview di WA / sosmed)</span>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={syncOg}
                onChange={(e) => setSyncOg(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span
                className={styles.toggleTrack}
                style={{ background: syncOg ? 'var(--color-primary)' : 'var(--border-strong)' }}
              >
                <span
                  className={styles.toggleThumb}
                  style={{ transform: syncOg ? 'translateX(16px)' : 'translateX(2px)' }}
                />
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sinkron dengan title & desc</span>
            </label>
          </div>

          {!syncOg && (
            <>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>OG Title</label>
                  <CharCounter value={form.ogTitle} max={60} />
                </div>
                <input
                  className={styles.input}
                  value={form.ogTitle}
                  onChange={(e) => setForm((p) => ({ ...p, ogTitle: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>OG Description</label>
                  <CharCounter value={form.ogDescription} max={160} />
                </div>
                <textarea
                  className={styles.textarea}
                  value={form.ogDescription}
                  onChange={(e) => setForm((p) => ({ ...p, ogDescription: e.target.value }))}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <div className={styles.previewSection}>
          <p className={styles.previewLabel}>Preview saat di-share ke WhatsApp</p>
          <div className={styles.waCard}>
            <div className={styles.waCardSite}>{siteLabel}</div>
            <div className={styles.waCardTitle}>{previewTitle}</div>
            <div className={styles.waCardDesc}>{previewDesc || 'Tidak ada deskripsi.'}</div>
          </div>
        </div>

        <div className={styles.drawerActions}>
          <button className={styles.btnCancel} onClick={onClose}>Batal</button>
          <button
            className={`${styles.btnSave} ${saved ? styles.btnSaved : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSeoPage() {
  const [tab, setTab] = useState<Tab>('produk');
  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RowItem | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async (activeTab: Tab) => {
    setLoading(true);
    try {
      const businesses: Business[] = await getAllBisnis();
      const bizMap = Object.fromEntries(businesses.map((b) => [b.business_id, b.business_name]));

      let items: RowItem[] = [];

      if (activeTab === 'produk') {
        const produkList: ProdukItem[] = await getAllProduk();
        // Hanya ambil produk aktif & belum dihapus
        const activeProduk = produkList.filter((p) => p.is_active && !p.deletedAt);
        const seoList = await Promise.all(
          activeProduk.map((p) => getSeoMeta('product', p.product_id))
        );
        items = activeProduk.map((p, i) => ({
          id: p.product_id,
          name: p.product_name,
          businessName: bizMap[p.business_id] || p.business_id,
          description: p.product_description,
          type: 'product' as const,
          seo: seoList[i],
        }));
      } else {
        const jasaList: ServiceItem[] = await getAllJasa();
        // Hanya ambil jasa aktif & belum dihapus
        const activeJasa = jasaList.filter((j) => j.is_active && !j.deletedAt);
        const seoList = await Promise.all(
          activeJasa.map((j) => getSeoMeta('service', j.service_id))
        );
        items = activeJasa.map((j, i) => ({
          id: j.service_id,
          name: j.service_name,
          businessName: bizMap[j.business_id] || j.business_id,
          description: j.service_description,
          type: 'service' as const,
          seo: seoList[i],
        }));
      }
      setRows(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(tab); }, [tab, loadData]);

  const handleSaved = useCallback((id: string, seo: SeoMeta) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, seo } : r)));
  }, []);

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.businessName.toLowerCase().includes(search.toLowerCase())
  );

  const totalRows = rows.length;
  const filledRows = rows.filter((r) => r.seo?.title && r.seo?.description).length;
  const pct = totalRows > 0 ? Math.round((filledRows / totalRows) * 100) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>SEO &amp; Meta Tag</h1>
          <p className={styles.pageSub}>Kelola title, description, dan Open Graph untuk halaman produk &amp; jasa.</p>
        </div>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Kelengkapan SEO</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.progressSub}>{filledRows} dari {totalRows} item aktif sudah diisi</div>
        </div>
      </div>

      <div className={styles.toolBar}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'produk' ? styles.tabActive : ''}`} onClick={() => setTab('produk')}>📦 Produk</button>
          <button className={`${styles.tab} ${tab === 'jasa' ? styles.tabActive : ''}`} onClick={() => setTab('jasa')}>🔧 Jasa</button>
        </div>
        <input
          className={styles.search}
          placeholder="Cari nama produk atau UMKM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Nama {tab === 'produk' ? 'Produk' : 'Jasa'}</th>
              <th>UMKM</th>
              <th>Status SEO</th>
              <th>Meta Title</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className={styles.skeleton} style={{ height: 18, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>{search ? 'Tidak ada hasil.' : 'Belum ada data aktif.'}</td></tr>
            ) : (
              filtered.map((item, i) => (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.tdNum}>{i + 1}</td>
                  <td className={styles.tdName}>{item.name}</td>
                  <td className={styles.tdBiz}>{item.businessName}</td>
                  <td><StatusChip seo={item.seo} /></td>
                  <td className={styles.tdTitle}>
                    {item.seo?.title
                      ? <span className={styles.metaPreview}>{item.seo.title}</span>
                      : <span className={styles.metaEmpty}>—</span>}
                  </td>
                  <td>
                    <button
                      className={styles.btnEdit}
                      onClick={() => setEditing({ ...item, seo: item.seo ?? null })}
                    >
                      {item.seo ? '✏️ Edit' : '✨ Generate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SeoDrawer item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}

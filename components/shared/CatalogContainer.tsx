'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ProdukItem, ServiceItem, Business, Category } from '@/lib/firestore/types';
import { getServicePriceDisplay } from '@/lib/firestore/types';
import ProductCard from './ProductCard';
import ServiceCard from './ServiceCard';
import { Icons } from './Icons';

interface CatalogContainerProps {
  products: ProdukItem[];
  services: ServiceItem[];
  businesses: Business[];
  categories: Category[];
  areas: string[];
  initialType: 'product' | 'service';
  initialQuery: string;
  initialCategory: string;
}

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const FilterGroup = ({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="fl-filter-group">
      <button className="fl-filter-group-header" onClick={() => setOpen((v) => !v)}>
        <span className="fl-filter-group-title">
          {title}
          {count !== undefined && count > 0 && (
            <span className="fl-filter-badge">{count}</span>
          )}
        </span>
        <ChevronDown open={open} />
      </button>
      {open && <div className="fl-filter-group-body">{children}</div>}
    </div>
  );
};

const CatalogContainer = ({
  products,
  services,
  businesses,
  categories,
  areas,
  initialType,
  initialQuery,
  initialCategory,
}: CatalogContainerProps) => {
  const router = useRouter();
  const [type, setType] = useState<'product' | 'service'>(initialType);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const handleSwitchType = (newType: 'product' | 'service') => {
    setType(newType);
    setActiveCategories(new Set());
    setActiveAreas(new Set());
    router.replace(`/katalog?type=${newType}`, { scroll: false });
  };
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    initialCategory ? new Set([initialCategory]) : new Set()
  );
  const [activeAreas, setActiveAreas] = useState<Set<string>>(new Set());
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const toggleCategory = (id: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleArea = (area: string) => {
    setActiveAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area); else next.add(area);
      return next;
    });
  };

  const businessMap = useMemo(
    () => new Map(businesses.map((b) => [b.business_id, b.business_name])),
    [businesses]
  );
  const businessAreaMap = useMemo(
    () => new Map(businesses.map((b) => [b.business_id, b.area_name])),
    [businesses]
  );
  const getBusinessName = (id: string) => businessMap.get(id) || 'UMKM Banjarsari';

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeCategories.size > 0) list = list.filter((p) => activeCategories.has(p.category_id));
    if (activeAreas.size > 0) list = list.filter((p) => activeAreas.has(businessAreaMap.get(p.business_id) ?? ''));
    if (searchQuery) list = list.filter((p) =>
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.product_description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (minPrice !== '') {
      const min = Number(minPrice);
      if (!isNaN(min)) list = list.filter((p) => p.product_price >= min);
    }
    if (maxPrice !== '') {
      const max = Number(maxPrice);
      if (!isNaN(max)) list = list.filter((p) => p.product_price <= max);
    }

    if (sortBy === 'price-asc') list.sort((a, b) => a.product_price - b.product_price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.product_price - a.product_price);
    else list.sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0));
    return list;
  }, [products, activeCategories, activeAreas, searchQuery, minPrice, maxPrice, sortBy, businessAreaMap]);

  // Filter & sort services
  const filteredServices = useMemo(() => {
    let list = [...services];
    if (activeCategories.size > 0) list = list.filter((s) => activeCategories.has(s.category_id));
    if (activeAreas.size > 0) list = list.filter((s) => activeAreas.has(businessAreaMap.get(s.business_id) ?? ''));
    if (searchQuery) list = list.filter((s) =>
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.service_description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (minPrice !== '') {
      const min = Number(minPrice);
      if (!isNaN(min)) list = list.filter((s) => (s.minimum_price ?? 0) >= min);
    }
    if (maxPrice !== '') {
      const max = Number(maxPrice);
      if (!isNaN(max)) list = list.filter((s) => (s.minimum_price ?? 0) <= max);
    }

    if (sortBy === 'price-asc') list.sort((a, b) => (a.minimum_price ?? 0) - (b.minimum_price ?? 0));
    else if (sortBy === 'price-desc') list.sort((a, b) => (b.minimum_price ?? 0) - (a.minimum_price ?? 0));
    else list.sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0));
    return list;
  }, [services, activeCategories, activeAreas, searchQuery, minPrice, maxPrice, sortBy, businessAreaMap]);

  // Categories visible for current type
  const visibleCategories = useMemo(
    () => categories.filter((c) => {
      const cType = (c.category_type || '').toUpperCase();
      const targetType = type === 'product' ? 'PRODUCT' : 'SERVICE';
      return cType === targetType;
    }),
    [categories, type]
  );

  const currentItems = type === 'product' ? filteredProducts : filteredServices;
  const totalCount = currentItems.length;
  const hasPriceFilter = minPrice !== '' || maxPrice !== '';
  const activeFiltersCount = [
    ...activeCategories,
    ...activeAreas,
    searchQuery,
    hasPriceFilter ? 'price' : '',
  ].filter(Boolean).length;

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.category_id, c.category_name])),
    [categories]
  );

  const resetFilters = () => {
    setActiveCategories(new Set());
    setActiveAreas(new Set());
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popular');
  };

  return (
    <main className="fl-main">

      {/* Hero Banner */}
      <div className="fl-hero-banner">
        <div className="fl-hero-text-outline">
          {type === 'product' ? 'PRODUK UMKM' : 'LAYANAN JASA'}
        </div>
        <div className="fl-hero-text-solid">BANJARSARI</div>
      </div>

      {/* Breadcrumb */}
      <div className="fl-breadcrumb-bar">
        <div className="fl-container">
          <nav className="fl-breadcrumb">
            <span>Beranda</span>
            <span className="fl-bc-sep">/</span>
            <span>Katalog</span>
            <span className="fl-bc-sep">/</span>
            <span className="fl-bc-current">
              {type === 'product' ? 'Produk UMKM' : 'Layanan Jasa'}
            </span>
          </nav>
        </div>
      </div>

      {/* Page Title + Type Switcher */}
      <div className="fl-container">
        <div className="fl-page-head">
          <h1 className="fl-page-title">
            {type === 'product' ? 'Produk UMKM Banjarsari' : 'Layanan Jasa Banjarsari'}
          </h1>
          <div className="fl-type-tabs">
            <button
              onClick={() => handleSwitchType('product')}
              className={`fl-type-tab ${type === 'product' ? 'active' : ''}`}
            >
              Produk UMKM ({products.length})
            </button>
            <button
              onClick={() => handleSwitchType('service')}
              className={`fl-type-tab ${type === 'service' ? 'active' : ''}`}
            >
              Layanan Jasa ({services.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="fl-container">
        <div className="fl-layout">

          {/* SIDEBAR */}
          <aside className={`fl-sidebar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
            <div className="fl-sidebar-header">
              <span className="fl-sidebar-title">Saring</span>
              {activeFiltersCount > 0 && (
                <button className="fl-clear-all" onClick={resetFilters}>
                  Hapus Semua ({activeFiltersCount})
                </button>
              )}
              <button className="fl-sidebar-close" onClick={() => setMobileFilterOpen(false)}>
                <Icons.X />
              </button>
            </div>

            <FilterGroup title="Pencarian">
              <div className="fl-search-wrap">
                <Icons.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
                <input
                  id="fl-search"
                  type="text"
                  placeholder="Cari produk..."
                  className="fl-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="fl-search-clear" onClick={() => setSearchQuery('')}>x</button>
                )}
              </div>
            </FilterGroup>

            <FilterGroup title="Kategori" count={activeCategories.size}>
              <label className="fl-check-row">
                <input
                  type="checkbox"
                  className="fl-checkbox"
                  checked={activeCategories.size === 0}
                  onChange={() => setActiveCategories(new Set())}
                  readOnly
                />
                <span className="fl-check-label">Semua</span>
                <span className="fl-check-count">({(type === 'product' ? products : services).length})</span>
              </label>
              {visibleCategories.map((c) => (
                <label key={c.category_id} className="fl-check-row">
                  <input
                    type="checkbox"
                    className="fl-checkbox"
                    checked={activeCategories.has(c.category_id)}
                    onChange={() => toggleCategory(c.category_id)}
                  />
                  <span className="fl-check-label">{c.icon} {c.category_name}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Area" count={activeAreas.size}>
              <label className="fl-check-row">
                <input
                  type="checkbox"
                  className="fl-checkbox"
                  checked={activeAreas.size === 0}
                  onChange={() => setActiveAreas(new Set())}
                />
                <span className="fl-check-label">Semua Area</span>
              </label>
              {areas.map((a) => (
                <label key={a} className="fl-check-row">
                  <input
                    type="checkbox"
                    className="fl-checkbox"
                    checked={activeAreas.has(a)}
                    onChange={() => toggleArea(a)}
                  />
                  <span className="fl-check-label">{a}</span>
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Rentang Harga" count={hasPriceFilter ? 1 : 0}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="fl-min-price"
                    type="number"
                    placeholder="Min Rp"
                    className="fl-search-input"
                    style={{ paddingLeft: 12, fontSize: 13 }}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span style={{ fontSize: 12, color: '#888' }}>-</span>
                  <input
                    id="fl-max-price"
                    type="number"
                    placeholder="Max Rp"
                    className="fl-search-input"
                    style={{ paddingLeft: 12, fontSize: 13 }}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                {hasPriceFilter && (
                  <button
                    type="button"
                    className="fl-clear-all"
                    style={{ alignSelf: 'flex-start', marginTop: 2 }}
                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                  >
                    Hapus Rentang Harga
                  </button>
                )}
              </div>
            </FilterGroup>
          </aside>

          {mobileFilterOpen && (
            <div className="fl-sidebar-overlay" onClick={() => setMobileFilterOpen(false)} />
          )}

          {/* MAIN CONTENT */}
          <div className="fl-content">
            <div className="fl-toolbar">
              <button className="fl-mobile-filter-btn" onClick={() => setMobileFilterOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
                </svg>
                Saring
                {activeFiltersCount > 0 && <span className="fl-filter-count-badge">{activeFiltersCount}</span>}
              </button>

              <div className="fl-result-count">
                Menampilkan <strong>{totalCount}</strong> hasil pencarian
              </div>

              <div className="fl-sort-wrap">
                <label className="fl-sort-label" htmlFor="fl-sort">Urutkan:</label>
                <div className="fl-sort-select-wrap">
                  <select
                    id="fl-sort"
                    className="fl-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="popular">Popularitas (Default)</option>
                    <option value="price-asc">Harga: Termurah (Ascending)</option>
                    <option value="price-desc">Harga: Termahal (Descending)</option>
                  </select>
                  <svg className="fl-sort-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {(activeCategories.size > 0 || activeAreas.size > 0 || hasPriceFilter || searchQuery) && (
              <div className="fl-active-filters">
                {[...activeCategories].map((catId) => (
                  <button key={catId} className="fl-pill" onClick={() => toggleCategory(catId)}>
                    {categoryMap.get(catId) || catId} <span>x</span>
                  </button>
                ))}
                {[...activeAreas].map((area) => (
                  <button key={area} className="fl-pill" onClick={() => toggleArea(area)}>
                    {area} <span>x</span>
                  </button>
                ))}
                {hasPriceFilter && (
                  <button className="fl-pill" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
                    Rp {minPrice ? Number(minPrice).toLocaleString('id-ID') : '0'} - {maxPrice ? `Rp ${Number(maxPrice).toLocaleString('id-ID')}` : 'Tak Terbatas'} <span>x</span>
                  </button>
                )}
                {searchQuery && (
                  <button className="fl-pill" onClick={() => setSearchQuery('')}>
                    &quot;{searchQuery}&quot; <span>x</span>
                  </button>
                )}
                <button className="fl-clear-pills" onClick={resetFilters}>Hapus Semua</button>
              </div>
            )}


            {totalCount === 0 ? (
              <div className="fl-empty">
                <div className="fl-empty-icon">🔍</div>
                <div className="fl-empty-title">Tidak ada hasil</div>
                <div className="fl-empty-sub">Coba ubah filter atau kata kunci pencarian</div>
                <button className="fl-empty-reset" onClick={resetFilters}>Reset Semua Filter</button>
              </div>
            ) : (
              <div className="fl-grid">
                {type === 'product'
                  ? filteredProducts.map((p) => (
                      <ProductCard
                        key={p.product_id}
                        product={p}
                        businessName={getBusinessName(p.business_id)}
                        categoryName={categoryMap.get(p.category_id)}
                      />
                    ))
                  : filteredServices.map((s) => (
                      <ServiceCard
                        key={s.service_id}
                        service={s}
                        businessName={getBusinessName(s.business_id)}
                        categoryName={categoryMap.get(s.category_id)}
                      />
                    ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .fl-main { background: #F5F5F5; min-height: 60vh; }
        .fl-container { max-width: 1380px; margin: 0 auto; padding: 0 24px; }

        /* Hero */
        .fl-hero-banner {
          background: #05472B;
          background-image:
            repeating-linear-gradient(90deg, transparent 0, transparent 80px, rgba(255,255,255,0.03) 80px, rgba(255,255,255,0.03) 81px),
            repeating-linear-gradient(0deg, transparent 0, transparent 80px, rgba(255,255,255,0.03) 80px, rgba(255,255,255,0.03) 81px);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 48px 24px; gap: 0; overflow: hidden;
        }
        .fl-hero-text-outline {
          font-family: var(--font-display);
          font-size: clamp(40px, 8vw, 96px);
          font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
          background: linear-gradient(180deg, #FFFFFF 0%, #E8FF70 50%, #CDFF00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 1.5px rgba(205, 255, 0, 0.7);
          filter: drop-shadow(0 4px 12px rgba(205, 255, 0, 0.35));
          line-height: 1; text-align: center;
        }
        .fl-hero-text-solid {
          font-family: var(--font-display);
          font-size: clamp(28px, 4.5vw, 60px);
          font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;
          background: linear-gradient(180deg, #FAFFD1 0%, #CDFF00 45%, #9BC400 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 10px rgba(205, 255, 0, 0.5));
          line-height: 1.1; text-align: center;
        }

        /* Breadcrumb */
        .fl-breadcrumb-bar { background: #fff; border-bottom: 1px solid #E5E5E5; padding: 10px 0; }
        .fl-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #666; }
        .fl-bc-sep { color: #CCC; }
        .fl-bc-current { color: #111; font-weight: 600; }

        /* Page head */
        .fl-page-head {
          padding: 20px 0 12px;
          display: flex; align-items: flex-end; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-bottom: 2px solid #111;
        }
        .fl-page-title {
          font-family: var(--font-display);
          font-size: clamp(18px, 2.5vw, 28px);
          font-weight: 800; color: #111; letter-spacing: -0.01em;
          text-transform: uppercase; margin: 0;
        }
        .fl-type-tabs { display: flex; border: 1.5px solid #111; overflow: hidden; }
        .fl-type-tab {
          padding: 8px 18px; font-size: 12.5px; font-weight: 700;
          font-family: var(--font-ui); letter-spacing: 0.04em; text-transform: uppercase;
          color: #111; background: #fff; border: none;
          border-right: 1.5px solid #111; cursor: pointer; transition: all 0.15s;
        }
        .fl-type-tab:last-child { border-right: none; }
        .fl-type-tab.active { background: #111; color: #fff; }
        .fl-type-tab:hover:not(.active) { background: #F5F5F5; }

        /* Layout */
        .fl-layout {
          display: grid; grid-template-columns: 240px 1fr;
          gap: 0; align-items: start; padding: 20px 0 60px;
        }

        /* Sidebar */
        .fl-sidebar {
          position: sticky; top: 72px;
          padding-right: 24px; padding-bottom: 40px;
          border-right: 1px solid #E0E0E0;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #CCC transparent;
        }
        .fl-sidebar-header {
          display: flex; align-items: center; gap: 8px;
          padding: 0 0 14px; border-bottom: 2px solid #111; margin-bottom: 0;
        }
        .fl-sidebar-title { font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #111; flex: 1; }
        .fl-clear-all { font-size: 11px; font-weight: 600; color: var(--primary); text-decoration: underline; cursor: pointer; background: none; border: none; font-family: var(--font-ui); }
        .fl-sidebar-close { display: none; background: none; border: none; cursor: pointer; color: #111; padding: 2px; }

        /* Filter Group */
        .fl-filter-group { border-bottom: 1px solid #E5E5E5; }
        .fl-filter-group-header {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0; font-size: 12.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em; color: #111;
          background: none; border: none; cursor: pointer; font-family: var(--font-ui); gap: 8px;
        }
        .fl-filter-group-title { display: flex; align-items: center; gap: 6px; }
        .fl-filter-badge {
          background: #111; color: #fff; border-radius: 10px;
          padding: 1px 7px; font-size: 10px; font-weight: 700; letter-spacing: 0; text-transform: none;
        }
        .fl-filter-group-body { padding-bottom: 14px; display: flex; flex-direction: column; gap: 2px; }

        /* Check row */
        .fl-check-row {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 4px; cursor: pointer; border-radius: 3px; transition: background 0.1s;
        }
        .fl-check-row:hover { background: #F0F0F0; }
        .fl-checkbox { width: 16px; height: 16px; accent-color: #111; flex-shrink: 0; cursor: pointer; }
        .fl-check-label { font-size: 13px; color: #222; font-family: var(--font-ui); flex: 1; }
        .fl-check-count { font-size: 12px; color: #888; font-family: var(--font-mono); }

        /* Sidebar search */
        .fl-search-wrap { position: relative; }
        .fl-search-input {
          width: 100%; height: 38px; padding: 0 32px 0 34px;
          border: 1.5px solid #CCC; border-radius: 0;
          background: #fff; font-size: 13px; font-family: var(--font-ui);
          color: #111; outline: none; transition: border-color 0.15s;
        }
        .fl-search-input:focus { border-color: #111; }
        .fl-search-input::placeholder { color: #AAA; }
        .fl-search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #999; font-size: 12px; padding: 4px; }

        /* Content */
        .fl-content { padding-left: 24px; }

        /* Toolbar */
        .fl-toolbar {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 0; border-bottom: 1px solid #E5E5E5;
          margin-bottom: 8px; flex-wrap: wrap;
        }
        .fl-result-count { font-size: 13.5px; color: #444; font-family: var(--font-ui); flex: 1; }
        .fl-result-count strong { font-weight: 800; color: #111; }
        .fl-mobile-filter-btn {
          display: none; align-items: center; gap: 6px; padding: 7px 14px;
          font-size: 12.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.04em; font-family: var(--font-ui);
          color: #fff; background: #111; border: none; cursor: pointer;
        }
        .fl-filter-count-badge { background: var(--primary); color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 10px; font-weight: 700; }

        /* Sort */
        .fl-sort-wrap { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .fl-sort-label { font-size: 12.5px; font-weight: 600; color: #555; white-space: nowrap; font-family: var(--font-ui); }
        .fl-sort-select-wrap { position: relative; display: flex; align-items: center; }
        .fl-sort-select {
          appearance: none; -webkit-appearance: none;
          padding: 7px 36px 7px 12px; font-size: 13px; font-weight: 600;
          font-family: var(--font-ui); color: #111; background: #fff;
          border: 1.5px solid #CCC; cursor: pointer; outline: none; transition: border-color 0.15s;
        }
        .fl-sort-select:focus, .fl-sort-select:hover { border-color: #111; }
        .fl-sort-chevron { position: absolute; right: 10px; pointer-events: none; color: #555; }

        /* Active filter pills */
        .fl-active-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 0 10px; }
        .fl-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; background: #111; color: #fff;
          font-size: 12px; font-weight: 600; font-family: var(--font-ui);
          border: none; cursor: pointer; transition: background 0.15s;
        }
        .fl-pill span { font-size: 10px; opacity: 0.7; }
        .fl-pill:hover { background: #333; }
        .fl-clear-pills { font-size: 12px; font-weight: 600; color: var(--primary); text-decoration: underline; background: none; border: none; cursor: pointer; font-family: var(--font-ui); }

        /* Grid */
        .fl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #E0E0E0; border: 1px solid #E0E0E0; }

        /* Empty */
        .fl-empty { text-align: center; padding: 80px 20px; }
        .fl-empty-icon { font-size: 52px; margin-bottom: 16px; }
        .fl-empty-title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #111; font-family: var(--font-display); margin-bottom: 8px; }
        .fl-empty-sub { font-size: 14px; color: #666; margin-bottom: 24px; }
        .fl-empty-reset { padding: 10px 24px; background: #111; color: #fff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border: none; cursor: pointer; font-family: var(--font-ui); transition: background 0.15s; }
        .fl-empty-reset:hover { background: #333; }

        /* Responsive */
        @media (max-width: 960px) {
          .fl-layout { grid-template-columns: 1fr; }
          .fl-sidebar {
            position: fixed; top: 0; left: -290px; width: 290px; height: 100vh;
            max-height: 100vh; z-index: 200; background: #fff; padding: 20px;
            border-right: 2px solid #111; transition: left 0.25s ease; overflow-y: auto;
          }
          .fl-sidebar.mobile-open { left: 0; }
          .fl-sidebar-close { display: block; }
          .fl-sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
          .fl-mobile-filter-btn { display: inline-flex; }
          .fl-content { padding-left: 0; }
          .fl-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .fl-grid { grid-template-columns: 1fr; }
          .fl-page-head { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </main>
  );
};

export default CatalogContainer;

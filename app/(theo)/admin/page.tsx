'use client';

import { useEffect, useState, useRef } from 'react';
import { subscribeAnalytics } from '@/lib/firestore/analytics';
import type { DashboardStats, EventType } from '@/lib/firestore/analytics';
import { getAllProduk } from '@/lib/firestore/produk';
import { getAllBisnis } from '@/lib/firestore/bisnis';
import styles from './dashboard.module.css';

/* ============================================================
   Admin Dashboard — terhubung ke Firestore koleksi `analytics_events`
   PBI-18: Awareness Tracking   → totalSessions
   PBI-19: Analytics Top Access → topProducts, topBusinesses
   PBI-20: Channel Analytics    → eventTypeCounts
   ============================================================ */

// Label display untuk EventType enum
const EVENT_LABELS: Record<EventType, string> = {
  WHATSAPP_CLICK:    'Tombol WhatsApp',
  MARKETPLACE_CLICK: 'Tombol Marketplace',
  SHARE_CLICK:       'Bagikan / Salin Link',
  PRODUCT_VIEW:      'Lihat Detail Produk',
  SERVICE_VIEW:      'Lihat Detail Jasa',
  BUSINESS_VIEW:     'Lihat Profil UMKM',
  PAGE_VIEW:         'Kunjungan Halaman',
};

// Warna bar per event type
const EVENT_COLORS: Record<EventType, string> = {
  WHATSAPP_CLICK:    'aqua',
  MARKETPLACE_CLICK: 'green',
  SHARE_CLICK:       'accent',
  PRODUCT_VIEW:      'muted',
  SERVICE_VIEW:      'muted',
  BUSINESS_VIEW:     'muted',
  PAGE_VIEW:         'muted',
};

/* ---- FakeChart (SVG) — tetap statis untuk tren visual ---- */
function RealChart({ stats }: { stats: { date: string; sessions: number; clicks: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!stats || stats.length === 0) {
    return <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Belum ada data</div>;
  }

  // Dimensions of the SVG canvas
  const paddingX = 40;
  const paddingY = 20;
  const width = 500;
  const height = 220;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const dataA = stats.map(d => d.sessions);
  const dataB = stats.map(d => d.clicks);

  // Maximum value for scaling (min 1 to avoid divide-by-zero)
  const maxVal = Math.max(...dataA, ...dataB, 1);
  const roundedMax = Math.ceil(maxVal / 5) * 5 || 5;

  // Coordinates helper
  const getCoords = (val: number, index: number) => {
    const x = paddingX + (index / (stats.length - 1)) * chartW;
    const y = paddingY + chartH - (val / roundedMax) * chartH;
    return { x, y };
  };

  // Build SVG Paths
  const pointsA = dataA.map((v, i) => getCoords(v, i));
  const pointsB = dataB.map((v, i) => getCoords(v, i));

  const pathA = pointsA.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathB = pointsB.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaA = `${pathA} L ${pointsA[pointsA.length - 1].x} ${paddingY + chartH} L ${pointsA[0].x} ${paddingY + chartH} Z`;
  const areaB = `${pathB} L ${pointsB[pointsB.length - 1].x} ${paddingY + chartH} L ${pointsB[0].x} ${paddingY + chartH} Z`;

  // X Axis Label filtering: show ~5 labels nicely spaced
  const labelInterval = Math.max(1, Math.floor(stats.length / 5));
  const labelsX = stats.map((d, i) => {
    if (i % labelInterval === 0 || i === stats.length - 1) {
      let displayDate = d.date;
      if (d.date.includes('-')) {
        const parts = d.date.split('-');
        if (parts.length === 3) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const day = parseInt(parts[2], 10);
          const month = monthNames[parseInt(parts[1], 10) - 1];
          displayDate = `${day} ${month}`;
        }
      }
      return { label: displayDate, x: getCoords(0, i).x };
    }
    return null;
  }).filter(Boolean) as { label: string; x: number }[];

  // Y Axis Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const val = p * roundedMax;
    const y = paddingY + chartH - p * chartH;
    return { val: Math.round(val), y };
  });

  // Mouse Move listener to detect hovered item
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    const scaleX = width / rect.width;
    const svgX = clickX * scaleX;
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    for (let i = 0; i < stats.length; i++) {
      const pX = paddingX + (i / (stats.length - 1)) * chartW;
      const diff = Math.abs(pX - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    setHoveredIndex(closestIndex);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipX = e.clientX - containerRect.left;
    const tooltipY = e.clientY - containerRect.top - 85;
    setTooltipPos({ x: tooltipX, y: tooltipY });
  };

  const activePoint = hoveredIndex !== null ? stats[hoveredIndex] : null;

  // Formatter for tooltip date display
  const getTooltipDateLabel = (dateStr: string) => {
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const day = parseInt(parts[2], 10);
        const month = monthNames[parseInt(parts[1], 10) - 1];
        return `${day} ${month} ${parts[0]}`;
      }
    }
    return dateStr;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', padding: '10px 0' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="realGa" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#05472B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#05472B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="realGb" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00C0A3" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#00C0A3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={paddingX}
              y1={line.y}
              x2={width - paddingX}
              y2={line.y}
              stroke="var(--border)"
              strokeWidth="0.8"
              strokeDasharray={idx === 0 ? 'none' : '4 4'}
            />
            <text
              x={paddingX - 10}
              y={line.y + 4}
              textAnchor="end"
              style={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* Areas */}
        <path d={areaA} fill="url(#realGa)" style={{ transition: 'd 0.3s ease' }} />
        <path d={areaB} fill="url(#realGb)" style={{ transition: 'd 0.3s ease' }} />

        {/* Lines */}
        <path
          d={pathA}
          fill="none"
          stroke="#05472B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'd 0.3s ease' }}
        />
        <path
          d={pathB}
          fill="none"
          stroke="#00C0A3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'd 0.3s ease' }}
        />

        {/* X Axis Labels */}
        {labelsX.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={height - 2}
            textAnchor="middle"
            style={{ fontSize: 9.5, fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
          >
            {lbl.label}
          </text>
        ))}

        {/* Hover Vertical Line indicator */}
        {hoveredIndex !== null && (
          <line
            x1={paddingX + (hoveredIndex / (stats.length - 1)) * chartW}
            y1={paddingY}
            x2={paddingX + (hoveredIndex / (stats.length - 1)) * chartW}
            y2={paddingY + chartH}
            stroke="var(--border-strong)"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
        )}

        {/* Hover Points dots */}
        {hoveredIndex !== null && (
          <>
            <circle
              cx={pointsA[hoveredIndex].x}
              cy={pointsA[hoveredIndex].y}
              r="5"
              fill="#05472B"
              stroke="#fff"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' }}
            />
            <circle
              cx={pointsB[hoveredIndex].x}
              cy={pointsB[hoveredIndex].y}
              r="5"
              fill="#00C0A3"
              stroke="#fff"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' }}
            />
          </>
        )}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoveredIndex !== null && activePoint && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            padding: '8px 12px',
            fontSize: '11.5px',
            pointerEvents: 'none',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '130px',
            transition: 'left 0.08s ease, top 0.08s ease',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '3px', marginBottom: '2px' }}>
            {getTooltipDateLabel(activePoint.date)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#05472B', display: 'inline-block' }} />
              Pengunjung:
            </span>
            <strong style={{ color: 'var(--text-primary)' }}>{activePoint.sessions}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C0A3', display: 'inline-block' }} />
              Klik Item:
            </span>
            <strong style={{ color: 'var(--text-primary)' }}>{activePoint.clicks}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function UMKMPieChart({ data }: { data: { name: string; count: number }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const total = data.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) {
    return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Belum ada data</div>;
  }

  const radius = 50;
  const normalStroke = 18;
  const hoverStroke = 24;
  const circumference = 2 * Math.PI * radius; // ~314.159
  
  const colors = ['#05472B', '#00C0A3', '#CDFF00', '#AADCAB', '#013020'];
  
  let accumulatedPercent = 0;
  
  const segments = data.map((b, i) => {
    const percent = b.count / total;
    const strokeLength = percent * circumference;
    const strokeOffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;
    
    const displayPercent = Math.round(percent * 100);
    
    return {
      name: b.name,
      count: b.count,
      percent: displayPercent,
      color: colors[i % colors.length],
      strokeLength,
      strokeOffset,
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '16px 0', flexWrap: 'wrap', justifyContent: 'space-around' }}>
      {/* SVG Donut Chart */}
      <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="var(--surface-2)"
            strokeWidth={normalStroke}
          />
          {/* Segments */}
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={idx}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? hoverStroke : normalStroke}
                strokeDasharray={`${seg.strokeLength} ${circumference}`}
                strokeDashoffset={seg.strokeOffset}
                style={{
                  transition: 'stroke-width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                  cursor: 'pointer',
                  opacity: hoveredIdx === null || isHovered ? 1 : 0.6,
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>
        
        {/* Center Text inside Donut - Dynamic on Hover */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {activeSegment ? (
            <>
              <div 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)', 
                  textTransform: 'uppercase', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '110px' 
                }}
              >
                {activeSegment.name}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: activeSegment.color, lineHeight: 1.1, margin: '2px 0' }}>
                {activeSegment.count}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {activeSegment.percent}% dari total
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700, marginTop: '2px' }}>
                Total Klik
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend with percentages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 180 }}>
        {segments.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13.5,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isHovered ? 'var(--surface-2)' : 'transparent',
                transition: 'background 0.15s ease',
                cursor: 'pointer',
                border: isHovered ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: seg.color, flexShrink: 0, border: '1px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                <span style={{ color: isHovered ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: isHovered ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={seg.name}>
                  {seg.name}
                </span>
              </div>
              <span style={{ color: isHovered ? 'var(--color-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600, flexShrink: 0 }}>
                {seg.percent}% ({seg.count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- StatCard ---- */
function StatCard({ label, value, delta, dir, loading }: {
  label: string; value: string | number; delta?: string;
  dir?: 'up' | 'down'; loading?: boolean;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.scLabel}>{label}</div>
      <div className={`${styles.scValue} ${loading ? styles.skeleton : ''}`}>
        {loading ? '—' : value}
      </div>
      {delta && (
        <div className={`${styles.scDelta} ${dir === 'up' ? styles.deltaUp : styles.deltaDown}`}>
          {dir === 'up' ? '▲' : '▼'} {delta}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Main Page
   ============================================================ */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly'>('daily');
  const [topProductsFromDb, setTopProductsFromDb] = useState<{ name: string; businessName?: string; count: number; thumb?: string | null }[]>([]);

  // Subscribe realtime ke Firestore & load produk clickCount
  useEffect(() => {
    const unsub = subscribeAnalytics(
      (data) => { setStats(data); setLoading(false); },
      () => { setLoading(false); },
    );

    Promise.all([getAllProduk(), getAllBisnis()]).then(([products, businesses]) => {
      const bMap = new Map(businesses.map((b) => [b.business_id, b.business_name]));
      const sorted = products
        .filter((p) => !p.deletedAt && p.is_active !== false)
        .sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0))
        .slice(0, 6)
        .map((p) => ({
          name: p.product_name,
          businessName: bMap.get(p.business_id) || 'UMKM Banjarsari',
          count: p.clickCount ?? 0,
          thumb: p.thumbnail_url,
        }));
      setTopProductsFromDb(sorted);
    });

    return () => unsub();
  }, []);

  // Hitung max untuk progress bar channel
  const channelEntries = stats
    ? (Object.entries(stats.eventTypeCounts) as [EventType, number][])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
    : [];
  const maxChannel = channelEntries[0]?.[1] ?? 1;

  return (
    <div className={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Monitoring Dashboard</h1>
        </div>
      </div>

      {/* ===== PBI-18: STAT CARDS ===== */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Sesi Pengunjung"
          value={stats?.totalSessions.toLocaleString('id-ID') ?? '—'}
          loading={loading}
          delta={stats?.deltas.sessions.delta ?? '0%'}
          dir={stats?.deltas.sessions.dir ?? 'up'}
        />
        <StatCard
          label="Total Event Tercatat"
          value={stats?.totalEvents.toLocaleString('id-ID') ?? '—'}
          loading={loading}
          delta={stats?.deltas.events.delta ?? '0%'}
          dir={stats?.deltas.events.dir ?? 'up'}
        />
        <StatCard
          label="Klik WhatsApp"
          value={stats?.eventTypeCounts.WHATSAPP_CLICK.toLocaleString('id-ID') ?? '—'}
          loading={loading}
          delta={stats?.deltas.waClicks.delta ?? '0%'}
          dir={stats?.deltas.waClicks.dir ?? 'up'}
        />
        <StatCard
          label="Klik Marketplace"
          value={stats?.eventTypeCounts.MARKETPLACE_CLICK.toLocaleString('id-ID') ?? '—'}
          loading={loading}
          delta={stats?.deltas.mpClicks.delta ?? '0%'}
          dir={stats?.deltas.mpClicks.dir ?? 'down'}
        />
      </div>

      {/* ===== CHART ROW ===== */}
      <div className={styles.chartRow}>
        {/* Line chart — tren visual */}
        <div className={styles.card}>
          <div className={styles.cardHead} style={{ flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h4 className={styles.cardTitle}>Tren Aktivitas</h4>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'daily' | 'monthly')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="daily">Harian (30 hari)</option>
                <option value="monthly">Bulanan (12 bulan)</option>
              </select>
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={styles.dot} style={{ background: '#05472B' }} /> Pengunjung
              </span>
              <span className={styles.legendItem}>
                <span className={styles.dot} style={{ background: '#00C0A3' }} /> Klik Item
              </span>
            </div>
          </div>
          {loading ? (
            <div className={styles.skeleton} style={{ height: 200, borderRadius: 8 }} />
          ) : (
            <RealChart stats={timeRange === 'daily' ? (stats?.dailyStats ?? []) : (stats?.monthlyStats ?? [])} />
          )}
        </div>

        {/* PBI-20: Channel Analytics bar chart */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Aktivitas paling sering</h4>
          <div className={styles.barList}>
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className={`${styles.barRow} ${styles.skeleton}`} style={{ height: 36 }} />)
            ) : channelEntries.length === 0 ? (
              <p className={styles.emptyText}>Belum ada data.</p>
            ) : (
              channelEntries.map(([ch, val]) => (
                <div key={ch} className={styles.barRow}>
                  <span className={styles.barName}>{EVENT_LABELS[ch]}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles[`fill_${EVENT_COLORS[ch]}`]}`}
                      style={{ width: `${(val / maxChannel) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barVal}>{val}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== PBI-19: TOP ITEMS ROW ===== */}
      <div className={styles.topRow}>
        {/* Top Products */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Produk Paling Populer</h4>
          <div className={styles.itemList}>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className={`${styles.itemRow} ${styles.skeleton}`} style={{ height: 44 }} />)
            ) : (() => {
              const displayList: { name: string; businessName?: string; count: number; thumb?: string | null }[] =
                topProductsFromDb.length > 0
                  ? topProductsFromDb
                  : (stats?.topProducts ?? []).map((p) => ({ name: p.name, businessName: 'UMKM Banjarsari', count: p.count, thumb: null }));

              if (displayList.length === 0) {
                return <p className={styles.emptyText}>Belum ada data.</p>;
              }

              return displayList.map((it, i) => (
                <div key={i} className={`${styles.itemRow} ${i > 0 ? styles.itemRowBorder : ''}`}>
                  <span className={styles.rank}>#{i + 1}</span>
                  {it.thumb ? (
                    <img
                      src={it.thumb}
                      alt={it.name}
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      className={styles.itemThumb}
                      style={{ background: ['#AADCAB', '#05472B', '#00C0A3', '#013020', '#CDFF00', '#AADCAB'][i % 6] }}
                    />
                  )}
                  <div className={styles.itemMeta}>
                    <div className={styles.itemName}>{it.name}</div>
                    <div className={styles.itemSub}>{it.businessName || 'UMKM Banjarsari'}</div>
                  </div>
                  <span className={styles.itemClicks}>{it.count}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Top Businesses */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>UMKM Terpopuler</h4>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.skeleton} style={{ height: 28, borderRadius: 4 }} />
              ))}
            </div>
          ) : (
            <UMKMPieChart data={stats?.topBusinesses ?? []} />
          )}
        </div>
      </div>

      {/* ===== EVENT LOG TABLE ===== */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <div>
            <h4 className={styles.tableTitle}>Aktivitas Pengunjung Terkini</h4>
          </div>
          <span className={styles.liveChip}>● Live</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Tipe Event</th>
                <th>Produk / Layanan</th>
                <th>UMKM</th>
                <th>Detail / Tujuan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.tdCenter}>Memuat data...</td></tr>
              ) : stats?.recentEvents.filter(r => r.event_type !== 'PAGE_VIEW').length === 0 ? (
                <tr><td colSpan={5} className={styles.tdCenter}>
                  Belum ada aktivitas pengunjung tercatat.
                </td></tr>
              ) : (
                stats?.recentEvents
                  .filter(r => r.event_type !== 'PAGE_VIEW')
                  .map((r) => (
                    <tr key={r.event_id}>
                      <td className={styles.tdMono} style={{ whiteSpace: 'nowrap' }}>
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td><span className={styles.tag}>{EVENT_LABELS[r.event_type] || r.event_type}</span></td>
                      <td className={styles.tdBold}>
                        {r.itemName || r.product_id || r.service_id || '—'}
                      </td>
                      <td>{r.businessName || r.business_id || '—'}</td>
                      <td className={styles.tdMono} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.destination_url
                          ? <a href={r.destination_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                              {r.destination_url}
                            </a>
                          : '—'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

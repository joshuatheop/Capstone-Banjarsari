'use client';

import { ArrowUpRight as LinkOutIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { LeafletMap } from '@/lib/leaflet-types';
import { Icons } from './Icons';

interface BusinessLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  businessName?: string;
  address?: string | null;
}

const DEFAULT_LAT = -7.649987;
const DEFAULT_LNG = 110.123456;

export default function BusinessLocationMap({
  latitude,
  longitude,
  businessName = 'UMKM Banjarsari',
  address,
}: BusinessLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  const lat = latitude ?? DEFAULT_LAT;
  const lng = longitude ?? DEFAULT_LNG;

  useEffect(() => {
    if (window.L) {
      const timer = setTimeout(() => setLoaded(true), 0);
      return () => clearTimeout(timer);
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      setLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([lat, lng], 15);

    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    const popup = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = businessName;
    popup.append(title, document.createElement('br'), document.createTextNode(address || 'Kelurahan Banjarsari'));
    marker.bindPopup(popup).openPopup();
    return () => { map.remove(); mapRef.current = null; };
  }, [loaded, lat, lng, businessName, address]);

  return (
    <div style={{
      marginTop: 0,
      background: 'var(--surface-2)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
      border: '1px solid var(--line)',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>
          <Icons.MapPin style={{ width: 20, height: 20, color: 'var(--primary)' }} />
          <span>Lokasi UMKM</span>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--primary)',
            textDecoration: 'underline',
          }}
        >
          Buka Peta Penuh <LinkOutIcon size={16} aria-hidden="true"/>
        </a>
      </div>

      {address && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.4 }}>
          📍 {address}
        </p>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 320,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          zIndex: 1,
        }}
      />
    </div>
  );
}

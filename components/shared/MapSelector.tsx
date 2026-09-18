'use client';

import { useEffect, useRef, useState } from 'react';

interface MapSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Banjarsari area coordinates default
const DEFAULT_LAT = -7.649987;
const DEFAULT_LNG = 110.123456;

export default function MapSelector({ latitude, longitude, onChange }: MapSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // 1. Dynamic script loader for Leaflet
  useEffect(() => {
    if ((window as any).L) {
      setLoaded(true);
      return;
    }

    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Add Leaflet Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      setLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // 2. Initialize Map once Leaflet is loaded
  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const initialLat = latitude ?? DEFAULT_LAT;
    const initialLng = longitude ?? DEFAULT_LNG;

    // Avoid double initialization
    if (mapRef.current) {
      // Just update center and marker if props changed from external source
      const currentMarker = markerRef.current;
      if (currentMarker) {
        const currentLatLng = currentMarker.getLatLng();
        if (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
          if (latitude != null && longitude != null) {
            currentMarker.setLatLng([latitude, longitude]);
            mapRef.current.panTo([latitude, longitude]);
          }
        }
      }
      return;
    }

    // Init map
    const map = L.map(containerRef.current).setView([initialLat, initialLng], 14);
    mapRef.current = map;

    // Add OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add custom marker icon styling for premium feel
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Create marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerRef.current = marker;

    // Listen to drag events
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(position.lat, position.lng);
    });

    // Listen to map click events to place marker
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange(lat, lng);
    });

    // Cleanup map on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [loaded, onChange]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        onChange(lat, lon);
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lon]);
          mapRef.current.setView([lat, lon], 16); // Zoom in closer
        }
      } else {
        alert('Lokasi tidak ditemukan.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mencari lokasi. Coba lagi.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          width: '100%',
        }}
      >
        <input
          type="text"
          placeholder="Cari lokasi/alamat... (cth: Banjarsari, Surakarta)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={searching}
          style={{
            flex: 1,
            height: '38px',
            padding: '0 12px',
            borderRadius: '6px',
            border: '1.5px solid var(--border-strong)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e);
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '6px',
            background: 'var(--color-primary)',
            color: 'white',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            opacity: searching ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {searching ? 'Mencari...' : '🔍 Cari'}
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        style={{
          height: '260px',
          width: '100%',
          borderRadius: '8px',
          border: '1.5px solid var(--border-strong)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      />
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        📍 Seret penanda (marker) merah, cari lokasi di atas, atau klik peta langsung untuk geotagging.
      </span>
    </div>
  );
}

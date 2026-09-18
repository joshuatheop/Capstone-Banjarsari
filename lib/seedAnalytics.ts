import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EventType, PriceType, AvailabilityType, CategoryType } from '@/lib/firestore/types';

// Seed lists with matching IDs to relate them correctly
const CATEGORIES = [
  { id: 'cat-makanan', name: 'Makanan & Minuman', type: 'PRODUCT' as CategoryType, slug: 'makanan-minuman', icon: '🍚' },
  { id: 'cat-kerajinan', name: 'Kerajinan Tangan', type: 'PRODUCT' as CategoryType, slug: 'kerajinan-tangan', icon: '🧺' },
  { id: 'cat-camilan', name: 'Camilan', type: 'PRODUCT' as CategoryType, slug: 'camilan', icon: '🥨' },
  { id: 'cat-elektronik', name: 'Jasa Reparasi', type: 'SERVICE' as CategoryType, slug: 'jasa-reparasi', icon: '🔧' },
  { id: 'cat-kecantikan', name: 'Kecantikan', type: 'SERVICE' as CategoryType, slug: 'kecantikan', icon: '💇' },
];

const BUSINESSES = [
  {
    id: 'biz-batik-sari',
    logo_url: null,
    name: 'Batik Sari Asih',
    description: 'Pengrajin batik tulis tradisional khas Banjarsari dengan motif unik warisan leluhur.',
    address: 'Jl. Melati No. 12, Banjarsari',
    phone: '628123456789',
    slug: 'batik-sari-asih',
    marketplace: 'https://shopee.co.id/batik-sari-asih',
    area: 'Banjarsari Utara',
    lat: -7.123456,
    lng: 110.123456,
    owner: 'Ibu Sri Wahyuni',
  },
  {
    id: 'biz-dapur-mak-inah',
    logo_url: null,
    name: 'Dapur Mak Inah',
    description: 'Produksi aneka masakan rumahan dan camilan tradisional. Tersedia untuk pesanan catering.',
    address: 'Jl. Kenanga No. 5, Banjarsari',
    phone: '628234567890',
    slug: 'dapur-mak-inah',
    marketplace: null,
    area: 'Banjarsari Selatan',
    lat: -7.124567,
    lng: 110.124567,
    owner: 'Ibu Suminah',
  },
  {
    id: 'biz-servis-budi',
    logo_url: null,
    name: 'Servis Elektronik Pak Budi',
    description: 'Melayani servis berbagai jenis elektronik: HP, laptop, TV, kulkas, AC.',
    address: 'Jl. Anggrek No. 8, Banjarsari',
    phone: '628345678901',
    slug: 'servis-elektronik-pak-budi',
    marketplace: null,
    area: 'Banjarsari Barat',
    lat: -7.125678,
    lng: 110.125678,
    owner: 'Budi Santoso',
  }
];

const PRODUCTS = [
  {
    id: 'prod-batik-parang',
    business_id: 'biz-batik-sari',
    category_id: 'cat-kerajinan',
    name: 'Batik Tulis Motif Parang',
    description: 'Kain batik tulis asli dengan motif parang khas Banjarsari. Dikerjakan oleh pengrajin berpengalaman.',
    price: 250000,
    slug: 'batik-tulis-motif-parang',
    whatsapp: '628123456789',
    marketplace: 'https://shopee.co.id/batik-sari-asih/batik-parang',
    thumbnail: null,
  },
  {
    id: 'prod-batik-truntum',
    business_id: 'biz-batik-sari',
    category_id: 'cat-kerajinan',
    name: 'Batik Cap Motif Truntum',
    description: 'Batik cap premium dengan motif truntum. Bahan katun halus, nyaman dipakai.',
    price: 180000,
    slug: 'batik-cap-motif-truntum',
    whatsapp: '628123456789',
    marketplace: 'https://shopee.co.id/batik-sari-asih/batik-truntum',
    thumbnail: null,
  },
  {
    id: 'prod-mendoan',
    business_id: 'biz-dapur-mak-inah',
    category_id: 'cat-makanan',
    name: 'Tempe Mendoan Crispy',
    description: 'Mendoan crispy homemade dengan bumbu rahasia. Cocok untuk camilan atau lauk makan.',
    price: 15000,
    slug: 'tempe-mendoan-crispy',
    whatsapp: '628234567890',
    marketplace: null,
    thumbnail: null,
  },
  {
    id: 'prod-kripik',
    business_id: 'biz-dapur-mak-inah',
    category_id: 'cat-camilan',
    name: 'Kripik Singkong Pedas Manis',
    description: 'Kripik singkong renyah dengan varian rasa pedas manis khas Jawa Tengah.',
    price: 20000,
    slug: 'kripik-singkong-pedas-manis',
    whatsapp: '628234567890',
    marketplace: null,
    thumbnail: null,
  }
];

const SERVICES = [
  {
    id: 'serv-hp',
    business_id: 'biz-servis-budi',
    category_id: 'cat-elektronik',
    name: 'Servis HP & Smartphone',
    description: 'Perbaikan HP semua merek: ganti layar, baterai, charger, software. Bergaransi 30 hari.',
    min_price: 50000,
    max_price: 350000,
    price_type: 'RANGE' as PriceType,
    is_negotiable: true,
    whatsapp: '628345678901',
    marketplace: null,
    availability: 'ALWAYS_AVAILABLE' as AvailabilityType,
    slug: 'servis-hp-smartphone',
    thumbnail: null,
  },
  {
    id: 'serv-laptop',
    business_id: 'biz-servis-budi',
    category_id: 'cat-elektronik',
    name: 'Servis Laptop & Komputer',
    description: 'Install ulang OS, bersih virus, upgrade RAM/SSD, ganti keyboard/LCD laptop.',
    min_price: 100000,
    max_price: 500000,
    price_type: 'RANGE' as PriceType,
    is_negotiable: true,
    whatsapp: '628345678901',
    marketplace: null,
    availability: 'BY_SCHEDULE' as AvailabilityType,
    slug: 'servis-laptop-komputer',
    thumbnail: null,
  },
  {
    id: 'serv-katering',
    business_id: 'biz-dapur-mak-inah',
    category_id: 'cat-makanan',
    name: 'Katering Nasi Box Rumahan',
    description: 'Layanan katering nasi box untuk acara arisan, rapat, atau hajatan. Min. order 20 box.',
    min_price: 15000,
    max_price: 35000,
    price_type: 'RANGE' as PriceType,
    is_negotiable: false,
    whatsapp: '628234567890',
    marketplace: null,
    availability: 'BY_REQUEST' as AvailabilityType,
    slug: 'katering-nasi-box',
    thumbnail: null,
  }
];

const EVENT_TYPES: EventType[] = [
  'PRODUCT_VIEW',
  'BUSINESS_VIEW',
  'WHATSAPP_CLICK',
  'MARKETPLACE_CLICK',
  'SHARE_CLICK',
  'SERVICE_VIEW',
];

// Event distribution weights
const EVENT_WEIGHTS = [30, 18, 25, 10, 8, 9];

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Clear existing database data and seed everything matching the exact structure.
 */
export async function seedAnalytics(count = 50): Promise<void> {
  console.log('[Seeder] Starting total database reset and seed...');

  // 1. CLEAR COLLECTIONS (both new and old to avoid clutter)
  const collectionsToClear = [
    'kategori', 'bisnis', 'produk', 'jasa', 'analytics_events',
    'categories', 'businesses', 'products', 'services', 'analytics', 'toko'
  ];
  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const deleteBatch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          deleteBatch.delete(docSnap.ref);
        });
        await deleteBatch.commit();
        console.log(`[Seeder] Cleared collection: ${colName}`);
      }
    } catch (err) {
      console.warn(`[Seeder] Skip clearing collection ${colName}:`, err);
    }
  }

  // 2. SEED KATEGORI
  const kategoriBatch = writeBatch(db);
  CATEGORIES.forEach((c) => {
    const docRef = doc(db, 'kategori', c.id);
    kategoriBatch.set(docRef, {
      category_name: c.name,
      category_type: c.type,
      slug: c.slug,
      icon: c.icon,
      is_active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    });
  });
  await kategoriBatch.commit();
  console.log('[Seeder] Seeded kategori collection.');

  // 3. SEED BISNIS
  const bisnisBatch = writeBatch(db);
  BUSINESSES.forEach((b) => {
    const docRef = doc(db, 'bisnis', b.id);
    bisnisBatch.set(docRef, {
      business_logo_url: b.logo_url,
      business_name: b.name,
      business_description: b.description,
      business_address: b.address,
      business_phone: b.phone,
      slug: b.slug,
      marketplace: b.marketplace,
      area_name: b.area,
      latitude: b.lat,
      longitude: b.lng,
      owner_name: b.owner,
      is_active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    });
  });
  await bisnisBatch.commit();
  console.log('[Seeder] Seeded bisnis collection.');

  // 4. SEED PRODUK
  const produkBatch = writeBatch(db);
  PRODUCTS.forEach((p) => {
    const docRef = doc(db, 'produk', p.id);
    produkBatch.set(docRef, {
      business_id: p.business_id,
      category_id: p.category_id,
      product_name: p.name,
      product_description: p.description,
      product_price: p.price,
      slug: p.slug,
      whatsapp_number: p.whatsapp,
      marketplace: p.marketplace,
      thumbnail_url: p.thumbnail,
      is_active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    });
  });
  await produkBatch.commit();
  console.log('[Seeder] Seeded produk collection.');

  // 5. SEED JASA
  const jasaBatch = writeBatch(db);
  SERVICES.forEach((s) => {
    const docRef = doc(db, 'jasa', s.id);
    jasaBatch.set(docRef, {
      business_id: s.business_id,
      category_id: s.category_id,
      service_name: s.name,
      service_description: s.description,
      minimum_price: s.min_price,
      maximum_price: s.max_price,
      price_type: s.price_type,
      is_negotiable: s.is_negotiable,
      whatsapp_number: s.whatsapp,
      marketplace: s.marketplace,
      availability_type: s.availability,
      slug: s.slug,
      thumbnail_url: s.thumbnail,
      is_active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    });
  });
  await jasaBatch.commit();
  console.log('[Seeder] Seeded jasa collection.');

  // 6. SEED ANALYTICS EVENTS
  const eventsBatch = writeBatch(db);
  const productWeights = PRODUCTS.map((_, j) => Math.max(10 - j * 1.5, 1));

  for (let i = 0; i < count; i++) {
    const sessionId = `session-${randomId()}`;
    const eventTypeIdx = weightedRandom(EVENT_WEIGHTS);
    const eventType = EVENT_TYPES[eventTypeIdx];
    const productIdx = weightedRandom(productWeights);
    const product = PRODUCTS[productIdx];
    const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];

    const eventId = `event-${randomId()}`;
    const docRef = doc(db, 'analytics_events', eventId);

    let eventData: Record<string, unknown> = {
      session_id: sessionId,
      event_type: eventType,
      business_id: null,
      product_id: null,
      service_id: null,
      destination_url: null,
      createdAt: serverTimestamp(),
    };

    switch (eventType) {
      case 'PRODUCT_VIEW':
        eventData = {
          ...eventData,
          product_id: product.id,
          business_id: product.business_id,
          destination_url: product.name,
        };
        break;

      case 'SERVICE_VIEW':
        eventData = {
          ...eventData,
          service_id: service.id,
          business_id: service.business_id,
          destination_url: service.name,
        };
        break;

      case 'BUSINESS_VIEW': {
        const allBiz = BUSINESSES;
        const biz = allBiz[Math.floor(Math.random() * allBiz.length)];
        eventData = {
          ...eventData,
          business_id: biz.id,
          destination_url: biz.name,
        };
        break;
      }

      case 'WHATSAPP_CLICK': {
        const allBiz = BUSINESSES;
        const biz = allBiz[Math.floor(Math.random() * allBiz.length)];
        eventData = {
          ...eventData,
          product_id: product.id,
          business_id: biz.id,
          destination_url: biz.name,
        };
        break;
      }

      case 'MARKETPLACE_CLICK':
        eventData = {
          ...eventData,
          product_id: product.id,
          business_id: product.business_id,
          destination_url: product.name,
        };
        break;

      case 'SHARE_CLICK':
        eventData = {
          ...eventData,
          product_id: product.id,
          destination_url: product.name,
        };
        break;
    }

    eventsBatch.set(docRef, eventData);
  }

  await eventsBatch.commit();
  console.log(`[Seeder] Seeded ${count} analytics events.`);
}

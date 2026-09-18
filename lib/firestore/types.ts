// ============================================================
// Type Definitions — PALUGADA Data Models (v2)
// ============================================================

// ---- Enum Types ----
export type CategoryType = 'PRODUCT' | 'SERVICE';
export type PriceType = 'FIXED' | 'STARTING_FROM' | 'RANGE' | 'CONTACT_PROVIDER';
export type AvailabilityType =
  | 'ALWAYS_AVAILABLE'
  | 'BY_SCHEDULE'
  | 'BY_REQUEST'
  | 'TEMPORARILY_UNAVAILABLE';
export type UserRole = 'admin' | 'pelanggan';
export type EventType =
  | 'BUSINESS_VIEW'
  | 'PRODUCT_VIEW'
  | 'SERVICE_VIEW'
  | 'WHATSAPP_CLICK'
  | 'MARKETPLACE_CLICK'
  | 'SHARE_CLICK'
  | 'PAGE_VIEW';

// ---- A. Produk ----
export interface ProdukItem {
  product_id: string;           // UUID / Firestore doc ID
  business_id: string;          // FK → businesses
  category_id: string;          // FK → categories
  product_name: string;
  product_description: string | null;
  product_price: number;        // BIGINT as number
  slug: string;
  whatsapp_number: string | null;
  marketplace: string | null;
  media_sosial: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  like_count?: number;
  clickCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// ---- B. Bisnis ----
export interface Business {
  business_id: string;          // UUID / Firestore doc ID
  business_logo_url: string | null;
  business_name: string;
  business_description: string | null;
  business_address: string | null;
  business_phone: string | null;
  slug: string;
  marketplace: string | null;
  area_name: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_name: string | null;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// ---- C. Kategori ----
export interface Category {
  category_id: string;          // UUID / Firestore doc ID
  category_name: string;
  category_type: CategoryType;
  slug: string;
  icon: string | null;          // kept for UI display (emoji)
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// ---- D. Jasa ----
export interface ServiceItem {
  service_id: string;           // UUID / Firestore doc ID
  business_id: string;          // FK → businesses
  category_id: string;          // FK → categories
  service_name: string;
  service_description: string | null;
  minimum_price: number | null;
  maximum_price: number | null;
  price_type: PriceType;
  is_negotiable: boolean;
  whatsapp_number: string | null;
  marketplace: string | null;
  availability_type: AvailabilityType;
  slug: string;
  thumbnail_url: string | null;
  is_active: boolean;
  like_count?: number;
  clickCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// ---- E. Users ----
export interface User {
  user_id: string;              // UUID / Firebase Auth UID
  email: string;
  role: UserRole;
  photo_url: string | null;
  display_name: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// ---- F. Visitor Sessions ----
export interface VisitorSession {
  session_id: string;
  visitor_id: string;
  user_id: string | null;
  startedAt?: Date;
  lastActivityAt?: Date;
}

// ---- G. Analytics Events ----
export interface AnalyticsEvent {
  event_id: string;             // UUID / Firestore doc ID
  session_id: string;           // FK → visitor_sessions
  business_id: string | null;
  product_id: string | null;
  service_id: string | null;
  event_type: EventType;
  destination_url: string | null; // also used as display name in aggregation
  createdAt?: Date;
  itemName?: string | null;
  businessName?: string | null;
}

// ---- H. SEO Meta ----
export interface SeoMeta {
  title: string;             // max 60 chars
  description: string;      // max 160 chars
  ogTitle: string;
  ogDescription: string;
  updatedAt?: Date;
}

// ---- I. Review Item (Ulasan & Rating) ----
export interface ReviewItem {
  review_id: string;
  item_id: string;
  item_type: 'product' | 'service';
  user_id: string;
  user_name: string;
  user_photo: string | null;
  rating: number;
  comment: string;
  createdAt?: Date;
}

// ============================================================
// Helper: format service price for display
// ============================================================
export function getServicePriceDisplay(service: ServiceItem): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  switch (service.price_type) {
    case 'FIXED':
      return service.minimum_price != null ? fmt(service.minimum_price) : 'Hubungi Kami';
    case 'STARTING_FROM':
      return service.minimum_price != null
        ? `Mulai ${fmt(service.minimum_price)}`
        : 'Hubungi Kami';
    case 'RANGE':
      if (service.minimum_price != null && service.maximum_price != null)
        return `${fmt(service.minimum_price)} – ${fmt(service.maximum_price)}`;
      return 'Hubungi Kami';
    case 'CONTACT_PROVIDER':
    default:
      return 'Hubungi Kami';
  }
}

// ============================================================
// Helper: generate URL slug from string
// ============================================================
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

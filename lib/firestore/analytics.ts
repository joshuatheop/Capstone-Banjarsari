import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AnalyticsEvent, EventType } from './types';

export type { AnalyticsEvent, EventType };

/* ============================================================
   Aggregated result types untuk Dashboard
   ============================================================ */
export interface DashboardStats {
  totalSessions:    number;                       // unique visitor sessions
  totalEvents:      number;                       // total event count
  topProducts:      { name: string; count: number }[];
  topBusinesses:    { name: string; count: number }[];
  eventTypeCounts:  Record<EventType, number>;
  recentEvents:     AnalyticsEvent[];
  dailyStats:       { date: string; sessions: number; clicks: number }[];
  monthlyStats:     { date: string; sessions: number; clicks: number }[];
  deltas: {
    sessions: { delta: string; dir: 'up' | 'down' };
    events:   { delta: string; dir: 'up' | 'down' };
    waClicks: { delta: string; dir: 'up' | 'down' };
    mpClicks: { delta: string; dir: 'up' | 'down' };
  };
}

const ANALYTICS_COL = 'analytics_events';

/* ============================================================
   Helper: parse Firestore doc → AnalyticsEvent
   ============================================================ */
function toAnalyticsEvent(id: string, data: Record<string, unknown>): AnalyticsEvent {
  // Fallback for events recorded with old structure (PBI-13, 14, 15)
  const rawType = (data.Channel_Click_Type as string) || (data.event_type as string) || '';
  let eventType: EventType = 'PRODUCT_VIEW';
  
  if (rawType === 'view_item') {
    eventType = data.service_id ? 'SERVICE_VIEW' : 'PRODUCT_VIEW';
  } else if (rawType === 'click_wa' || rawType === 'WHATSAPP_CLICK') {
    eventType = 'WHATSAPP_CLICK';
  } else if (rawType === 'click_marketplace' || rawType === 'MARKETPLACE_CLICK') {
    eventType = 'MARKETPLACE_CLICK';
  } else if (rawType === 'view_business' || rawType === 'BUSINESS_VIEW') {
    eventType = 'BUSINESS_VIEW';
  } else if (rawType === 'click_share' || rawType === 'SHARE_CLICK') {
    eventType = 'SHARE_CLICK';
  } else if (rawType === 'page_view' || rawType === 'PAGE_VIEW') {
    eventType = 'PAGE_VIEW';
  } else if (rawType) {
    eventType = rawType as EventType;
  }

  // Fallback for timestamp keys
  const rawCreatedAt = data.createdAt || data.timestamp || data.Click_Timestamp;
  const createdAt = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : new Date();

  // Extract display names
  const itemName = (data.Top_Clicked_Item as string) || 
                   (data.product_id ? (data.destination_url as string) : null) ||
                   (data.service_id ? (data.destination_url as string) : null) ||
                   null;

  const businessName = (data.Top_Business_Profile as string) || 
                       (data.business_id && data.event_type === 'BUSINESS_VIEW' ? (data.destination_url as string) : null) ||
                       null;

  return {
    event_id:        id,
    session_id:      (data.session_id as string) || '',
    business_id:     (data.business_id as string) || null,
    product_id:      (data.product_id as string) || null,
    service_id:      (data.service_id as string) || null,
    event_type:      eventType,
    destination_url: (data.destination_url as string) || (data.Marketplace_URL as string) || (data.WA_Number as string) || null,
    createdAt,
    itemName,
    businessName,
  };
}

/* ============================================================
   Helper: aggregate events → DashboardStats
   ============================================================ */
function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}function aggregateEvents(events: AnalyticsEvent[]): DashboardStats {
  // Total unique sessions (exclude server-session placeholder)
  const realEvents = events.filter(e => e.session_id && e.session_id !== 'server-session');
  const totalSessions = new Set(realEvents.map((e) => e.session_id)).size;
  const totalEvents   = events.length;

  // Generate the last 30 days daily tracker map
  const dailyDataMap: Record<string, { sessions: Set<string>; clicks: number }> = {};
  const last30Days: string[] = [];
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toLocalDateStr(d);
    last30Days.push(dateStr);
    dailyDataMap[dateStr] = {
      sessions: new Set<string>(),
      clicks: 0
    };
  }

  // Generate the last 12 months monthly tracker map
  const monthlyDataMap: Record<string, { label: string; sessions: Set<string>; clicks: number }> = {};
  const last12Months: string[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const label = `${monthNames[monthIndex]} ${String(year).slice(-2)}`;
    
    last12Months.push(monthKey);
    monthlyDataMap[monthKey] = {
      label,
      sessions: new Set<string>(),
      clicks: 0
    };
  }

  // Event type counts
  const eventTypeCounts: Record<EventType, number> = {
    BUSINESS_VIEW:     0,
    PRODUCT_VIEW:      0,
    SERVICE_VIEW:      0,
    WHATSAPP_CLICK:    0,
    MARKETPLACE_CLICK: 0,
    SHARE_CLICK:       0,
    PAGE_VIEW:         0,
  };

  // Top products — keyed by product_id, name from itemName or Top_Clicked_Item
  const productCount: Record<string, number> = {};
  const productNames: Record<string, string> = {};

  // Top businesses — keyed by business_id or businessName, count ANY interaction
  // We count: BUSINESS_VIEW + WHATSAPP_CLICK + MARKETPLACE_CLICK toward that UMKM
  const bizCount: Record<string, number> = {};
  const bizDisplayNames: Record<string, string> = {};

  for (const e of events) {
    if (e.event_type in eventTypeCounts) {
      eventTypeCounts[e.event_type]++;
    }

    // Track product popularity (PRODUCT_VIEW + SERVICE_VIEW)
    if ((e.event_type === 'PRODUCT_VIEW' || e.event_type === 'SERVICE_VIEW')) {
      const key = e.product_id || e.service_id;
      if (key) {
        productCount[key] = (productCount[key] ?? 0) + 1;
        // Prefer itemName (Top_Clicked_Item) over destination_url
        const displayName = e.itemName || e.destination_url;
        if (displayName) productNames[key] = displayName;
      }
    }

    // Track UMKM popularity: any engagement event that has a business context
    // Use businessName (Top_Business_Profile) as key when business_id is missing
    const bizKey = e.business_id || e.businessName;
    const bizName = e.businessName || e.business_id;
    if (
      bizKey &&
      (e.event_type === 'BUSINESS_VIEW' ||
       e.event_type === 'WHATSAPP_CLICK' ||
       e.event_type === 'MARKETPLACE_CLICK' ||
       e.event_type === 'SHARE_CLICK')
    ) {
      bizCount[bizKey] = (bizCount[bizKey] ?? 0) + 1;
      if (bizName) bizDisplayNames[bizKey] = bizName;
    }

    // Populate daily stats if date is in range
    const eventDate = e.createdAt;
    if (eventDate) {
      const dateStr = toLocalDateStr(eventDate);
      if (dateStr in dailyDataMap) {
        if (e.session_id && e.session_id !== 'server-session') {
          dailyDataMap[dateStr].sessions.add(e.session_id);
        }
        if (
          e.event_type === 'WHATSAPP_CLICK' ||
          e.event_type === 'MARKETPLACE_CLICK' ||
          e.event_type === 'SHARE_CLICK'
        ) {
          dailyDataMap[dateStr].clicks++;
        }
      }

      // Populate monthly stats if month is in range
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      if (monthKey in monthlyDataMap) {
        if (e.session_id && e.session_id !== 'server-session') {
          monthlyDataMap[monthKey].sessions.add(e.session_id);
        }
        if (
          e.event_type === 'WHATSAPP_CLICK' ||
          e.event_type === 'MARKETPLACE_CLICK' ||
          e.event_type === 'SHARE_CLICK'
        ) {
          monthlyDataMap[monthKey].clicks++;
        }
      }
    }
  }

  const topProducts = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({ name: productNames[id] || id, count }));

  const topBusinesses = Object.entries(bizCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: bizDisplayNames[id] || id, count }));

  const recentEvents = events.slice(0, 20);

  const dailyStats = last30Days.map((date) => ({
    date,
    sessions: dailyDataMap[date].sessions.size,
    clicks: dailyDataMap[date].clicks,
  }));

  const monthlyStats = last12Months.map((monthKey) => ({
    date: monthlyDataMap[monthKey].label,
    sessions: monthlyDataMap[monthKey].sessions.size,
    clicks: monthlyDataMap[monthKey].clicks,
  }));

  // Calculate Deltas: Bulan Ini (Current Month) vs Bulan Lalu (Previous Month)
  const now = new Date();
  const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const currSessions = new Set<string>();
  const prevSessions = new Set<string>();
  let currEvents = 0;
  let prevEvents = 0;
  let currWa = 0;
  let prevWa = 0;
  let currMp = 0;
  let prevMp = 0;

  for (const e of events) {
    if (!e.createdAt) continue;
    const t = e.createdAt.getTime();
    if (t >= startCurrentMonth) {
      if (e.session_id && e.session_id !== 'server-session') {
        currSessions.add(e.session_id);
      }
      currEvents++;
      if (e.event_type === 'WHATSAPP_CLICK') currWa++;
      if (e.event_type === 'MARKETPLACE_CLICK') currMp++;
    } else if (t >= startPrevMonth && t < startCurrentMonth) {
      if (e.session_id && e.session_id !== 'server-session') {
        prevSessions.add(e.session_id);
      }
      prevEvents++;
      if (e.event_type === 'WHATSAPP_CLICK') prevWa++;
      if (e.event_type === 'MARKETPLACE_CLICK') prevMp++;
    }
  }

  function formatDelta(curr: number, prev: number): { delta: string; dir: 'up' | 'down' } {
    if (prev === 0) {
      if (curr === 0) return { delta: '0%', dir: 'up' };
      return { delta: '+100%', dir: 'up' };
    }
    const pct = ((curr - prev) / prev) * 100;
    const formatted = Math.abs(pct).toFixed(1).replace('.', ',');
    if (pct >= 0) {
      return { delta: `+${formatted}%`, dir: 'up' };
    } else {
      return { delta: `−${formatted}%`, dir: 'down' };
    }
  }

  const deltas = {
    sessions: formatDelta(currSessions.size, prevSessions.size),
    events: formatDelta(currEvents, prevEvents),
    waClicks: formatDelta(currWa, prevWa),
    mpClicks: formatDelta(currMp, prevMp),
  };

  return { totalSessions, totalEvents, topProducts, topBusinesses, eventTypeCounts, recentEvents, dailyStats, monthlyStats, deltas };
}

/* ============================================================
   Subscribe realtime ke koleksi analytics_events
   ============================================================ */
export function subscribeAnalytics(
  callback: (stats: DashboardStats) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, ANALYTICS_COL),
    orderBy('createdAt', 'desc'),
    limit(1000),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events: AnalyticsEvent[] = snapshot.docs.map((doc) =>
        toAnalyticsEvent(doc.id, doc.data() as Record<string, unknown>)
      );
      callback(aggregateEvents(events));
    },
    (err) => {
      console.error('[analytics_events] snapshot error:', err);
      onError?.(err);
    },
  );
}

/* ============================================================
   One-shot fetch
   ============================================================ */
export async function fetchAnalyticsStats(): Promise<DashboardStats> {
  const q = query(
    collection(db, ANALYTICS_COL),
    orderBy('createdAt', 'desc'),
    limit(1000),
  );
  const snapshot = await getDocs(q);
  const events: AnalyticsEvent[] = snapshot.docs.map((doc) =>
    toAnalyticsEvent(doc.id, doc.data() as Record<string, unknown>)
  );
  return aggregateEvents(events);
}

// Helper to get or create a session ID stored in sessionStorage (PBI-18)
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem('visitor_session_id');
  if (!sid) {
    sid = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    sessionStorage.setItem('visitor_session_id', sid);
  }
  return sid;
}

/* ============================================================
   Track a redirect / click event (PBI-13, PBI-14, PBI-15)
   ============================================================ */
export async function trackClickEvent(
  type: string,
  metadata: {
    itemName?: string;
    businessName?: string;
    waNumber?: string;
    marketplaceUrl?: string;
    socialMedia?: string;
    productId?: string;
    serviceId?: string;
    businessId?: string;
  }
): Promise<void> {
  try {
    const col = collection(db, ANALYTICS_COL);
    const sessionId = getOrCreateSessionId();
    
    // Map event type to standard enum
    let standardEventType: EventType = 'PRODUCT_VIEW';
    if (type === 'view_item') {
      standardEventType = metadata.serviceId ? 'SERVICE_VIEW' : 'PRODUCT_VIEW';
    } else if (type === 'click_wa') {
      standardEventType = 'WHATSAPP_CLICK';
    } else if (type === 'click_marketplace') {
      standardEventType = 'MARKETPLACE_CLICK';
    } else if (type === 'view_business') {
      standardEventType = 'BUSINESS_VIEW';
    } else if (type === 'click_share') {
      standardEventType = 'SHARE_CLICK';
    } else if (type === 'page_view') {
      standardEventType = 'PAGE_VIEW';
    }

    const destinationUrl = metadata.marketplaceUrl || metadata.waNumber || metadata.itemName || null;

    await addDoc(col, {
      // Old Schema fields (PBI-13, 14, 15 backward compatibility)
      Total_Visitors: 0,
      Top_Clicked_Item: metadata.itemName || '',
      Top_Business_Profile: metadata.businessName || '',
      Channel_Click_Type: type,
      timestamp: serverTimestamp(),
      Click_Timestamp: serverTimestamp(),
      WA_Number: metadata.waNumber || null,
      Marketplace_URL: metadata.marketplaceUrl || null,
      Media_Sosial: metadata.socialMedia || null,
      
      // New Schema fields (PBI-18, 19, 20 & Dashboard Chart integration)
      session_id: sessionId,
      event_type: standardEventType,
      business_id: metadata.businessId || null,
      product_id: metadata.productId || null,
      service_id: metadata.serviceId || null,
      destination_url: destinationUrl,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[analytics] trackClickEvent error:', error);
  }
}

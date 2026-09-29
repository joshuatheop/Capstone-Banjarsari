export interface OjekContact { id: string; name: string; photo: string | null; phone: string | null; area?: string; rating: number | null; reviewCount?: number; demo?: boolean }
// Fictional examples, loaded only in local preview. No production driver directory has been connected.
export const demoOjekContacts: OjekContact[] = [
  { id: 'demo-dedi', name: 'Pak Dedi (contoh)', photo: null, phone: '6280000000001', area: 'Banjarsari', rating: null, demo: true },
  { id: 'demo-asep', name: 'Pak Asep (contoh)', photo: null, phone: '6280000000002', area: 'Banjarsari dan sekitarnya', rating: null, demo: true },
];
export function ojekMessage(name: string) { return `Halo ${name}, saya mendapatkan kontak dari PALUGADA Banjarsari. Apakah tersedia untuk ojek?`; }

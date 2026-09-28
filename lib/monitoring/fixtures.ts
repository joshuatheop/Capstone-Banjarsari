import type { MonitoringData, MonitorOrder } from './types';

const order = (index: number, day: number, overrides: Partial<MonitorOrder>): MonitorOrder => ({
  id: `PLG-2609-${String(index).padStart(3, '0')}`, customerId: 'preview-customer', customer: 'Warga Banjarsari',
  seller: 'Dapur Mak Inah', vertical: 'FOOD', total: 36000, item: 'Tempe Mendoan Crispy', quantity: 3,
  status: 'COMPLETED', payment: 'PAID', method: 'QRIS', delivery: 'DELIVERED', courier: 'Dedi',
  createdAt: `2026-09-${String(day).padStart(2, '0')}T08:00:00+07:00`, ...overrides,
});

// Deliberately fictional, fixed fixtures. No production or payment provider data.
export const monitoringFixture: MonitoringData = {
  source: 'preview', asOf: '2026-09-28T17:00:00+07:00',
  orders: [
    order(12, 28, { status: 'ON_DELIVERY', delivery: 'ON_DELIVERY' }),
    order(11, 28, { seller: 'Batik Sari Asih', vertical: 'RETAIL', item: 'Batik Tulis Motif Parang', quantity: 1, total: 250000, status: 'PROCESSING', delivery: 'WAITING_ASSIGNMENT', courier: null }),
    order(10, 28, { customerId: 'customer-2', customer: 'Rina', status: 'PENDING_PAYMENT', payment: 'PENDING', delivery: 'WAITING_ASSIGNMENT', courier: null, method: 'Transfer bank' }),
    order(9, 27, { total: 60000, quantity: 5 }),
    order(8, 27, { customerId: 'customer-2', customer: 'Rina', total: 24000, quantity: 2, status: 'CANCELLED', payment: 'FAILED', delivery: 'CANCELLED', courier: null }),
    order(7, 26, { seller: 'Batik Sari Asih', vertical: 'RETAIL', item: 'Batik Cap Motif Truntum', total: 175000, quantity: 1 }),
    order(6, 25, { total: 48000, quantity: 4, method: 'COD' }),
    order(5, 24, { customerId: 'customer-3', customer: 'Asep', total: 24000, quantity: 2 }),
    order(4, 23, { seller: 'Batik Sari Asih', vertical: 'RETAIL', item: 'Batik Tulis Motif Parang', total: 500000, quantity: 2 }),
    order(3, 22, { total: 72000, quantity: 6 }),
    order(2, 15, { total: 48000, quantity: 4, status: 'CANCELLED', payment: 'REFUNDED', delivery: 'CANCELLED' }),
    order(1, 7, { seller: 'Batik Sari Asih', vertical: 'RETAIL', item: 'Batik Tulis Motif Parang', total: 250000, quantity: 1 }),
  ],
  bookings: [
    { id: 'BKG-2609-003', customerId: 'preview-customer', customer: 'Warga Banjarsari', service: 'Servis HP & Smartphone', provider: 'Servis Elektronik Pak Budi', schedule: '2026-09-29T09:00:00+07:00', status: 'CONFIRMED', estimate: 50000 },
    { id: 'BKG-2609-002', customerId: 'customer-2', customer: 'Rina', service: 'Katering Nasi Box Rumahan', provider: 'Dapur Mak Inah', schedule: '2026-09-30T11:00:00+07:00', status: 'REQUESTED', estimate: 300000 },
    { id: 'BKG-2609-001', customerId: 'preview-customer', customer: 'Warga Banjarsari', service: 'Servis Laptop & Komputer', provider: 'Servis Elektronik Pak Budi', schedule: '2026-09-25T10:00:00+07:00', status: 'COMPLETED', estimate: 150000 },
  ],
  accounts: [
    { id: 'seller-1', name: 'Sri Wahyuni', role: 'seller', active: true, business: 'Batik Sari Asih' },
    { id: 'seller-2', name: 'Suminah', role: 'seller', active: true, business: 'Dapur Mak Inah' },
    { id: 'seller-3', name: 'Budi Santoso', role: 'seller', active: true, business: 'Servis Elektronik Pak Budi' },
    { id: 'preview-customer', name: 'Warga Banjarsari', role: 'customer', active: true },
    { id: 'customer-2', name: 'Rina', role: 'customer', active: true },
    { id: 'customer-3', name: 'Asep', role: 'customer', active: true },
    { id: 'courier-1', name: 'Dedi', role: 'courier', active: true },
    { id: 'courier-2', name: 'Agus', role: 'courier', active: false },
  ],
};

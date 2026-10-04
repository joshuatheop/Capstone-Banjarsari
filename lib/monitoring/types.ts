export type OrderStatus = 'AWAITING_SELLER' | 'PENDING_PAYMENT' | 'PROCESSING' | 'ON_DELIVERY' | 'COMPLETED' | 'CANCELLED';
export interface MonitorOrder {
  businessId?: string;
  id: string;
  customerId: string;
  customer: string;
  seller: string;
  vertical: 'RETAIL' | 'FOOD';
  total: number;
  item: string;
  quantity: number;
  status: OrderStatus;
  payment: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  method: 'Transfer bank' | 'COD' | 'QRIS';
  delivery: 'WAITING_ASSIGNMENT' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'PICKUP';
  courier: string | null;
  createdAt: string;
  checkoutId?: string;
  items?: { productId: string; name: string; price: number; quantity: number }[];
  address?: string;
  phone?: string;
  note?: string;
  recipientName?: string;
  subtotal?: number;
  discount?: number;
  voucherCode?: string;
}
export interface MonitorBooking {
  businessId?: string;
  id: string;
  customerId: string;
  customer: string;
  service: string;
  provider: string;
  schedule: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  estimate: number;
}
export interface MonitorAccount { id: string; name: string; role: 'seller' | 'customer' | 'courier'; active: boolean; business?: string }
export interface MonitoringData {
  source: 'preview';
  asOf: string;
  orders: MonitorOrder[];
  bookings: MonitorBooking[];
  accounts: MonitorAccount[];
}

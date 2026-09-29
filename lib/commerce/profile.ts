import type { CustomerContact } from './contact';
export interface SavedAddress extends CustomerContact { id: string; label: string; recipient: string; note: string }
export interface CustomerProfile { name: string; addresses: SavedAddress[]; defaultAddressId: string }
export const emptyProfile: CustomerProfile = { name: '', addresses: [], defaultAddressId: '' };
export function addressIsComplete(address?: SavedAddress): boolean {
  return !!address && !!address.id && address.label.trim().length > 0 && address.label.length <= 40 && address.recipient.trim().length >= 2 && address.recipient.length <= 100 && address.address.trim().length >= 10 && address.address.length <= 500 && /^0[0-9]{8,14}$/.test(address.phone) && address.note.length <= 200;
}
export function profileIsComplete(profile: CustomerProfile): boolean {
  return profile.name.trim().length >= 2 && profile.name.length <= 100 && addressIsComplete(profile.addresses.find(a => a.id === profile.defaultAddressId));
}
export function safeReturnPath(path: string | null, fallback = '/'): string {
  return path && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !path.startsWith('/profile/complete') ? path : fallback;
}
export function checkoutQuantity(value?: string): number {
  if (value === undefined) return 1;
  return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 99 ? Number(value) : 0;
}

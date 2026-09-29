export interface CustomerContact { address: string; phone: string }
export const emptyContact: CustomerContact = { address: '', phone: '' };
export function normalizeContact(contact: CustomerContact): CustomerContact {
  const phone = contact.phone.replace(/[\s()-]/g, '').replace(/^\+?62/, '0');
  return { address: contact.address.trim(), phone };
}
export function contactIsValid(contact: CustomerContact): boolean {
  const clean = normalizeContact(contact);
  return clean.address.length >= 10 && clean.address.length <= 500 && /^0[0-9]{8,14}$/.test(clean.phone);
}

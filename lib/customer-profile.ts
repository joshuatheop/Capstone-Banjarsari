import { getUserDocument, updateUserDocument } from '@/lib/auth';
import { LOCAL_PREVIEW } from '@/lib/local-preview';
import { readCustomerContact, saveCustomerContact } from './customer-contact';
import { normalizeContact } from './commerce/contact';
import { addressIsComplete, profileIsComplete, type CustomerProfile, type SavedAddress } from './commerce/profile';

const key = (uid: string) => `palugada-profile:${uid}`;
export async function readCustomerProfile(uid: string, displayName: string | null): Promise<CustomerProfile> {
  const doc = LOCAL_PREVIEW ? null : await getUserDocument(uid);
  const raw = localStorage.getItem(key(uid));
  if (raw) {
    const value = JSON.parse(raw);
    if (typeof value?.name === 'string' && typeof value?.defaultAddressId === 'string' && Array.isArray(value.addresses) && value.addresses.every((a: SavedAddress) => a && ['id','label','recipient','note','address','phone'].every(k => typeof a[k as keyof SavedAddress] === 'string'))) {
      if (doc) return { ...value, name: doc.displayName ?? value.name, addresses: value.addresses.map((address: SavedAddress) => address.id === value.defaultAddressId ? { ...address, ...normalizeContact({ address: doc.alamat ?? address.address, phone: doc.noTelepon ?? address.phone }) } : address) };
      return value;
    }
  }
  const contact = await readCustomerContact(uid);
  const name = doc?.displayName ?? displayName ?? '';
  const address: SavedAddress = { id: 'legacy-default', label: 'Utama', recipient: name, note: '', ...contact };
  return { name, addresses: contact.address || contact.phone ? [address] : [], defaultAddressId: contact.address || contact.phone ? address.id : '' };
}
export async function saveCustomerProfile(uid: string, value: CustomerProfile): Promise<CustomerProfile> {
  const clean = { ...value, name: value.name.trim(), addresses: value.addresses.map(a => ({ ...a, ...normalizeContact(a), label: a.label.trim(), recipient: a.recipient.trim(), note: a.note.trim() })) };
  if (!uid || !profileIsComplete(clean) || clean.addresses.length > 10 || !clean.addresses.every(addressIsComplete) || new Set(clean.addresses.map(a => a.id)).size !== clean.addresses.length) throw new Error('Lengkapi nama, nomor HP, dan alamat utama yang valid.');
  const primary = clean.addresses.find(a => a.id === clean.defaultAddressId)!;
  await saveCustomerContact(uid, primary);
  if (!LOCAL_PREVIEW) await updateUserDocument(uid, { displayName: clean.name });
  localStorage.setItem(key(uid), JSON.stringify(clean));
  return clean;
}

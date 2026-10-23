import { getUserDocument, updateUserDocument } from '@/lib/auth';
import { NONPROD } from '@/lib/nonprod';
import { contactIsValid, emptyContact, normalizeContact, type CustomerContact } from '@/lib/commerce/contact';

export async function readCustomerContact(uid: string): Promise<CustomerContact> {
  if (NONPROD) {
    const value = JSON.parse(localStorage.getItem(`palugada-address:${uid}`) || '{}');
    return typeof value?.address === 'string' && typeof value?.phone === 'string' ? normalizeContact(value) : { ...emptyContact };
  }
  const profile = await getUserDocument(uid);
  return normalizeContact({ address: profile?.alamat ?? '', phone: profile?.noTelepon ?? '' });
}

export async function saveCustomerContact(uid: string, contact: CustomerContact): Promise<CustomerContact> {
  if (!uid || !contactIsValid(contact)) throw new Error('Isi alamat minimal 10 karakter dan nomor HP Indonesia yang valid.');
  const clean = normalizeContact(contact);
  if (NONPROD) localStorage.setItem(`palugada-address:${uid}`, JSON.stringify(clean));
  else await updateUserDocument(uid, { alamat: clean.address, noTelepon: clean.phone });
  return clean;
}

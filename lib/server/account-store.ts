import 'server-only';
import { mkdir, open, readFile, rename, unlink, writeFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { AccountIdentity, AccountWorkspace } from '@/lib/accounts/types';
import { AccountError, actorSafeId, emptyWorkspace } from '@/lib/accounts/policy';
import { previewEnabled } from './preview-session';

export function adminServices() {
  if (process.env.PALUGADA_ACCOUNT_SERVER_ENABLED !== 'true') throw new AccountError('Layanan akun production belum dikonfigurasi. Hubungi pengelola.', 503);
  const app = getApps().find(app => app.name === 'palugada-server') ?? initializeApp({ credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }, 'palugada-server');
  return { auth: getAuth(app), db: getFirestore(app) };
}
const folder = path.join(process.cwd(), '.local', 'account-workspaces');
export async function readWorkspace(identity: AccountIdentity): Promise<AccountWorkspace> {
  if (!previewEnabled()) {
    const snapshot = await adminServices().db.collection('palugada_workspaces').doc(actorSafeId(identity.uid)).get();
    return snapshot.exists ? snapshot.data() as AccountWorkspace : emptyWorkspace(identity);
  }
  try { return JSON.parse(await readFile(path.join(folder, `${actorSafeId(identity.uid)}.json`), 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyWorkspace(identity); throw error; }
}
export async function listWorkspaces(): Promise<AccountWorkspace[]> {
  if (!previewEnabled()) return (await adminServices().db.collection('palugada_workspaces').get()).docs.map(doc => doc.data() as AccountWorkspace);
  await mkdir(folder, { recursive: true });
  const files = (await readdir(folder)).filter(name => name.endsWith('.json'));
  return Promise.all(files.map(async name => JSON.parse(await readFile(path.join(folder, name), 'utf8')) as AccountWorkspace));
}
export async function mutateWorkspace(identity: AccountIdentity, action: (workspace: AccountWorkspace) => void): Promise<AccountWorkspace> {
  if (!previewEnabled()) {
    const { db } = adminServices();
    return db.runTransaction(async transaction => {
      const ref = db.collection('palugada_workspaces').doc(actorSafeId(identity.uid));
      const snapshot = await transaction.get(ref);
      const workspace = snapshot.exists ? snapshot.data() as AccountWorkspace : emptyWorkspace(identity);
      action(workspace);
      if (Buffer.byteLength(JSON.stringify(workspace), "utf8") > 850000) throw new AccountError("Ukuran data toko terlalu besar. Kurangi gambar atau deskripsi.");
      const business = workspace.business;
      if (business) {
        const businessRef = db.collection('bisnis').doc(business.id);
        const existing = await transaction.get(businessRef);
        if (existing.exists && existing.get('owner_user_id') !== identity.uid) throw new AccountError('Business ID sudah dimiliki akun lain.', 409);
        // Owned catalog uses new UUIDs. Existing legacy records are never claimed by name/email.
        const listingRefs = workspace.listings.map(item => db.collection(item.kind === 'SERVICE' ? 'jasa' : 'produk').doc(item.id));
        const listings = listingRefs.length ? await transaction.getAll(...listingRefs) : [];
        for (const listing of listings) if (listing.exists && listing.get('business_id') !== business.id) throw new AccountError('Produk bukan milik toko.', 403);
        transaction.set(businessRef, { business_name: business.businessName, business_description: business.description, business_address: business.address, business_phone: business.whatsapp, business_logo_url: business.logo,
          owner_name: business.ownerName, owner_user_id: business.ownerId, seller_status: business.status, slug: business.id, area_name: business.address, latitude: null, longitude: null, marketplace: null,
          is_active: business.status === 'ACTIVE', createdAt: new Date(business.createdAt), updatedAt: new Date() }, { merge: true });
        workspace.listings.forEach((item, index) => transaction.set(listingRefs[index], {
          business_id: business.id, category_id: item.kind === 'SERVICE' ? 'seller-service' : item.kind === 'FOOD' ? 'seller-food' : 'seller-retail', vertical: item.kind,
          ...(item.kind === 'SERVICE' ? { service_name: item.name, service_description: item.description, minimum_price: item.price, maximum_price: null, price_type: 'FIXED', availability_type: 'ALWAYS_AVAILABLE', is_negotiable: false } : { product_name: item.name, product_description: item.description, product_price: item.price, stock_on_hand: item.stock }),
          thumbnail_url: item.image || null, whatsapp_number: business.whatsapp, slug: item.id, is_active: item.active && business.status === 'ACTIVE', updatedAt: new Date(item.updatedAt),
          ...(!listings[index].exists ? { createdAt: new Date(item.updatedAt), deletedAt: null } : {}),
        }, { merge: true }));
      }
      transaction.set(ref, workspace);
      return workspace;
    });
  }
  await mkdir(folder, { recursive: true });
  const filename = path.join(folder, `${actorSafeId(identity.uid)}.json`), lockfile = filename + '.lock';
  let lock;
  for (let i = 0; i < 150; i++) {
    try { lock = await open(lockfile, 'wx'); break; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; await new Promise(resolve => setTimeout(resolve, 20)); }
  }
  if (!lock) throw new AccountError('Akun sedang diproses. Coba lagi.', 409);
  try {
    const workspace = await readWorkspace(identity); action(workspace);
    if (Buffer.byteLength(JSON.stringify(workspace), "utf8") > 850000) throw new AccountError("Ukuran data toko terlalu besar. Kurangi gambar atau deskripsi.");
    const temp = filename + `.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(workspace), 'utf8'); await rename(temp, filename);
    return workspace;
  } finally { await lock.close(); await unlink(lockfile); }
}

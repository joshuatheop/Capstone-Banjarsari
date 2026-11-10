import 'server-only';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { AccountIdentity, AccountWorkspace } from '@/lib/accounts/types';
import { AccountError, actorSafeId, emptyWorkspace } from '@/lib/accounts/policy';
import { nonprodEnabled } from './nonprod-session';
import { DbError, rpc } from './nonprod-db';

export function adminServices() {
  if (process.env.PALUGADA_ACCOUNT_SERVER_ENABLED !== 'true') throw new AccountError('Layanan akun production belum dikonfigurasi. Hubungi pengelola.', 503);
  const app = getApps().find(app => app.name === 'palugada-server') ?? initializeApp({ credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }, 'palugada-server');
  return { auth: getAuth(app), db: getFirestore(app) };
}
const tooLarge = (workspace: AccountWorkspace) => {
  if (Buffer.byteLength(JSON.stringify(workspace), 'utf8') > 850000) throw new AccountError('Ukuran data toko terlalu besar. Kurangi gambar atau deskripsi.');
};
const readNonprod = async (identity: AccountIdentity) => {
  const rows = await rpc<{ data: AccountWorkspace; revision: number }[]>('workspace_get', { p_uid: actorSafeId(identity.uid) });
  return rows[0] ? { workspace: rows[0].data, revision: rows[0].revision } : { workspace: emptyWorkspace(identity), revision: 0 };
};
export async function readWorkspace(identity: AccountIdentity): Promise<AccountWorkspace> {
  if (!nonprodEnabled()) {
    const snapshot = await adminServices().db.collection('palugada_workspaces').doc(actorSafeId(identity.uid)).get();
    return snapshot.exists ? snapshot.data() as AccountWorkspace : emptyWorkspace(identity);
  }
  return (await readNonprod(identity)).workspace;
}
export async function listWorkspaces(): Promise<AccountWorkspace[]> {
  if (!nonprodEnabled()) return (await adminServices().db.collection('palugada_workspaces').get()).docs.map(doc => doc.data() as AccountWorkspace);
  return (await rpc<{ data: AccountWorkspace }[]>('workspace_list')).map(row => row.data);
}
export async function mutateWorkspace(identity: AccountIdentity, action: (workspace: AccountWorkspace) => void): Promise<AccountWorkspace> {
  if (!nonprodEnabled()) {
    const { db } = adminServices();
    return db.runTransaction(async transaction => {
      const ref = db.collection('palugada_workspaces').doc(actorSafeId(identity.uid));
      const snapshot = await transaction.get(ref);
      const workspace = snapshot.exists ? snapshot.data() as AccountWorkspace : emptyWorkspace(identity);
      const previousStocks = new Map(workspace.listings.map(item => [item.id, item.stock]));
      action(workspace);
      tooLarge(workspace);
      const business = workspace.business;
      if (business) {
        const businessRef = db.collection('bisnis').doc(business.id);
        const existing = await transaction.get(businessRef);
        if (existing.exists && existing.get('owner_user_id') !== identity.uid) throw new AccountError('Business ID sudah dimiliki akun lain.', 409);
        // Owned catalog uses new UUIDs. Existing legacy records are never claimed by name/email.
        const listingRefs = workspace.listings.map(item => db.collection(item.kind === 'SERVICE' ? 'jasa' : 'produk').doc(item.id));
        const listings = listingRefs.length ? await transaction.getAll(...listingRefs) : [];
        for (const listing of listings) if (listing.exists && listing.get('business_id') !== business.id) throw new AccountError('Produk bukan milik toko.', 403);
        for (const item of workspace.listings) {
          const stored = listings[workspace.listings.indexOf(item)];
          const available = Number(stored.get('stock_on_hand') ?? 0) + item.stock - (previousStocks.get(item.id) ?? 0);
          if (item.kind !== 'SERVICE' && stored.exists && (available < 0 || available > 1e6)) throw new AccountError('Stok tersedia harus 0–1.000.000 unit.', 409);
        }
        transaction.set(businessRef, { business_name: business.businessName, business_description: business.description, business_address: business.address, business_phone: business.whatsapp, business_logo_url: business.logo,
          owner_name: business.ownerName, owner_user_id: business.ownerId, seller_status: business.status, slug: business.id, area_name: business.address, latitude: null, longitude: null, marketplace: null,
          is_active: business.status === 'ACTIVE', createdAt: new Date(business.createdAt), updatedAt: new Date() }, { merge: true });
        workspace.listings.forEach((item, index) => transaction.set(listingRefs[index], {
          business_id: business.id, category_id: item.kind === 'SERVICE' ? 'seller-service' : 'seller-product', vertical: item.kind === 'SERVICE' ? undefined : 'PRODUK_UMKM',
          ...(item.kind === 'SERVICE' ? { service_name: item.name, service_description: item.description, minimum_price: item.price, maximum_price: null, price_type: 'FIXED', availability_type: 'ALWAYS_AVAILABLE', is_negotiable: false } : { product_name: item.name, product_description: item.description, product_price: item.price, stock_on_hand: listings[index].exists ? Number(listings[index].get('stock_on_hand') ?? 0) + item.stock - (previousStocks.get(item.id) ?? 0) : item.stock }),
          thumbnail_url: item.image || null, whatsapp_number: business.whatsapp, slug: item.id, is_active: item.active && business.status === 'ACTIVE', updatedAt: new Date(item.updatedAt),
          ...(!listings[index].exists ? { createdAt: new Date(item.updatedAt), deletedAt: null } : {}),
        }, { merge: true }));
      }
      transaction.set(ref, workspace);
      return workspace;
    });
  }
  // Optimistic lock: baca revision, terapkan perubahan, simpan hanya bila revision belum berubah.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { workspace, revision } = await readNonprod(identity);
    action(workspace); tooLarge(workspace);
    try { await rpc('workspace_commit', { p_uid: actorSafeId(identity.uid), p_data: workspace, p_revision: revision }); return workspace; }
    catch (error) {
      if (error instanceof DbError && error.message.includes('workspace_commit')) throw new AccountError('Pembaruan database workspace belum diterapkan. Hubungi pengelola (migrasi 20261101000000).', 503);
      if (error instanceof DbError && error.message === 'business_owned') throw new AccountError('Business atau produk sudah dimiliki akun lain.', 409);
      if (error instanceof DbError && error.message === 'stock_insufficient') throw new AccountError('Stok tersedia tidak cukup untuk pengurangan ini.', 409);
      if (!(error instanceof DbError && error.message === 'conflict')) throw error;
    }
  }
  throw new AccountError('Akun sedang diproses. Coba lagi.', 409);
}

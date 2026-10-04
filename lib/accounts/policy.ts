import type { AccountIdentity, AccountWorkspace, SellerApplicationForm, SellerListing } from './types';

export class AccountError extends Error { status: number; constructor(message: string, status = 400) { super(message); this.status = status; } }
export function emptyWorkspace(identity: AccountIdentity): AccountWorkspace {
  return { access: { uid: identity.uid, roles: ['CUSTOMER'], sellerStatus: 'NONE', businessId: null }, email: identity.email, name: identity.name, application: null, business: null, listings: [] };
}
function text(value: unknown, label: string, max: number, min = 0) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) throw new AccountError(`${label} harus ${min}–${max} karakter.`);
  return value.trim();
}
export function imageValue(value: unknown, allowData = false) {
  const image = text(value, 'Logo/foto', allowData ? 140000 : 2000);
  if (!image) return '';
  if (allowData && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) return image;
  try { const url = new URL(image); if (url.protocol === 'https:' && !url.username && !url.password) return image; } catch {}
  throw new AccountError('Gunakan URL HTTPS atau foto PNG/JPG/WebP maksimal 100 KB.');
}
export function applicationForm(input: Record<string, unknown>, submitted: boolean): SellerApplicationForm {
  if (!['RETAIL','FOOD','SERVICE'].includes(String(input.category))) throw new AccountError('Pilih kategori usaha.');
  const whatsapp = text(input.whatsapp, 'WhatsApp', 24).replace(/[\s()+-]/g, '').replace(/^0/, '62');
  if (whatsapp && !/^62\d{8,13}$/.test(whatsapp) || submitted && !whatsapp) throw new AccountError('Nomor WhatsApp Indonesia tidak valid.');
  const result = { businessName: text(input.businessName, 'Nama usaha', 120, submitted ? 2 : 0), ownerName: text(input.ownerName, 'Nama pemilik', 100, submitted ? 2 : 0), whatsapp,
    address: text(input.address, 'Alamat usaha', 500, submitted ? 10 : 0), category: input.category as SellerApplicationForm['category'], description: text(input.description, 'Deskripsi', 2000, submitted ? 10 : 0), logo: imageValue(input.logo, true) };
  if (submitted && !result.logo) throw new AccountError('Tambahkan logo atau foto usaha.');
  return result;
}
export function saveApplication(workspace: AccountWorkspace, actor: AccountIdentity, input: Record<string, unknown>, submit: boolean, now: string) {
  if (actor.uid !== workspace.access.uid) throw new AccountError('Pengajuan bukan milik Anda.', 403);
  if (workspace.business || workspace.application && !['DRAFT','REJECTED'].includes(workspace.application.status)) throw new AccountError('Pengajuan ini sedang direview atau sudah disetujui.', 409);
  const form = applicationForm(input, submit), previous = workspace.application;
  const status: 'SUBMITTED' | 'DRAFT' = submit ? 'SUBMITTED' : 'DRAFT';
  workspace.application = { ...form, id: actor.uid, applicantId: actor.uid, applicantEmail: actor.email, status,
    createdAt: previous?.createdAt ?? now, updatedAt: now, submittedAt: submit ? now : null, reviewedAt: null, reviewedBy: null,
    rejectionReason: previous?.rejectionReason ?? null, revision: (previous?.revision ?? 0) + 1,
    history: [...(previous?.history ?? []), { status, at: now, actor: actor.uid, reason: null }].slice(-100) };
}
export function reviewApplication(workspace: AccountWorkspace, actor: AccountIdentity, action: string, reason: unknown, revision: unknown, now: string) {
  if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
  const application = workspace.application;
  if (!application || !['SUBMITTED','UNDER_REVIEW'].includes(application.status)) throw new AccountError('Pengajuan tidak dapat direview pada status ini.', 409);
  if (revision !== application.revision) throw new AccountError('Pengajuan berubah. Muat ulang sebelum review.', 409);
  if (!['review','approve','reject'].includes(action)) throw new AccountError('Aksi review tidak valid.');
  const rejectionReason = action === 'reject' ? text(reason, 'Alasan penolakan', 1000, 5) : null;
  application.status = action === 'review' ? 'UNDER_REVIEW' : action === 'approve' ? 'APPROVED' : 'REJECTED';
  application.reviewedBy = actor.uid; application.reviewedAt = now; application.updatedAt = now;
  application.rejectionReason = rejectionReason; application.revision++;
  application.history.push({ status: application.status, at: now, actor: actor.uid, reason: rejectionReason });
  if (action === 'approve') {
    const form = applicationForm(application as unknown as Record<string, unknown>, true);
    const businessId = workspace.access.businessId ?? `seller-${actorSafeId(application.applicantId)}`;
    workspace.business = { ...form, id: businessId, ownerId: application.applicantId, status: 'ACTIVE', createdAt: workspace.business?.createdAt ?? now };
    workspace.access = { uid: application.applicantId, roles: ['CUSTOMER','SELLER'], sellerStatus: 'ACTIVE', businessId };
  }
}
// UID is encoded, not guessed from business names. Firebase UIDs must never become a path segment unchecked.
export const actorSafeId = (uid: string) => encodeURIComponent(uid).replace(/\./g, '%2E');
export function assertOwner(workspace: AccountWorkspace, actor: AccountIdentity, businessId?: string) {
  if (workspace.access.uid !== actor.uid || !workspace.access.roles.includes('SELLER') || workspace.access.sellerStatus !== 'ACTIVE' || !workspace.business || workspace.business.ownerId !== actor.uid || workspace.business.status !== 'ACTIVE' || businessId !== undefined && businessId !== workspace.business.id) throw new AccountError('Akses seller ditolak atau toko ditangguhkan.', 403);
}
export function changeSellerStatus(workspace: AccountWorkspace, actor: AccountIdentity, suspend: boolean) {
  if (!actor.superAdmin) throw new AccountError('Akses khusus SUPER_ADMIN.', 403);
  if (!workspace.business || !workspace.access.roles.includes('SELLER')) throw new AccountError('Seller tidak ditemukan.', 404);
  workspace.business.status = suspend ? 'SUSPENDED' : 'ACTIVE'; workspace.access.sellerStatus = workspace.business.status;
}
export function saveListing(workspace: AccountWorkspace, actor: AccountIdentity, input: Record<string, unknown>, id: string, now: string) {
  assertOwner(workspace, actor, typeof input.businessId === 'string' ? input.businessId : undefined);
  if (!['RETAIL','FOOD','SERVICE'].includes(String(input.kind)) || typeof input.active !== 'boolean' || !Number.isSafeInteger(input.price) || Number(input.price) < 0 || Number(input.price) > 1e9 || !Number.isSafeInteger(input.stock) || Number(input.stock) < 0 || Number(input.stock) > 1e6) throw new AccountError('Jenis, harga, stok, atau status produk tidak valid.');
  const index = workspace.listings.findIndex(item => item.id === id);
  if (index >= 0 && workspace.listings[index].kind !== input.kind) throw new AccountError('Jenis item existing tidak dapat diubah. Buat item baru untuk jenis berbeda.');
  if (input.id && index < 0) throw new AccountError('Produk bukan milik toko Anda.', 403);
  if (index < 0 && workspace.listings.length >= 100) throw new AccountError('Maksimal 100 item per toko pada fase ini.');
  const listing: SellerListing = { id, businessId: workspace.business!.id, kind: input.kind as SellerListing['kind'], name: text(input.name, 'Nama produk/jasa', 120, 2), description: text(input.description, 'Deskripsi', 2000), price: Number(input.price), stock: Number(input.stock), image: imageValue(input.image), active: input.active, updatedAt: now };
  if (index < 0) workspace.listings.push(listing); else workspace.listings[index] = listing;
  return listing;
}

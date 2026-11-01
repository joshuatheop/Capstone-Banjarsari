import type { AccountIdentity, AccountWorkspace, OwnedBusiness, SellerListing } from './types';
import { AccountError, applicationForm, assertOwner, imageValue } from './policy';

export const inventoryLocations = (workspace: Pick<AccountWorkspace, 'inventoryLocations'>) => workspace.inventoryLocations ?? [{ id: 'store', name: 'Toko utama' }];
export const locationStock = (listing: SellerListing): Record<string, number> => listing.stockByLocation ?? { store: listing.stock };
export function addLocation(workspace: AccountWorkspace, actor: AccountIdentity, input: Record<string, unknown>, id: string) {
  assertOwner(workspace, actor);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 2 || name.length > 80) throw new AccountError('Nama lokasi harus 2–80 karakter.');
  const locations = inventoryLocations(workspace);
  if (locations.some(location => location.name.toLowerCase() === name.toLowerCase())) throw new AccountError('Nama lokasi sudah digunakan.', 409);
  if (locations.length >= 20) throw new AccountError('Maksimal 20 lokasi per toko.');
  workspace.inventoryLocations = [...locations, { id, name }];
}
export function adjustInventory(workspace: AccountWorkspace, actor: AccountIdentity, input: Record<string, unknown>, now: string) {
  assertOwner(workspace, actor);
  const { listingId, locationId, delta, idempotencyKey } = input;
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  if (typeof idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(idempotencyKey)) throw new AccountError('ID penyesuaian tidak valid.');
  if (!Number.isSafeInteger(delta) || !delta || Math.abs(Number(delta)) > 1e6 || reason.length < 5 || reason.length > 500) throw new AccountError('Isi perubahan unit bulat (bukan 0) dan alasan 5–500 karakter.');
  const previous = workspace.inventoryAdjustments?.find(row => row.id === idempotencyKey);
  if (previous) {
    if (previous.listingId !== listingId || previous.locationId !== locationId || previous.delta !== delta || previous.reason !== reason) throw new AccountError('ID penyesuaian sudah digunakan untuk perubahan lain.', 409);
    return;
  }
  const item = workspace.listings.find(row => row.id === listingId && row.kind !== 'SERVICE');
  if (!item) throw new AccountError('Produk bukan milik toko Anda.', 403);
  if (typeof locationId !== 'string' || !inventoryLocations(workspace).some(row => row.id === locationId)) throw new AccountError('Lokasi tidak ditemukan.');
  const balances = locationStock(item), before = balances[locationId] ?? 0, after = before + Number(delta);
  if (after < 0 || item.stock + Number(delta) < 0 || item.stock + Number(delta) > 1e6) throw new AccountError('Saldo stok tidak boleh negatif atau melebihi 1.000.000 unit.');
  if ((workspace.inventoryAdjustments?.length ?? 0) >= 1000) throw new AccountError('Batas jurnal tercapai. Hubungi pengelola untuk pengarsipan sebelum perubahan berikutnya.');
  item.stockByLocation = { ...balances, [locationId]: after }; item.stock += Number(delta); item.updatedAt = now;
  workspace.inventoryAdjustments = [...(workspace.inventoryAdjustments ?? []), { id: idempotencyKey, listingId: item.id, locationId, delta: Number(delta), reason, actorId: actor.uid, at: now, before, after }];
}
export function businessSettings(previous: OwnedBusiness, input: Record<string, unknown>): OwnedBusiness {
  const field = (key: string, max: number) => {
    const value = input[key] ?? previous[key as keyof OwnedBusiness] ?? '';
    if (typeof value !== 'string' || value.length > max) throw new AccountError(`${key} tidak valid (maks. ${max} karakter).`);
    return value.trim();
  };
  const coordinate = (key: 'latitude' | 'longitude', limit: number) => {
    const value = input[key] === undefined ? previous[key] ?? null : input[key];
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit)) throw new AccountError('Koordinat toko tidak valid.');
    return value as number | null;
  };
  if (input.isOpen !== undefined && typeof input.isOpen !== 'boolean') throw new AccountError('Status buka/tutup tidak valid.');
  return { ...previous, ...applicationForm(input, true), photo: imageValue(field('photo', 2000)), banner: imageValue(field('banner', 2000)),
    openingHours: field('openingHours', 500), pickupInfo: field('pickupInfo', 1000), serviceInfo: field('serviceInfo', 1000),
    isOpen: input.isOpen as boolean | undefined ?? previous.isOpen ?? true, latitude: coordinate('latitude', 90), longitude: coordinate('longitude', 180) };
}

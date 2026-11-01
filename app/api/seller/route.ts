import { randomUUID } from 'node:crypto';
import { accountFailure, accountIdentity, accountInput, accountReply } from '@/lib/server/account-auth';
import { mutateWorkspace, readWorkspace } from '@/lib/server/account-store';
import { AccountError, assertOwner, saveListing } from '@/lib/accounts/policy';
import { addLocation, adjustInventory, businessSettings, inventoryLocations } from '@/lib/accounts/inventory';
import { sellerMonitoring } from '@/lib/server/seller-data';
import { getStock } from '@/lib/server/commerce-store';
import { nonprodEnabled } from '@/lib/server/nonprod-session';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const actor = await accountIdentity(request), workspace = await readWorkspace(actor);
    assertOwner(workspace, actor, new URL(request.url).searchParams.get('businessId') ?? undefined);
    const stock = nonprodEnabled() ? await getStock() : {};
    const availableStock = Object.fromEntries(workspace.listings.filter(item => stock[item.id] !== undefined).map(item => [item.id, stock[item.id]]));
    return accountReply({ business: workspace.business, listings: workspace.listings, availableStock, locations: inventoryLocations(workspace), adjustments: workspace.inventoryAdjustments ?? [], data: await sellerMonitoring(workspace) });
  } catch (error) { return accountFailure(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await accountIdentity(request), input = await accountInput(request);
    if (input.id !== undefined && (typeof input.id !== 'string' || !input.id)) throw new AccountError('ID item tidak valid.');
    if (input.businessId !== undefined && typeof input.businessId !== 'string') throw new AccountError('Business ID tidak valid.');
    const workspace = await mutateWorkspace(actor, workspace => {
      assertOwner(workspace, actor, typeof input.businessId === 'string' ? input.businessId : undefined);
      if (input.action === 'listing') saveListing(workspace, actor, input, typeof input.id === 'string' ? input.id : `item-${randomUUID()}`, new Date().toISOString());
      else if (input.action === 'settings') workspace.business = businessSettings(workspace.business!, input);
      else if (input.action === 'location') addLocation(workspace, actor, input, `location-${randomUUID()}`);
      else if (input.action === 'adjustment') adjustInventory(workspace, actor, input, new Date().toISOString());
      else throw new AccountError('Aksi seller tidak dikenal.');
    });
    return accountReply({ business: workspace.business, listings: workspace.listings });
  } catch (error) { return accountFailure(error); }
}

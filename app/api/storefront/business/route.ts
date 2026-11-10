import { getBusiness } from '@/lib/firestore/data-loader';
import { readWorkspace } from '@/lib/server/account-store';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const headers = { 'Cache-Control':'no-store' };
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id || id.length > 200) return Response.json({ error:'ID toko tidak valid.' }, { status:400, headers });
    const record = await getBusiness(id);
    if (!record || !record.is_active) return Response.json({ profile:null }, { headers });
    if (!record.owner_user_id) return Response.json({ profile:null }, { headers });
    const workspace = await readWorkspace({ uid:record.owner_user_id, email:'', name:'', superAdmin:false });
    const shop = workspace.business;
    if (!shop || shop.id !== id || shop.ownerId !== record.owner_user_id || shop.status !== 'ACTIVE' || workspace.access.sellerStatus !== 'ACTIVE') return Response.json({ profile:null }, { headers });
    // Explicit public projection: never expose account roles, email, application or inventory journals.
    return Response.json({ profile:{ name:shop.businessName, description:shop.description, address:shop.address, whatsapp:shop.whatsapp, category:shop.category, logo:shop.logo,
      photo:shop.photo ?? '', banner:shop.banner ?? '', openingHours:shop.openingHours ?? '', isOpen:shop.isOpen ?? true,
      pickupInfo:shop.pickupInfo ?? '', serviceInfo:shop.serviceInfo ?? '', latitude:shop.latitude ?? null, longitude:shop.longitude ?? null } }, { headers });
  } catch { return Response.json({ error:'Informasi toko belum dapat dimuat.' }, { status:503, headers }); }
}

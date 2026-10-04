export type AccountRole = 'CUSTOMER' | 'SELLER' | 'COURIER' | 'SUPER_ADMIN';
export type LegacyRole = 'admin' | 'pelanggan' | 'customer' | 'seller' | 'courier';
export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type SellerStatus = 'NONE' | 'ACTIVE' | 'SUSPENDED';
export interface AccountAccess {
  uid: string; roles: AccountRole[]; sellerStatus: SellerStatus; businessId: string | null;
}
export interface SellerApplicationForm {
  businessName: string; ownerName: string; whatsapp: string; address: string;
  category: 'RETAIL' | 'FOOD' | 'SERVICE'; description: string; logo: string;
}
export interface SellerApplication extends SellerApplicationForm {
  id: string; applicantId: string; applicantEmail: string; status: ApplicationStatus;
  createdAt: string; updatedAt: string; submittedAt: string | null; reviewedAt: string | null;
  reviewedBy: string | null; rejectionReason: string | null; revision: number;
  history: { status: ApplicationStatus; at: string; actor: string; reason: string | null }[];
}
export interface OwnedBusiness extends SellerApplicationForm {
  id: string; ownerId: string; status: 'ACTIVE' | 'SUSPENDED'; createdAt: string;
}
export interface SellerListing {
  id: string; businessId: string; kind: 'RETAIL' | 'FOOD' | 'SERVICE'; name: string;
  description: string; price: number; image: string; active: boolean; stock: number;
  updatedAt: string;
}
export interface AccountWorkspace {
  access: AccountAccess; email: string; name: string;
  application: SellerApplication | null; business: OwnedBusiness | null; listings: SellerListing[];
}
export interface AccountIdentity { uid: string; email: string; name: string; superAdmin: boolean; courier?: boolean }
export const customerAccess = (uid: string): AccountAccess => ({ uid, roles: ['CUSTOMER'], sellerStatus: 'NONE', businessId: null });
export const isSeller = (access: AccountAccess | null) => !!access && access.roles.includes('SELLER') && access.sellerStatus === 'ACTIVE';
// Compatibility is for display/migration only. Server permissions never trust a browser role value.
export function normalizeRole(role: unknown): AccountRole {
  if (role === 'admin' || role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (role === 'seller' || role === 'SELLER') return 'SELLER';
  if (role === 'courier' || role === 'COURIER') return 'COURIER';
  return 'CUSTOMER';
}

// Explicit opt-in. Server endpoints additionally require development + loopback.
export const LOCAL_PREVIEW = process.env.NEXT_PUBLIC_LOCAL_PREVIEW === 'true';

export interface PreviewUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: null;
  role: 'admin' | 'customer';
}

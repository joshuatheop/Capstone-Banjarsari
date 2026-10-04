import { auth } from './firebase';
import { LOCAL_PREVIEW } from './local-preview';
export async function accountFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!LOCAL_PREVIEW) {
    const user = auth.currentUser;
    if (!user) throw new Error('Silakan masuk terlebih dahulu.');
    headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  }
  if (init.body) headers.set('Content-Type', 'application/json');
  return fetch(url, { ...init, headers, cache: 'no-store' });
}

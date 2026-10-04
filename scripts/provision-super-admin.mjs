// Operator-only migration. Never import this file into browser code.
// GOOGLE_APPLICATION_CREDENTIALS / ADC must identify the intended Firebase project.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const uid = process.argv[2];
if (!uid || uid.startsWith('-') || uid.length > 128) throw new Error('Usage: node scripts/provision-super-admin.mjs <verified-existing-uid>');
initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, role: 'SUPER_ADMIN' });
console.log(`SUPER_ADMIN provisioned for UID ${uid}. Sign in again to refresh the verified claim.`);

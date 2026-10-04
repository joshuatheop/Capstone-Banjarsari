/** @deprecated Privileged accounts must be provisioned with Firebase Admin SDK/custom claims by an operator. */
export async function seedAdmin(): Promise<void> {
  throw new Error('Client-side admin seeding dinonaktifkan. Provision SUPER_ADMIN melalui server tepercaya.');
}

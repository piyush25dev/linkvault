// Creates (or repairs) the single super admin account.
//   node scripts/seed-super-admin.mjs --password="YourStrongPassword"
//   node scripts/seed-super-admin.mjs --password="NewPassword" --reset     (also resets the password of an existing account)
// Reads SUPER_ADMIN_EMAIL and the Firebase Admin credentials from .env.local. Run it from the project root.
import { existsSync, readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

for (const f of ['.env.local', '.env']) if (existsSync(f)) for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
}
const arg = n => process.argv.find(a => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
const password = arg('password') || process.env.SUPER_ADMIN_PASSWORD; const reset = process.argv.includes('--reset');
const { FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
const projectId = FIREBASE_PROJECT_ID || NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!email) throw new Error('Set SUPER_ADMIN_EMAIL in .env.local first.');
if (!projectId || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) throw new Error('Firebase Admin credentials are missing in .env.local.');

const app = initializeApp({ credential: cert({ projectId, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }), projectId });
const auth = getAuth(app); const db = getFirestore(app);

let user = await auth.getUserByEmail(email).catch(() => null);
if (!user) {
  if (!password || password.length < 8) throw new Error('Pass a password of at least 8 characters: --password="..."');
  user = await auth.createUser({ email, password, displayName: 'Super Admin', emailVerified: true });
  console.log(`Created super admin ${email}`);
} else if (reset) {
  if (!password || password.length < 8) throw new Error('--reset needs --password of at least 8 characters');
  await auth.updateUser(user.uid, { password, disabled: false }); await auth.revokeRefreshTokens(user.uid);
  console.log('Password reset.');
} else console.log(`Account ${email} already exists. Making sure its admin claim is set.`);

await auth.setCustomUserClaims(user.uid, { superAdmin: true });   // the server only trusts admin rights that carry this claim
await db.collection('users').doc(user.uid).set({ email, displayName: user.displayName || 'Super Admin', role: 'superadmin', status: 'active', warnings: 0, createdAt: FieldValue.serverTimestamp() }, { merge: true });
console.log('Done. Sign in at /login with this email. You will be taken to /admin.');

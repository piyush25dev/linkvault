import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticate, apiError } from '@/lib/api-auth';
import { logActivity } from '@/lib/activity';
export const runtime = 'nodejs';

// Called once per browser session after sign-in: keeps the user profile fresh and records the login.
export async function POST(request: NextRequest) {
  const a = await authenticate(request); if (a.response) return a.response;
  try {
    const { adminAuth, adminDb } = getAdminServices();
    const u = await adminAuth.getUser(a.userId!);
    const ref = adminDb.collection('users').doc(u.uid); const snap = await ref.get();
    await ref.set({
      email: u.email ?? null, displayName: u.displayName ?? '', photoURL: u.photoURL ?? null, provider: u.providerData.map(p => p.providerId),
      role: a.isSuperAdmin ? 'superadmin' : 'user', lastLoginAt: FieldValue.serverTimestamp(), lastActiveAt: FieldValue.serverTimestamp(), loginCount: FieldValue.increment(1),
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp(), status: 'active', warnings: 0 }),
    }, { merge: true });
    await logActivity({ uid: u.uid, email: u.email, type: 'auth.login', details: u.providerData[0]?.providerId ?? 'password' });
    const d = snap.data();
    return NextResponse.json({ warnings: d?.warnings ?? 0, lastWarning: d?.lastWarning?.message ?? null, role: a.isSuperAdmin ? 'superadmin' : 'user' });
  } catch (e) { return apiError(e, 'Unable to start session'); }
}

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { isAdminEmail } from '@/lib/admin-config';
import { logActivity } from '@/lib/activity';
import { bad, plain } from '@/lib/admin-utils';
export const runtime = 'nodejs';
const PAGE = 20;

export async function GET(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const sp = new URL(request.url).searchParams; const q = (sp.get('q') || '').trim().toLowerCase(); const status = sp.get('status') || 'all'; const page = Math.max(0, Number(sp.get('page') || 0));
    const { adminAuth, adminDb } = getAdminServices();
    const all: UserRecord[] = []; let token: string | undefined;
    do { const r = await adminAuth.listUsers(1000, token); all.push(...r.users); token = r.pageToken; } while (token && all.length < 20000);
    const list = all.filter(u => (status === 'suspended' ? u.disabled : status === 'active' ? !u.disabled : true) && (!q || `${u.email} ${u.displayName} ${u.uid}`.toLowerCase().includes(q)))
      .sort((x, y) => new Date(y.metadata.creationTime).getTime() - new Date(x.metadata.creationTime).getTime());
    const rows = await Promise.all(list.slice(page * PAGE, (page + 1) * PAGE).map(async u => {
      const ref = adminDb.collection('users').doc(u.uid);
      const [prof, bm, fl] = await Promise.all([ref.get(), ref.collection('bookmarks').count().get(), adminDb.collection('flags').where('uid', '==', u.uid).where('status', '==', 'open').count().get()]);
      return { uid: u.uid, email: u.email ?? '', displayName: u.displayName ?? '', photoURL: u.photoURL ?? null, disabled: u.disabled, providers: u.providerData.map(p => p.providerId), createdAt: u.metadata.creationTime, lastSignIn: u.metadata.lastSignInTime || null,
        bookmarks: bm.data().count, openFlags: fl.data().count, warnings: prof.data()?.warnings ?? 0, isSuperAdmin: isAdminEmail(u.email) };
    }));
    return NextResponse.json(plain({ users: rows, total: list.length, page, pageSize: PAGE }));
  } catch (e) { return apiError(e, 'Unable to list users'); }
}

export async function POST(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const b = await request.json(); const email = String(b.email || '').trim().toLowerCase(); const password = String(b.password || ''); const displayName = String(b.displayName || '').trim().slice(0, 80);
    if (!/^\S+@\S+\.\S+$/.test(email)) return bad('Enter a valid email address');
    if (isAdminEmail(email)) return bad('This email is reserved for the super admin');
    if (password.length < 6) return bad('Password must be at least 6 characters');
    const { adminAuth, adminDb } = getAdminServices();
    const u = await adminAuth.createUser({ email, password, displayName: displayName || undefined });
    await adminDb.collection('users').doc(u.uid).set({ email, displayName, role: 'user', status: 'active', warnings: 0, createdAt: FieldValue.serverTimestamp(), createdBy: a.adminId });
    await logActivity({ uid: u.uid, email, type: 'admin.user.create', details: 'Account created by super admin', actorUid: a.adminId!, actorEmail: a.adminEmail });
    return NextResponse.json({ uid: u.uid, message: 'User created' }, { status: 201 });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/email-already-exists') return bad('A user with this email already exists', 409);
    return apiError(e, 'Unable to create user');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { isAdminEmail } from '@/lib/admin-config';
import { logActivity } from '@/lib/activity';
import { bad, plain } from '@/lib/admin-utils';
type Ctx = { params: Promise<{ uid: string }> };
export const runtime = 'nodejs';

async function load(uid: string) {
  const { adminAuth } = getAdminServices();
  try { return await adminAuth.getUser(uid); } catch { return null; }
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid } = await ctx.params; const u = await load(uid); if (!u) return bad('User not found', 404);
    const { adminDb } = getAdminServices(); const ref = adminDb.collection('users').doc(uid);
    const [prof, bm, trashed, cols, fl] = await Promise.all([ref.get(), ref.collection('bookmarks').count().get(), ref.collection('bookmarks').where('isDeleted', '==', true).count().get(), ref.collection('collections').count().get(), adminDb.collection('flags').where('uid', '==', uid).where('status', '==', 'open').count().get()]);
    const p = prof.data() ?? {};
    return NextResponse.json(plain({
      user: { uid, email: u.email ?? '', displayName: u.displayName ?? '', photoURL: u.photoURL ?? null, disabled: u.disabled, providers: u.providerData.map(x => x.providerId), createdAt: u.metadata.creationTime, lastSignIn: u.metadata.lastSignInTime || null,
        isSuperAdmin: isAdminEmail(u.email), warnings: p.warnings ?? 0, lastWarning: p.lastWarning ?? null, loginCount: p.loginCount ?? 0, lastActiveAt: p.lastActiveAt ?? null },
      stats: { bookmarks: bm.data().count, trashed: trashed.data().count, collections: cols.data().count, openFlags: fl.data().count },
    }));
  } catch (e) { return apiError(e, 'Unable to load user'); }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid } = await ctx.params; const u = await load(uid); if (!u) return bad('User not found', 404);
    const b = await request.json(); const { adminAuth, adminDb } = getAdminServices(); const ref = adminDb.collection('users').doc(uid);
    const target = isAdminEmail(u.email); const done: string[] = [];
    const log = (type: string, details: string) => logActivity({ uid, email: u.email, type, details, actorUid: a.adminId!, actorEmail: a.adminEmail });

    // The super admin's email is fixed, and the account can never be suspended.
    if (target && ('email' in b || 'disabled' in b)) return bad('The super admin email is fixed and the account cannot be suspended', 403);
    if (target && 'password' in b && uid !== a.adminId) return bad('Only the super admin can change this password', 403);

    if ('displayName' in b) { const n = String(b.displayName).trim().slice(0, 80); await adminAuth.updateUser(uid, { displayName: n }); await ref.set({ displayName: n }, { merge: true }); await log('admin.user.update', `Name set to "${n}"`); done.push('name'); }
    if ('email' in b) {
      const email = String(b.email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return bad('Enter a valid email address'); if (isAdminEmail(email)) return bad('This email is reserved for the super admin');
      await adminAuth.updateUser(uid, { email }); await ref.set({ email }, { merge: true }); await log('admin.user.update', `Email changed to ${email}`); done.push('email');
    }
    if ('password' in b) {
      const pw = String(b.password); if (pw.length < 6) return bad('Password must be at least 6 characters');
      await adminAuth.updateUser(uid, { password: pw }); await adminAuth.revokeRefreshTokens(uid); await log('admin.user.password', 'Password reset by super admin'); done.push('password');
    }
    if ('disabled' in b) {
      const off = Boolean(b.disabled); await adminAuth.updateUser(uid, { disabled: off }); if (off) await adminAuth.revokeRefreshTokens(uid);   // revoke = kicks out active sessions now
      await ref.set({ status: off ? 'suspended' : 'active' }, { merge: true }); await log(off ? 'admin.user.suspend' : 'admin.user.reactivate', String(b.reason || '').slice(0, 200)); done.push(off ? 'suspended' : 'reactivated');
    }
    if ('warn' in b) {
      const message = String(b.warn).trim().slice(0, 300); if (!message) return bad('Write a warning message');
      await ref.set({ warnings: FieldValue.increment(1), lastWarning: { message, at: new Date().toISOString() } }, { merge: true }); await log('admin.user.warn', message); done.push('warned');
    }
    return NextResponse.json({ message: done.length ? `Updated: ${done.join(', ')}` : 'Nothing to update' });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/email-already-exists') return bad('That email is already used by another account', 409);
    return apiError(e, 'Unable to update user');
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid } = await ctx.params; const u = await load(uid); if (!u) return bad('User not found', 404);
    if (isAdminEmail(u.email) || uid === a.adminId) return bad('The super admin account cannot be deleted', 403);
    const { adminAuth, adminDb } = getAdminServices();
    await adminDb.recursiveDelete(adminDb.collection('users').doc(uid));   // profile + bookmarks + collections
    await adminAuth.deleteUser(uid);
    await logActivity({ uid, email: u.email, type: 'admin.user.delete', details: `Deleted account ${u.email}`, actorUid: a.adminId!, actorEmail: a.adminEmail });   // logs and flags are kept as an audit trail
    return NextResponse.json({ message: 'User and all their data deleted' });
  } catch (e) { return apiError(e, 'Unable to delete user'); }
}

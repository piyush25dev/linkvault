import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { isAdminEmail } from '@/lib/admin-config';
import { logActivity } from '@/lib/activity';
import { bad } from '@/lib/admin-utils';
type Ctx = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';

// Review a flag: dismiss (false positive), reopen, or take action (delete the bookmark, warn or suspend the user).
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { id } = await ctx.params; const b = await request.json(); const { adminAuth, adminDb } = getAdminServices();
    const ref = adminDb.collection('flags').doc(id); const snap = await ref.get(); if (!snap.exists) return bad('Flag not found', 404);
    const f = snap.data()!; const log = (type: string, details: string) => logActivity({ uid: f.uid, email: f.email, type, details, actorUid: a.adminId!, actorEmail: a.adminEmail });
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp(), reviewedBy: a.adminEmail, reviewedAt: FieldValue.serverTimestamp() };
    if ('note' in b) update.note = String(b.note).slice(0, 500);
    if (['open', 'dismissed', 'actioned'].includes(b.status)) update.status = b.status;

    if (b.action === 'delete-bookmark') {
      if (f.bookmarkId) await adminDb.collection('users').doc(f.uid).collection('bookmarks').doc(f.bookmarkId).delete();
      update.status = 'actioned'; await log('admin.flag.delete-bookmark', f.url);
    } else if (b.action === 'warn-user') {
      const message = String(b.message || '').trim().slice(0, 300) || 'Your saved links violate the LinkVault content policy.';
      await adminDb.collection('users').doc(f.uid).set({ warnings: FieldValue.increment(1), lastWarning: { message, at: new Date().toISOString() } }, { merge: true });
      update.status = 'actioned'; await log('admin.user.warn', message);
    } else if (b.action === 'suspend-user') {
      const u = await adminAuth.getUser(f.uid); if (isAdminEmail(u.email)) return bad('The super admin cannot be suspended', 403);
      await adminAuth.updateUser(f.uid, { disabled: true }); await adminAuth.revokeRefreshTokens(f.uid);
      await adminDb.collection('users').doc(f.uid).set({ status: 'suspended' }, { merge: true }); update.status = 'actioned'; await log('admin.user.suspend', `Policy violation: ${f.url}`);
    } else if (update.status) await log(`admin.flag.${update.status}`, f.url);

    await ref.update(update); return NextResponse.json({ message: 'Flag updated' });
  } catch (e) { return apiError(e, 'Unable to update flag'); }
}

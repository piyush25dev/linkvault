import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { logActivity } from '@/lib/activity';
import { bad, cleanUrl } from '@/lib/admin-utils';
type Ctx = { params: Promise<{ uid: string; resource: string; rid: string }> };
export const runtime = 'nodejs';
const ok = (r: string) => r === 'bookmarks' || r === 'collections';

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid, resource, rid } = await ctx.params; if (!ok(resource)) return bad('Unknown resource', 404);
    const b = await request.json(); const { adminDb } = getAdminServices(); const ref = adminDb.collection('users').doc(uid).collection(resource).doc(rid);
    const snap = await ref.get(); if (!snap.exists) return bad('Item not found', 404);
    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (resource === 'bookmarks') {
      for (const k of ['title', 'description', 'collectionId', 'isFavorite', 'isDeleted']) if (k in b) patch[k] = k.startsWith('is') ? Boolean(b[k]) : String(b[k]);
      if ('url' in b) { const u = cleanUrl(b.url); if (!u) return bad('A valid http(s) URL is required'); patch.url = u.href; patch.domain = u.hostname; }
    } else {
      if ('name' in b) { const n = String(b.name).trim(); if (!n || n.length > 80) return bad('Invalid collection name'); patch.name = n; }
      if ('description' in b) patch.description = String(b.description).slice(0, 500);
    }
    await ref.update(patch);
    await logActivity({ uid, type: `admin.${resource === 'bookmarks' ? 'bookmark' : 'collection'}.update`, details: String(snap.data()?.title ?? snap.data()?.name ?? rid), actorUid: a.adminId!, actorEmail: a.adminEmail });
    return NextResponse.json({ message: 'Updated' });
  } catch (e) { return apiError(e, 'Unable to update item'); }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid, resource, rid } = await ctx.params; if (!ok(resource)) return bad('Unknown resource', 404);
    const { adminDb } = getAdminServices(); const userRef = adminDb.collection('users').doc(uid); const ref = userRef.collection(resource).doc(rid);
    const snap = await ref.get(); if (!snap.exists) return bad('Item not found', 404);
    if (resource === 'collections') {   // same rule as for users: bookmarks survive, moved to uncategorized
      const batch = adminDb.batch(); (await userRef.collection('bookmarks').where('collectionId', '==', rid).get()).docs.forEach(d => batch.update(d.ref, { collectionId: '', updatedAt: FieldValue.serverTimestamp() }));
      batch.delete(ref); await batch.commit();
    } else await ref.delete();
    await logActivity({ uid, type: `admin.${resource === 'bookmarks' ? 'bookmark' : 'collection'}.delete`, details: String(snap.data()?.title ?? snap.data()?.name ?? rid), actorUid: a.adminId!, actorEmail: a.adminEmail });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) { return apiError(e, 'Unable to delete item'); }
}

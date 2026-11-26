import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticate, apiError } from '@/lib/api-auth';
import { scanContent, recordFlag, getModerationSettings } from '@/lib/moderation';
import { logActivity } from '@/lib/activity';

type Context = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: Context) {
  const auth = await authenticate(request); if (auth.response) return auth.response;
  try {
    const { id } = await context.params; const { adminDb } = getAdminServices();
    const snap = await adminDb.collection('users').doc(auth.userId!).collection('bookmarks').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    return NextResponse.json({ bookmark: { id: snap.id, ...snap.data() } });
  } catch (e) { return apiError(e, 'Unable to fetch bookmark'); }
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await authenticate(request); if (auth.response) return auth.response;
  try {
    const { id } = await context.params; const body = await request.json();
    const allowed = ['title', 'url', 'description', 'favicon', 'image', 'collectionId', 'isFavorite', 'isDeleted'];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) patch[key] = body[key];
    if ('url' in patch) { const u = new URL(String(patch.url)); if (!['http:', 'https:'].includes(u.protocol)) throw new TypeError(); patch.url = u.href; patch.domain = u.hostname; }
    patch.updatedAt = FieldValue.serverTimestamp();
    const { adminDb } = getAdminServices(); const ref = adminDb.collection('users').doc(auth.userId!).collection('bookmarks').doc(id);
    const existing = await ref.get(); if (!existing.exists) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    const before = existing.data() as Record<string, any>; const next = { ...before, ...patch } as { url: string; title: string; description: string; domain: string };
    if ('url' in patch || 'title' in patch || 'description' in patch) {
      const scan = await scanContent({ url: next.url, title: next.title, description: next.description });
      if (scan.flagged && scan.severity === 'high' && (await getModerationSettings()).mode === 'block') {
      await recordFlag({ uid: auth.userId!, email: auth.email, bookmarkId: null, url: next.url, title: next.title, scan, blocked: true });
      await logActivity({ uid: auth.userId!, email: auth.email, type: 'bookmark.blocked', details: `${next.domain}: ${scan.reasons[0]}` });
      return NextResponse.json({ error: 'This website cannot be saved because it violates the LinkVault content policy.' }, { status: 403 });
    }
      if (scan.flagged) await recordFlag({ uid: auth.userId!, email: auth.email, bookmarkId: id, url: next.url, title: next.title, scan, blocked: false });
    }
    await ref.update(patch);
    await logActivity({ uid: auth.userId!, email: auth.email, type: patch.isDeleted === true ? 'bookmark.trash' : patch.isDeleted === false ? 'bookmark.restore' : 'bookmark.update', details: String(before.title ?? '').slice(0, 150) });
    return NextResponse.json({ message: 'Bookmark updated' });
  } catch (e) { if (e instanceof TypeError) return NextResponse.json({ error: 'Invalid URL or field value' }, { status: 400 }); return apiError(e, 'Unable to update bookmark'); }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await authenticate(request); if (auth.response) return auth.response;
  try {
    const { id } = await context.params; const { adminDb } = getAdminServices();
    const ref = adminDb.collection('users').doc(auth.userId!).collection('bookmarks').doc(id);
    const snap = await ref.get(); if (!snap.exists) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    await ref.delete();
    await logActivity({ uid: auth.userId!, email: auth.email, type: 'bookmark.delete', details: String(snap.data()?.title ?? '').slice(0, 150) });
    return NextResponse.json({ message: 'Bookmark permanently deleted' });
  } catch (e) { return apiError(e, 'Unable to delete bookmark'); }
}

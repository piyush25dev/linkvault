import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticate, apiError } from '@/lib/api-auth';

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
    if (!(await ref.get()).exists) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    await ref.update(patch); return NextResponse.json({ message: 'Bookmark updated' });
  } catch (e) { if (e instanceof TypeError) return NextResponse.json({ error: 'Invalid URL or field value' }, { status: 400 }); return apiError(e, 'Unable to update bookmark'); }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await authenticate(request); if (auth.response) return auth.response;
  try {
    const { id } = await context.params; const { adminDb } = getAdminServices();
    const ref = adminDb.collection('users').doc(auth.userId!).collection('bookmarks').doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    await ref.delete(); return NextResponse.json({ message: 'Bookmark permanently deleted' });
  } catch (e) { return apiError(e, 'Unable to delete bookmark'); }
}

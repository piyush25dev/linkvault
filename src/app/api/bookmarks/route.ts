import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticate, apiError } from '@/lib/api-auth';
import { scanContent, recordFlag, getModerationSettings } from '@/lib/moderation';
import { logActivity } from '@/lib/activity';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request); if (auth.response) return auth.response;
  try {
    const { adminDb } = getAdminServices();
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const snapshot = await adminDb.collection('users').doc(auth.userId!).collection('bookmarks').orderBy('createdAt', 'desc').limit(200).get();
    const bookmarks = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter((b: any) => includeDeleted || !b.isDeleted);
    return NextResponse.json({ bookmarks });
  } catch (e) { return apiError(e, 'Unable to fetch bookmarks'); }
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request); if (auth.response) return auth.response;
  try {
    const body = await request.json();
    const url = new URL(String(body.url || ''));
    if (!['http:', 'https:'].includes(url.protocol)) return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are allowed' }, { status: 400 });
    const scan = await scanContent({ url: url.href, title: String(body.title || ''), description: String(body.description || '') });
    if (scan.flagged && scan.severity === 'high' && (await getModerationSettings()).mode === 'block') {
      await recordFlag({ uid: auth.userId!, email: auth.email, bookmarkId: null, url: url.href, title: String(body.title || url.hostname), scan, blocked: true });
      await logActivity({ uid: auth.userId!, email: auth.email, type: 'bookmark.blocked', details: `${url.hostname}: ${scan.reasons[0]}` });
      return NextResponse.json({ error: 'This website cannot be saved because it violates the LinkVault content policy.' }, { status: 403 });
    }
    const { adminDb } = getAdminServices();
    const ref = await adminDb.collection('users').doc(auth.userId!).collection('bookmarks').add({
      title: String(body.title || url.hostname).slice(0, 200), url: url.href, domain: url.hostname,
      description: String(body.description || '').slice(0, 1000), favicon: String(body.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=64`),
      image: body.image ? String(body.image) : null, collectionId: body.collectionId ? String(body.collectionId) : '',
      isFavorite: Boolean(body.isFavorite), isDeleted: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    if (scan.flagged) await recordFlag({ uid: auth.userId!, email: auth.email, bookmarkId: ref.id, url: url.href, title: String(body.title || url.hostname), scan, blocked: false });
    await logActivity({ uid: auth.userId!, email: auth.email, type: 'bookmark.create', details: `${String(body.title || url.hostname).slice(0, 120)} (${url.hostname})` });
    return NextResponse.json({ id: ref.id, message: 'Bookmark created' }, { status: 201 });
  } catch (e) {
    if (e instanceof TypeError) return NextResponse.json({ error: 'A valid website URL is required' }, { status: 400 });
    return apiError(e, 'Unable to create bookmark');
  }
}

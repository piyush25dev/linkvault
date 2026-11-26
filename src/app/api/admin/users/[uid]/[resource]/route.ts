import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { logActivity } from '@/lib/activity';
import { bad, cleanUrl, plain } from '@/lib/admin-utils';
type Ctx = { params: Promise<{ uid: string; resource: string }> };
export const runtime = 'nodejs';
const ok = (r: string) => r === 'bookmarks' || r === 'collections';

// Admin CRUD on a user's bookmarks and collections: list (GET) and create (POST)
export async function GET(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid, resource } = await ctx.params; if (!ok(resource)) return bad('Unknown resource', 404);
    const { adminDb } = getAdminServices();
    const snap = await adminDb.collection('users').doc(uid).collection(resource).orderBy('createdAt', 'desc').limit(500).get();
    return NextResponse.json(plain({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
  } catch (e) { return apiError(e, 'Unable to load data'); }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { uid, resource } = await ctx.params; if (!ok(resource)) return bad('Unknown resource', 404);
    const b = await request.json(); const { adminDb } = getAdminServices(); const col = adminDb.collection('users').doc(uid).collection(resource); const now = FieldValue.serverTimestamp();
    let doc: Record<string, unknown>; let label: string;
    if (resource === 'bookmarks') {
      const u = cleanUrl(b.url); if (!u) return bad('A valid http(s) URL is required');
      label = String(b.title || u.hostname).slice(0, 200);
      doc = { title: label, url: u.href, domain: u.hostname, description: String(b.description || '').slice(0, 1000), favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`, image: null, collectionId: String(b.collectionId || ''), isFavorite: Boolean(b.isFavorite), isDeleted: false, createdAt: now, updatedAt: now };
    } else {
      label = String(b.name || '').trim(); if (!label || label.length > 80) return bad('Collection name is required (max 80 characters)');
      doc = { name: label, description: String(b.description || '').slice(0, 500), createdAt: now, updatedAt: now };
    }
    const ref = await col.add(doc);
    await logActivity({ uid, type: `admin.${resource === 'bookmarks' ? 'bookmark' : 'collection'}.create`, details: label, actorUid: a.adminId!, actorEmail: a.adminEmail });
    return NextResponse.json({ id: ref.id, message: 'Created' }, { status: 201 });
  } catch (e) { return apiError(e, 'Unable to create item'); }
}

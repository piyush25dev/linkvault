import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { plain } from '@/lib/admin-utils';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const sp = new URL(request.url).searchParams; const uid = sp.get('uid'); const type = sp.get('type') || ''; const limit = Math.min(500, Number(sp.get('limit') || 200));
    const { adminDb } = getAdminServices(); const col = adminDb.collection('activityLogs');
    // Filtering by uid sorts in memory so no composite Firestore index is needed.
    const snap = uid ? await col.where('uid', '==', uid).limit(500).get() : await col.orderBy('createdAt', 'desc').limit(limit).get();
    let items = plain<any[]>(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    if (type) items = items.filter(i => String(i.type).startsWith(type));
    items.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    return NextResponse.json({ items: items.slice(0, limit) });
  } catch (e) { return apiError(e, 'Unable to load activity'); }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { plain } from '@/lib/admin-utils';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const sp = new URL(request.url).searchParams; const status = sp.get('status') || 'all'; const severity = sp.get('severity') || 'all'; const uid = sp.get('uid');
    const { adminDb } = getAdminServices();
    const snap = await adminDb.collection('flags').orderBy('createdAt', 'desc').limit(500).get();
    let items = plain<any[]>(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    if (status !== 'all') items = items.filter(f => f.status === status);
    if (severity !== 'all') items = items.filter(f => f.severity === severity);
    if (uid) items = items.filter(f => f.uid === uid);
    return NextResponse.json({ items });
  } catch (e) { return apiError(e, 'Unable to load flags'); }
}

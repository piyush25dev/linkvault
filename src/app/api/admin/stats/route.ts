import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { plain } from '@/lib/admin-utils';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { adminAuth, adminDb } = getAdminServices();
    const users: { creation: number; disabled: boolean }[] = []; let token: string | undefined;
    do { const r = await adminAuth.listUsers(1000, token); users.push(...r.users.map(u => ({ creation: new Date(u.metadata.creationTime).getTime(), disabled: u.disabled }))); token = r.pageToken; } while (token && users.length < 20000);

    const day = 86_400_000, now = Date.now(); const since = new Date(now - day);
    const signups = Array.from({ length: 7 }, (_, i) => { const start = new Date(now - (6 - i) * day); start.setHours(0, 0, 0, 0); const t = start.getTime(); return { date: start.toISOString().slice(0, 10), count: users.filter(u => u.creation >= t && u.creation < t + day).length }; });
    const [bookmarks, collections, openFlags, activity24h, recentActivity, recentFlags] = await Promise.all([
      adminDb.collectionGroup('bookmarks').count().get(), adminDb.collectionGroup('collections').count().get(),
      adminDb.collection('flags').where('status', '==', 'open').count().get(), adminDb.collection('activityLogs').where('createdAt', '>=', since).count().get(),
      adminDb.collection('activityLogs').orderBy('createdAt', 'desc').limit(10).get(), adminDb.collection('flags').orderBy('createdAt', 'desc').limit(40).get(),
    ]);
    return NextResponse.json(plain({
      users: users.length, suspended: users.filter(u => u.disabled).length, newLast7Days: signups.reduce((s, d) => s + d.count, 0), signups,
      bookmarks: bookmarks.data().count, collections: collections.data().count, openFlags: openFlags.data().count, activity24h: activity24h.data().count,
      recentActivity: recentActivity.docs.map(d => ({ id: d.id, ...d.data() })),
      recentFlags: recentFlags.docs.map(d => ({ id: d.id, ...d.data() })).filter((f: any) => f.status === 'open').slice(0, 5),
    }));
  } catch (e) { return apiError(e, 'Unable to load statistics'); }
}

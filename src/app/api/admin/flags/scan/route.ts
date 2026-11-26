import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { getModerationSettings, recordFlag, scanContent } from '@/lib/moderation';
import { logActivity } from '@/lib/activity';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Re-scans existing (non-trashed) bookmarks of every user, for example after changing the rules.
export async function POST(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const { adminAuth, adminDb } = getAdminServices(); const settings = await getModerationSettings(true);
    const snap = await adminDb.collectionGroup('bookmarks').limit(3000).get();
    const hits: { uid: string; id: string; url: string; title: string; scan: Awaited<ReturnType<typeof scanContent>> }[] = [];
    for (const d of snap.docs) {
      const x = d.data(); const uid = d.ref.parent.parent?.id; if (!uid || x.isDeleted || !x.url) continue;
      const scan = await scanContent({ url: x.url, title: x.title, description: x.description }, { settings, remote: false });   // local rules only: keeps a bulk scan fast
      if (scan.flagged) hits.push({ uid, id: d.id, url: x.url, title: x.title ?? '', scan });
    }
    const emails = new Map<string, string | null>(); const uids = [...new Set(hits.map(h => h.uid))];
    for (let i = 0; i < uids.length; i += 100) (await adminAuth.getUsers(uids.slice(i, i + 100).map(uid => ({ uid })))).users.forEach(u => emails.set(u.uid, u.email ?? null));
    for (const h of hits) await recordFlag({ uid: h.uid, email: emails.get(h.uid) ?? null, bookmarkId: h.id, url: h.url, title: h.title, scan: h.scan, blocked: false });
    await logActivity({ uid: a.adminId!, email: a.adminEmail, type: 'admin.scan', details: `Scanned ${snap.size} bookmarks, ${hits.length} matched` });
    return NextResponse.json({ scanned: snap.size, flagged: hits.length });
  } catch (e) { return apiError(e, 'Unable to scan bookmarks'); }
}

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';

export type ActivityInput = { uid: string; email?: string | null; type: string; details?: string; actorUid?: string; actorEmail?: string | null };

/** Writes one audit/activity entry. Never throws: logging must not break the user's request. */
export async function logActivity(a: ActivityInput) {
  try {
    const { adminDb } = getAdminServices();
    await adminDb.collection('activityLogs').add({
      uid: a.uid, email: a.email ?? null, type: a.type, details: (a.details ?? '').slice(0, 300),
      actorUid: a.actorUid ?? a.uid, actorEmail: a.actorEmail ?? a.email ?? null, createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) { console.error('Activity log failed', e); }
}

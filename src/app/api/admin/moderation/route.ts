import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, apiError } from '@/lib/api-auth';
import { getModerationSettings, saveModerationSettings, type ModerationSettings } from '@/lib/moderation';
import { logActivity } from '@/lib/activity';
import { bad } from '@/lib/admin-utils';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  return NextResponse.json({ settings: await getModerationSettings(true), safeBrowsing: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY });
}

const list = (v: unknown, domain: boolean) => [...new Set((Array.isArray(v) ? v : []).map(x => { let s = String(x).trim().toLowerCase(); if (domain) s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''); return s; }).filter(Boolean))].slice(0, 500);

export async function PUT(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  try {
    const b = await request.json(); if (!['flag', 'block'].includes(b.mode)) return bad('Mode must be "flag" or "block"');
    const s: ModerationSettings = { mode: b.mode, blockedDomains: list(b.blockedDomains, true), blockedKeywords: list(b.blockedKeywords, false), allowedDomains: list(b.allowedDomains, true) };
    await saveModerationSettings(s);
    await logActivity({ uid: a.adminId!, email: a.adminEmail, type: 'admin.moderation.update', details: `mode=${s.mode}, ${s.blockedDomains.length} blocked domains, ${s.blockedKeywords.length} keywords, ${s.allowedDomains.length} allowed` });
    return NextResponse.json({ settings: s, message: 'Moderation rules saved' });
  } catch (e) { return apiError(e, 'Unable to save rules'); }
}

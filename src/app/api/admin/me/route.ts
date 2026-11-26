import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/api-auth';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const a = await authenticateAdmin(request); if (a.response) return a.response;
  return NextResponse.json({ ok: true, email: a.adminEmail });
}

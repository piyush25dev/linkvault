import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/admin-config';

export async function authenticate(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return { userId: null, email: null, isSuperAdmin: false, response: NextResponse.json({ error: 'Missing bearer token' }, { status: 401 }) };
  }
  try {
    const token = header.slice(7);
    const { adminAuth } = getAdminServices();
    // checkRevoked = true: suspended (disabled) users and revoked sessions are rejected immediately, not after the token expires
    const decoded = await adminAuth.verifyIdToken(token, true);
    // Super admin needs BOTH the fixed email and the server-set custom claim (see scripts/seed-super-admin.mjs).
    // Anyone who merely registers with that email gets no admin rights.
    const isSuperAdmin = isAdminEmail(decoded.email) && decoded.superAdmin === true;
    return { userId: decoded.uid, email: decoded.email ?? null, isSuperAdmin, response: null };
  } catch {
    return { userId: null, email: null, isSuperAdmin: false, response: NextResponse.json({ error: 'Invalid, expired or revoked authentication token' }, { status: 401 }) };
  }
}

/** Use at the top of every /api/admin route. */
export async function authenticateAdmin(request: NextRequest) {
  const a = await authenticate(request);
  if (a.response) return { adminId: null, adminEmail: null, response: a.response };
  if (!a.isSuperAdmin) return { adminId: null, adminEmail: null, response: NextResponse.json({ error: 'Super admin access required' }, { status: 403 }) };
  return { adminId: a.userId!, adminEmail: a.email, response: null };
}

export function apiError(error: unknown, message = 'Internal server error') {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminServices } from '@/lib/firebase-admin';

export async function authenticate(request: NextRequest) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return { userId: null, response: NextResponse.json({ error: 'Missing bearer token' }, { status: 401 }) };
  }
  try {
    const token = header.slice(7);
    const { adminAuth } = getAdminServices();
    const decoded = await adminAuth.verifyIdToken(token);
    return { userId: decoded.uid, response: null };
  } catch {
    return { userId: null, response: NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 401 }) };
  }
}

export function apiError(error: unknown, message = 'Internal server error') {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

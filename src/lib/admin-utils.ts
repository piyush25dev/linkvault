import { NextResponse } from 'next/server';

/** Firestore Timestamps become ISO strings so the admin UI can format them. */
export function plain<T = any>(value: unknown): T {
  return JSON.parse(JSON.stringify(value, function (this: any, key, val) {
    const raw = this[key];
    return raw && typeof raw.toDate === 'function' ? raw.toDate().toISOString() : val;
  }));
}
export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
export function cleanUrl(input: unknown): URL | null {
  try { const u = new URL(String(input || '')); return ['http:', 'https:'].includes(u.protocol) ? u : null; } catch { return null; }
}

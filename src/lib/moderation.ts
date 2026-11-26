import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '@/lib/firebase-admin';

/*
 * Content moderation for saved links. Layers:
 *  1. Domain / TLD blocklists (adult, piracy, dark web, betting)
 *  2. Keyword rules on the URL, title and description
 *  3. Admin-managed custom rules and allowlist (Firestore: settings/moderation)
 *  4. Google Safe Browsing (malware / phishing) when GOOGLE_SAFE_BROWSING_API_KEY is set
 *
 * Heuristics produce false positives and misses, so every hit goes to a human review queue.
 * IMPORTANT: do not rely on keyword lists for child-sexual-abuse material. Use a specialist service
 * (for example IWF URL list, NCMEC, or Cloudflare CSAM scanning) and report to the authorities.
 */
export type Category = 'adult' | 'piracy' | 'darknet' | 'drugs' | 'gambling' | 'scam' | 'malware' | 'custom';
export type Severity = 'low' | 'medium' | 'high';
export type ScanResult = { flagged: boolean; severity: Severity | null; categories: Category[]; reasons: string[] };
export type ModerationSettings = { mode: 'flag' | 'block'; blockedDomains: string[]; blockedKeywords: string[]; allowedDomains: string[] };

const DOMAIN_LISTS: Record<'adult' | 'piracy' | 'gambling' | 'darknet', { severity: Severity; list: string[] }> = {
  adult: { severity: 'high', list: ['pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com', 'spankbang.com', 'eporner.com', 'tube8.com', 'porn.com', 'brazzers.com', 'chaturbate.com', 'stripchat.com', 'bongacams.com', 'cam4.com', 'livejasmin.com', 'rule34.xxx', 'e-hentai.org', 'nhentai.net', 'motherless.com', 'thumbzilla.com', 'onlyfans.com', 'fansly.com', 'hentaihaven.xxx'] },
  piracy: { severity: 'medium', list: ['thepiratebay.org', '1337x.to', 'rarbg.to', 'yts.mx', 'nyaa.si', 'limetorrents.info', 'torrentgalaxy.to', 'kickasstorrents.to', 'fmovies.to', '123movies.com', 'putlocker.vip', 'soap2day.to', 'tamilrockers.ws', 'filmyzilla.com', 'moviesflix.com', 'khatrimaza.org'] },
  gambling: { severity: 'low', list: ['bet365.com', 'stake.com', '1xbet.com', '22bet.com', 'parimatch.com', 'betway.com', 'dafabet.com', 'fun88.com', 'mostbet.com', 'betwinner.com'] },
  darknet: { severity: 'high', list: ['onion.ws', 'onion.to', 'onion.pet', 'onion.ly'] },
};
const ADULT_TLDS = ['xxx', 'porn', 'adult', 'sex'];

type Rule = { re: RegExp; category: Category; severity: Severity; label: string };
const KEYWORD_RULES: Rule[] = [
  { re: /\b(porn|porno|pornhub|xxx|hentai|nsfw|nudes?|erotic|cam\s?girls?|escorts?|sex\s?(videos?|cams?|chat)|adult\s(videos?|content|cams?)|onlyfans\s?leaks?)\b/i, category: 'adult', severity: 'medium', label: 'adult keywords' },
  { re: /\b(buy|order)\s+(cocaine|heroin|meth(amphetamine)?|mdma|lsd|fentanyl|ketamine)\b/i, category: 'drugs', severity: 'high', label: 'illegal drug sales' },
  { re: /\b(dark\s?web|darknet)\s+(markets?|shops?|vendors?)\b/i, category: 'darknet', severity: 'high', label: 'dark web marketplace' },
  { re: /\b(carding|cvv\s?(shop|dumps?)|fullz|fake\s(passports?|ids?|driver'?s?\slicen[sc]es?)|counterfeit\s(money|currency|notes)|stolen\scredit\scards?|hire\sa\shacker|hackers?\sfor\shire)\b/i, category: 'scam', severity: 'high', label: 'fraud / illegal services' },
  { re: /\b(torrents?|cracked\ssoftware|keygen|warez|pirated|free\smovie\sdownload)\b/i, category: 'piracy', severity: 'medium', label: 'piracy keywords' },
  { re: /\b(online\s(casino|betting)|sports\sbetting|satta\s?matka)\b/i, category: 'gambling', severity: 'low', label: 'betting / gambling keywords' },
];

const RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 };
export const DEFAULT_SETTINGS: ModerationSettings = { mode: 'flag', blockedDomains: [], blockedKeywords: [], allowedDomains: [] };
const clean: ScanResult = { flagged: false, severity: null, categories: [], reasons: [] };
const onDomain = (host: string, d: string) => host === d || host.endsWith('.' + d);

let cache: { at: number; value: ModerationSettings } | null = null;
export async function getModerationSettings(force = false): Promise<ModerationSettings> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.value;
  try {
    const { adminDb } = getAdminServices();
    const snap = await adminDb.collection('settings').doc('moderation').get();
    const d = (snap.data() ?? {}) as Partial<ModerationSettings>;
    const value: ModerationSettings = { mode: d.mode === 'block' ? 'block' : 'flag', blockedDomains: d.blockedDomains ?? [], blockedKeywords: d.blockedKeywords ?? [], allowedDomains: d.allowedDomains ?? [] };
    cache = { at: Date.now(), value }; return value;
  } catch { return DEFAULT_SETTINGS; }
}
export async function saveModerationSettings(s: ModerationSettings) {
  const { adminDb } = getAdminServices();
  await adminDb.collection('settings').doc('moderation').set({ ...s, updatedAt: FieldValue.serverTimestamp() });
  cache = null;
}

async function safeBrowsing(url: string): Promise<{ category: Category; reason: string }[]> {
  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY; if (!key) return [];
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000),
      body: JSON.stringify({ client: { clientId: 'linkvault', clientVersion: '1.0' }, threatInfo: { threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'], platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'], threatEntries: [{ url }] } }),
    });
    const data = await res.json();
    return (data.matches ?? []).map((m: { threatType: string }) => ({ category: m.threatType === 'SOCIAL_ENGINEERING' ? 'scam' as const : 'malware' as const, reason: `Google Safe Browsing: ${m.threatType.toLowerCase().replace(/_/g, ' ')}` }));
  } catch { return []; }   // fail open: a Google outage must not block saving
}

export async function scanContent(input: { url: string; title?: string; description?: string }, opts: { settings?: ModerationSettings; remote?: boolean } = {}): Promise<ScanResult> {
  let u: URL; try { u = new URL(input.url); } catch { return clean; }
  const s = opts.settings ?? (await getModerationSettings());
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (s.allowedDomains.some(d => onDomain(host, d))) return clean;

  const hits: { category: Category; severity: Severity; reason: string }[] = [];
  const add = (category: Category, severity: Severity, reason: string) => hits.push({ category, severity, reason });

  const tld = host.split('.').pop() ?? '';
  if (ADULT_TLDS.includes(tld)) add('adult', 'high', `Adult top-level domain (.${tld})`);
  if (tld === 'onion') add('darknet', 'high', 'Dark web (.onion) address');
  for (const [cat, { severity, list }] of Object.entries(DOMAIN_LISTS)) {
    const d = list.find(x => onDomain(host, x)); if (d) add(cat as Category, severity, `Known ${cat} site: ${d}`);
  }
  const custom = s.blockedDomains.find(d => onDomain(host, d)); if (custom) add('custom', 'high', `Admin-blocked domain: ${custom}`);

  let path = u.pathname; try { path = decodeURIComponent(path); } catch { /* keep raw */ }
  const urlText = `${host} ${path}`.replace(/[-_./+]+/g, ' ');
  const pageText = `${input.title ?? ''} ${input.description ?? ''}`;
  for (const r of KEYWORD_RULES) {
    if (r.re.test(urlText)) add(r.category, r.category === 'adult' ? 'high' : r.severity, `URL contains ${r.label}`);
    else if (r.re.test(pageText)) add(r.category, r.severity, `Title/description contains ${r.label}`);
  }
  const text = `${urlText} ${pageText}`.toLowerCase();
  const kw = s.blockedKeywords.find(k => k && text.includes(k)); if (kw) add('custom', 'medium', `Admin-blocked keyword: ${kw}`);
  if (opts.remote !== false) for (const m of await safeBrowsing(u.href)) add(m.category, 'high', m.reason);

  if (!hits.length) return clean;
  const severity = hits.reduce<Severity>((max, h) => (RANK[h.severity] > RANK[max] ? h.severity : max), 'low');
  return { flagged: true, severity, categories: [...new Set(hits.map(h => h.category))], reasons: [...new Set(hits.map(h => h.reason))].slice(0, 6) };
}

/** Creates (or refreshes) a review-queue entry. A reviewed flag is not reopened unless the URL changed. */
export async function recordFlag(a: { uid: string; email: string | null; bookmarkId: string | null; url: string; title: string; scan: ScanResult; blocked: boolean }) {
  try {
    const { adminDb } = getAdminServices();
    const ref = adminDb.collection('flags').doc(a.bookmarkId ? `${a.uid}_${a.bookmarkId}` : `${a.uid}_blocked_${Date.now()}`);
    const snap = await ref.get(); const old = snap.data();
    if (snap.exists && old?.url === a.url && old?.status !== 'open') return;
    await ref.set({
      uid: a.uid, email: a.email, bookmarkId: a.bookmarkId, url: a.url, title: a.title.slice(0, 200), domain: new URL(a.url).hostname,
      categories: a.scan.categories, severity: a.scan.severity, reasons: a.scan.reasons, blocked: a.blocked, status: 'open', note: '',
      reviewedBy: null, reviewedAt: null, createdAt: old?.createdAt ?? FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) { console.error('Flag record failed', e); }
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { ContentCopyRounded, RadarRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { ConfirmDialog, FormDialog, SeverityChip, ago, errMsg } from '@/components/admin/ui';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';

type Flag = { id: string; uid: string; email: string; bookmarkId: string | null; url: string; title: string; domain: string; categories: string[]; severity: string; reasons: string[]; blocked: boolean; status: string; note: string; createdAt: string; reviewedBy: string | null };
type Settings = { mode: 'flag' | 'block'; blockedDomains: string[]; blockedKeywords: string[]; allowedDomains: string[] };
const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);

export default function ModerationPage() {
  const [tab, setTab] = useState(0); const [status, setStatus] = useState('open'); const [severity, setSeverity] = useState('all'); const [items, setItems] = useState<Flag[] | null>(null);
  const [scanning, setScanning] = useState(false); const [warn, setWarn] = useState<Flag | null>(null); const [suspend, setSuspend] = useState<Flag | null>(null); const [del, setDel] = useState<Flag | null>(null);
  const load = useCallback(() => { setItems(null); apiFetch<{ items: Flag[] }>(`/api/admin/flags?status=${status}&severity=${severity}`).then(r => setItems(r.items)).catch(e => toast.error(errMsg(e))); }, [status, severity]);
  useEffect(() => { load(); }, [load]);
  const act = async (id: string, body: object, ok: string) => { try { await apiFetch(`/api/admin/flags/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); toast.success(ok); load(); } catch (e) { toast.error(errMsg(e)); } };
  async function scanAll() {
    setScanning(true);
    try { const r = await apiFetch<{ scanned: number; flagged: number }>('/api/admin/flags/scan', { method: 'POST', body: '{}' }); toast.success(`Scanned ${r.scanned} bookmarks, ${r.flagged} matched the rules`); load(); }
    catch (e) { toast.error(errMsg(e)); } finally { setScanning(false); }
  }

  // ---- rules tab
  const [rules, setRules] = useState<{ mode: string; domains: string; keywords: string; allowed: string; sb: boolean } | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { if (tab === 1 && !rules) apiFetch<{ settings: Settings; safeBrowsing: boolean }>('/api/admin/moderation').then(r => setRules({ mode: r.settings.mode, domains: r.settings.blockedDomains.join('\n'), keywords: r.settings.blockedKeywords.join('\n'), allowed: r.settings.allowedDomains.join('\n'), sb: r.safeBrowsing })).catch(e => toast.error(errMsg(e))); }, [tab, rules]);
  async function saveRules() {
    if (!rules) return; setSaving(true);
    try { await apiFetch('/api/admin/moderation', { method: 'PUT', body: JSON.stringify({ mode: rules.mode, blockedDomains: lines(rules.domains), blockedKeywords: lines(rules.keywords), allowedDomains: lines(rules.allowed) }) }); toast.success('Rules saved'); }
    catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <AdminShell title="Moderation" subtitle="Adult, illegal and unsafe links saved by users"
      action={<Button variant="outlined" startIcon={<RadarRounded />} onClick={scanAll} disabled={scanning}>{scanning ? 'Scanning…' : 'Scan all bookmarks'}</Button>}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}><Tab label="Review queue" /><Tab label="Rules" /></Tabs>

      {tab === 0 && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} mb={3}>
            <TextField select size="small" label="Status" value={status} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 160 }}><MenuItem value="open">Open</MenuItem><MenuItem value="dismissed">Dismissed</MenuItem><MenuItem value="actioned">Actioned</MenuItem><MenuItem value="all">All</MenuItem></TextField>
            <TextField select size="small" label="Severity" value={severity} onChange={e => setSeverity(e.target.value)} sx={{ minWidth: 160 }}><MenuItem value="all">All</MenuItem><MenuItem value="high">High</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="low">Low</MenuItem></TextField>
          </Stack>
          {!items ? <Loader height={260} label="Loading flags…" /> : items.length === 0 ? <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, borderStyle: 'dashed' }}><Typography fontWeight={800}>Nothing to review</Typography><Typography color="text.secondary">No {status === 'all' ? '' : status} flags match these filters.</Typography></Paper> : (
            <Box display="grid" gap={2}>
              {items.map(f => (
                <Paper key={f.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 4, overflowWrap: 'anywhere' }}>
                  <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" mb={1}>
                    <SeverityChip s={f.severity} />{(f.categories ?? []).map(c => <Chip key={c} size="small" label={c} variant="outlined" />)}{f.blocked && <Chip size="small" color="error" label="Blocked at save" />}
                    {f.status !== 'open' && <Chip size="small" color={f.status === 'actioned' ? 'success' : 'default'} label={f.status} />}
                    <Box flex={1} /><Typography variant="caption" color="text.secondary">{ago(f.createdAt)}</Typography>
                  </Stack>
                  <Typography fontWeight={700}>{f.title || f.domain}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{f.url}</Typography>
                    <Button size="small" aria-label="Copy URL" onClick={() => { void navigator.clipboard.writeText(f.url); toast.success('URL copied'); }} sx={{ minWidth: 0 }}><ContentCopyRounded fontSize="small" /></Button>
                  </Stack>
                  <Typography variant="body2" mt={1}>Saved by <Link href={`/admin/users/${f.uid}`} style={{ color: 'inherit', fontWeight: 700 }}>{f.email}</Link></Typography>
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, color: 'text.secondary', fontSize: 14 }}>{(f.reasons ?? []).map(r => <li key={r}>{r}</li>)}</Box>
                  <Stack direction="row" flexWrap="wrap" gap={1} mt={2}>
                    {f.status === 'open' ? (<>
                      <Button size="small" variant="outlined" onClick={() => act(f.id, { status: 'dismissed' }, 'Dismissed as a false positive')}>Dismiss</Button>
                      {f.bookmarkId && <Button size="small" variant="outlined" color="warning" onClick={() => setDel(f)}>Delete bookmark</Button>}
                      <Button size="small" variant="outlined" color="warning" onClick={() => setWarn(f)}>Warn user</Button>
                      <Button size="small" variant="contained" color="error" onClick={() => setSuspend(f)}>Suspend user</Button>
                    </>) : <Button size="small" variant="outlined" onClick={() => act(f.id, { status: 'open' }, 'Flag reopened')}>Reopen</Button>}
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}

      {tab === 1 && (!rules ? <Loader height={260} /> : (
        <Box display="grid" gap={3} maxWidth={760}>
          <Alert severity="info">Detection uses built-in lists of adult, piracy, dark-web and betting sites plus keyword rules, and results always go to this queue for human review. They can miss things and can flag harmless pages.
            {rules.sb ? ' Google Safe Browsing (malware and phishing) is ON.' : ' Add GOOGLE_SAFE_BROWSING_API_KEY to also detect malware and phishing.'} For child-safety material, use a specialist service such as the IWF URL list or NCMEC, and report to the authorities.</Alert>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
            <Typography fontWeight={800} mb={1.5}>When a high-severity link is found</Typography>
            <TextField select fullWidth value={rules.mode} onChange={e => setRules({ ...rules, mode: e.target.value })}>
              <MenuItem value="flag">Save it, and flag it for review (lets you see what the user did)</MenuItem>
              <MenuItem value="block">Block the save, and flag it for review</MenuItem>
            </TextField>
          </Paper>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, display: 'grid', gap: 2 }}>
            <TextField multiline minRows={4} label="Always flag these domains (one per line)" placeholder="example.com" value={rules.domains} onChange={e => setRules({ ...rules, domains: e.target.value })} />
            <TextField multiline minRows={4} label="Always flag these keywords (one per line)" value={rules.keywords} onChange={e => setRules({ ...rules, keywords: e.target.value })} />
            <TextField multiline minRows={4} label="Allowed domains: never flag (one per line)" helperText="Use this for false positives, for example a news or health site." value={rules.allowed} onChange={e => setRules({ ...rules, allowed: e.target.value })} />
            <Button variant="contained" onClick={saveRules} disabled={saving} sx={{ justifySelf: 'start' }}>{saving ? 'Saving…' : 'Save rules'}</Button>
          </Paper>
        </Box>
      ))}

      <FormDialog open={!!warn} onClose={() => setWarn(null)} title="Warn user" intro={`${warn?.email} will see this message the next time they sign in.`} submitLabel="Send warning"
        initial={{ message: 'One of your saved links violates the LinkVault content policy. Further violations may lead to suspension.' }} fields={[{ key: 'message', label: 'Warning message', multiline: true, required: true }]}
        onSubmit={async v => { await apiFetch(`/api/admin/flags/${warn!.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'warn-user', message: v.message }) }); toast.success('Warning sent'); load(); }} />
      <ConfirmDialog open={!!suspend} onClose={() => setSuspend(null)} danger title="Suspend this user?" confirmLabel="Suspend" text={<>{suspend?.email} will be signed out and unable to sign in until you reactivate them.</>}
        onConfirm={async () => { await apiFetch(`/api/admin/flags/${suspend!.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'suspend-user' }) }); toast.success('User suspended'); load(); }} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger title="Delete this bookmark?" confirmLabel="Delete" text="The bookmark is removed from the user's account. The flag stays here as a record."
        onConfirm={async () => { await apiFetch(`/api/admin/flags/${del!.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'delete-bookmark' }) }); toast.success('Bookmark deleted'); load(); }} />
    </AdminShell>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, Box, Button, Chip, IconButton, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { ArrowBackRounded, AddRounded, DeleteOutlineRounded, EditRounded, LockResetRounded, BlockRounded, CheckCircleRounded, WarningAmberRounded, PersonRemoveRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { ConfirmDialog, FormDialog, Scroll, SeverityChip, StatCard, StatusChip, TypeChip, errMsg, fmt, fmtDay } from '@/components/admin/ui';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';

type U = { uid: string; email: string; displayName: string; photoURL: string | null; disabled: boolean; providers: string[]; createdAt: string; lastSignIn: string | null; isSuperAdmin: boolean; warnings: number; lastWarning: { message: string } | null; loginCount: number };
type Stats = { bookmarks: number; trashed: number; collections: number; openFlags: number };
type B = { id: string; title: string; url: string; domain: string; description: string; collectionId: string; isFavorite: boolean; isDeleted: boolean; createdAt: string };
type C = { id: string; name: string; description?: string };

export default function UserDetail() {
  const { uid } = useParams<{ uid: string }>(); const router = useRouter(); const base = `/api/admin/users/${uid}`;
  const [d, setD] = useState<{ user: U; stats: Stats } | null>(null); const [bms, setBms] = useState<B[]>([]); const [cols, setCols] = useState<C[]>([]); const [acts, setActs] = useState<any[]>([]); const [flags, setFlags] = useState<any[]>([]);
  const [tab, setTab] = useState(0); const [dlg, setDlg] = useState<string | null>(null); const [edit, setEdit] = useState<B | C | null>(null); const [confirm, setConfirm] = useState<{ kind: string; id?: string } | null>(null); const [typed, setTyped] = useState('');
  const load = useCallback(async () => {
    try {
      const [u, b, c, a, f] = await Promise.all([apiFetch<{ user: U; stats: Stats }>(base), apiFetch<{ items: B[] }>(`${base}/bookmarks`), apiFetch<{ items: C[] }>(`${base}/collections`), apiFetch<{ items: any[] }>(`/api/admin/activity?uid=${uid}&limit=100`), apiFetch<{ items: any[] }>(`/api/admin/flags?uid=${uid}`)]);
      setD(u); setBms(b.items); setCols(c.items); setActs(a.items); setFlags(f.items);
    } catch (e) { toast.error(errMsg(e)); router.replace('/admin/users'); }
  }, [base, uid, router]);
  useEffect(() => { void load(); }, [load]);
  const flagFor = useMemo(() => new Map(flags.filter(f => f.bookmarkId && f.status === 'open').map(f => [f.bookmarkId, f])), [flags]);
  const call = async (path: string, method: string, body?: object, ok = 'Saved') => { await apiFetch(path, { method, body: body ? JSON.stringify(body) : undefined }); toast.success(ok); await load(); };
  if (!d) return <AdminShell title="User"><Loader label="Loading user…" /></AdminShell>;
  const u = d.user; const colName = (id: string) => cols.find(c => c.id === id)?.name ?? 'Uncategorized'; const close = () => { setDlg(null); setEdit(null); };

  return (
    <AdminShell title={u.displayName || u.email} subtitle={u.email} action={<Button component={Link} href="/admin/users" startIcon={<ArrowBackRounded />}>All users</Button>}>
      <Box display="grid" gap={3}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, overflowWrap: 'anywhere' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={3} justifyContent="space-between">
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" minWidth={0}>
              <Avatar src={u.photoURL ?? undefined} sx={{ width: 64, height: 64, fontSize: 26 }}>{(u.displayName || u.email)[0]?.toUpperCase()}</Avatar>
              <Box minWidth={0}>
                <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center"><Typography variant="h6" fontWeight={800}>{u.displayName || 'No name'}</Typography><StatusChip disabled={u.disabled} />{u.isSuperAdmin && <Chip size="small" color="error" label="Super admin" />}</Stack>
                <Typography color="text.secondary">{u.email}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">Joined {fmtDay(u.createdAt)} · last sign-in {fmt(u.lastSignIn)} · {u.loginCount} logins · {u.providers.join(', ') || 'no provider'}</Typography>
                {u.warnings > 0 && <Typography variant="caption" color="warning.main" display="block">{u.warnings} warning(s). Last: {u.lastWarning?.message}</Typography>}
              </Box>
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap" alignContent="flex-start">
              <Button size="small" variant="outlined" startIcon={<EditRounded />} onClick={() => setDlg('profile')}>Edit</Button>
              <Button size="small" variant="outlined" startIcon={<LockResetRounded />} onClick={() => setDlg('password')}>Set password</Button>
              {!u.isSuperAdmin && <>
                <Button size="small" variant="outlined" color="warning" startIcon={<WarningAmberRounded />} onClick={() => setDlg('warn')}>Warn</Button>
                {u.disabled ? <Button size="small" variant="contained" color="success" startIcon={<CheckCircleRounded />} onClick={() => call(base, 'PATCH', { disabled: false }, 'User reactivated')}>Reactivate</Button>
                  : <Button size="small" variant="outlined" color="error" startIcon={<BlockRounded />} onClick={() => setConfirm({ kind: 'suspend' })}>Suspend</Button>}
                <Button size="small" variant="contained" color="error" startIcon={<PersonRemoveRounded />} onClick={() => { setTyped(''); setConfirm({ kind: 'delete-user' }); }}>Delete</Button>
              </>}
            </Stack>
          </Stack>
        </Paper>

        <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }}>
          <StatCard label="Bookmarks" value={d.stats.bookmarks} icon={<EditRounded />} color="#0E7C7B" /><StatCard label="In trash" value={d.stats.trashed} icon={<DeleteOutlineRounded />} color="#8FA9A8" />
          <StatCard label="Collections" value={d.stats.collections} icon={<EditRounded />} color="#F2994A" /><StatCard label="Open flags" value={d.stats.openFlags} icon={<WarningAmberRounded />} color={d.stats.openFlags ? '#E5484D' : '#2BB3A8'} />
        </Box>

        <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}><Tab label={`Bookmarks (${bms.length})`} /><Tab label={`Collections (${cols.length})`} /><Tab label={`Activity (${acts.length})`} /><Tab label={`Flags (${flags.length})`} /></Tabs>
          {tab === 0 && <Box p={2}>
            <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => setDlg('bookmark')} sx={{ mb: 1.5 }}>Add bookmark</Button>
            <Scroll min={760}><Table size="small"><TableHead><TableRow>{['Bookmark', 'Collection', 'Status', 'Saved', ''].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead><TableBody>
              {bms.map(b => { const fl = flagFor.get(b.id); return (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ maxWidth: 300 }}><Typography variant="body2" fontWeight={700} noWrap>{b.title}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block">{b.url}</Typography></TableCell>
                  <TableCell>{colName(b.collectionId)}</TableCell>
                  <TableCell><Stack direction="row" gap={0.5} flexWrap="wrap">{fl && <><WarningAmberRounded color="error" fontSize="small" /><SeverityChip s={fl.severity} /></>}{b.isDeleted && <Chip size="small" label="Trash" />}{b.isFavorite && <Chip size="small" color="warning" variant="outlined" label="Favorite" />}</Stack></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDay(b.createdAt)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}><Tooltip title="Edit"><IconButton size="small" onClick={() => { setEdit(b); setDlg('bookmark'); }}><EditRounded fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirm({ kind: 'bookmark', id: b.id })}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip></TableCell>
                </TableRow>); })}
              {!bms.length && <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>No bookmarks.</TableCell></TableRow>}
            </TableBody></Table></Scroll>
          </Box>}
          {tab === 1 && <Box p={2}>
            <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={() => setDlg('collection')} sx={{ mb: 1.5 }}>Add collection</Button>
            {cols.map(c => <Stack key={c.id} direction="row" alignItems="center" spacing={1} py={1.25} sx={{ borderTop: 1, borderColor: 'divider' }}>
              <Box flex={1} minWidth={0}><Typography fontWeight={700}>{c.name}</Typography><Typography variant="caption" color="text.secondary">{c.description || 'No description'} · {bms.filter(b => b.collectionId === c.id && !b.isDeleted).length} bookmarks</Typography></Box>
              <IconButton size="small" onClick={() => { setEdit(c); setDlg('collection'); }}><EditRounded fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => setConfirm({ kind: 'collection', id: c.id })}><DeleteOutlineRounded fontSize="small" /></IconButton>
            </Stack>)}
            {!cols.length && <Typography color="text.secondary" py={3} textAlign="center">No collections.</Typography>}
          </Box>}
          {tab === 2 && <Scroll min={680}><Table size="small"><TableBody>
            {acts.map(a => <TableRow key={a.id}><TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(a.createdAt)}</TableCell><TableCell><TypeChip type={a.type} /></TableCell><TableCell sx={{ wordBreak: 'break-word' }}>{a.details || '–'}</TableCell></TableRow>)}
            {!acts.length && <TableRow><TableCell sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>No activity recorded.</TableCell></TableRow>}
          </TableBody></Table></Scroll>}
          {tab === 3 && <Box p={2}>{flags.map(f => <Stack key={f.id} direction="row" gap={1.5} alignItems="center" flexWrap="wrap" py={1.25} sx={{ borderTop: 1, borderColor: 'divider' }}><SeverityChip s={f.severity} /><Chip size="small" label={f.status} /><Typography variant="body2" sx={{ wordBreak: 'break-all' }} flex={1}>{f.url}</Typography><Typography variant="caption" color="text.secondary">{(f.categories ?? []).join(', ')}</Typography></Stack>)}
            {!flags.length && <Typography color="text.secondary" py={3} textAlign="center">No policy flags for this user.</Typography>}<Button component={Link} href="/admin/moderation" size="small">Open moderation queue</Button></Box>}
        </Paper>
      </Box>

      <FormDialog open={dlg === 'profile'} onClose={close} title="Edit profile" initial={{ displayName: u.displayName, email: u.email }}
        fields={[{ key: 'displayName', label: 'Name' }, { key: 'email', label: 'Email', type: 'email', disabled: u.isSuperAdmin, helper: u.isSuperAdmin ? 'The super admin email is fixed and cannot be changed.' : undefined }]}
        onSubmit={async v => { const body: Record<string, string> = { displayName: v.displayName }; if (!u.isSuperAdmin && v.email !== u.email) body.email = v.email; await call(base, 'PATCH', body, 'Profile updated'); }} />
      <FormDialog open={dlg === 'password'} onClose={close} title="Set a new password" intro="Signs the user out everywhere. Share the new password securely." submitLabel="Set password" fields={[{ key: 'password', label: 'New password', type: 'password', required: true, helper: 'At least 6 characters' }]}
        onSubmit={v => call(base, 'PATCH', { password: v.password }, 'Password changed')} />
      <FormDialog open={dlg === 'warn'} onClose={close} title="Send a warning" intro="The user sees this message the next time they sign in." submitLabel="Send warning" fields={[{ key: 'warn', label: 'Message', multiline: true, required: true }]}
        onSubmit={v => call(base, 'PATCH', { warn: v.warn }, 'Warning sent')} />
      <FormDialog open={dlg === 'bookmark'} onClose={close} title={edit ? 'Edit bookmark' : 'Add bookmark'} initial={edit ? { url: (edit as B).url, title: (edit as B).title, description: (edit as B).description, collectionId: (edit as B).collectionId } : { url: '', title: '', description: '', collectionId: '' }}
        fields={[{ key: 'url', label: 'URL', required: true }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', multiline: true }, { key: 'collectionId', label: 'Collection', type: 'select', options: [{ value: '', label: 'Uncategorized' }, ...cols.map(c => ({ value: c.id, label: c.name }))] }]}
        onSubmit={v => (edit ? call(`${base}/bookmarks/${edit.id}`, 'PATCH', v, 'Bookmark updated') : call(`${base}/bookmarks`, 'POST', v, 'Bookmark added'))} />
      <FormDialog open={dlg === 'collection'} onClose={close} title={edit ? 'Edit collection' : 'Add collection'} initial={edit ? { name: (edit as C).name, description: (edit as C).description ?? '' } : { name: '', description: '' }}
        fields={[{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description' }]}
        onSubmit={v => (edit ? call(`${base}/collections/${edit.id}`, 'PATCH', v, 'Collection updated') : call(`${base}/collections`, 'POST', v, 'Collection added'))} />

      <ConfirmDialog open={confirm?.kind === 'suspend'} onClose={() => setConfirm(null)} danger title="Suspend this user?" confirmLabel="Suspend" text="They are signed out now and cannot sign in until reactivated. Their data is kept." onConfirm={() => call(base, 'PATCH', { disabled: true }, 'User suspended')} />
      <ConfirmDialog open={confirm?.kind === 'bookmark'} onClose={() => setConfirm(null)} danger title="Delete bookmark?" confirmLabel="Delete" text="This permanently removes the bookmark." onConfirm={() => call(`${base}/bookmarks/${confirm!.id}`, 'DELETE', undefined, 'Bookmark deleted')} />
      <ConfirmDialog open={confirm?.kind === 'collection'} onClose={() => setConfirm(null)} danger title="Delete collection?" confirmLabel="Delete" text="Its bookmarks are kept and moved to Uncategorized." onConfirm={() => call(`${base}/collections/${confirm!.id}`, 'DELETE', undefined, 'Collection deleted')} />
      <ConfirmDialog open={confirm?.kind === 'delete-user'} onClose={() => setConfirm(null)} danger title="Delete this user and all their data?" confirmLabel="Delete forever"
        text={<><Typography variant="body2" mb={1.5}>This removes the account, all bookmarks and collections. It cannot be undone. Type <b>{u.email}</b> to confirm.</Typography><TextField fullWidth size="small" value={typed} onChange={e => setTyped(e.target.value)} /></>}
        onConfirm={async () => { if (typed.trim().toLowerCase() !== u.email.toLowerCase()) throw new Error('The email does not match'); await apiFetch(base, { method: 'DELETE' }); toast.success('User deleted'); router.replace('/admin/users'); }} />
    </AdminShell>
  );
}

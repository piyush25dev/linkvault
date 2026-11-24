'use client';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, Menu, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material';
import { AddRounded, SearchRounded, StarRounded, StarBorderRounded, MoreVertRounded, OpenInNewRounded, ContentCopyRounded, DriveFileMoveRounded, EditRounded, DeleteOutlineRounded, RestoreRounded, FolderRounded, BookmarkAddRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';
import type { Bookmark, Collection } from '@/types/bookmark';

type Filter = 'all' | 'favorites' | 'recent' | 'trash';
type Props = { filter?: Filter; limit?: number; compact?: boolean };
type Form = { url: string; title: string; description: string; collectionId: string };
const empty: Form = { url: '', title: '', description: '', collectionId: '' };

const when = (v: unknown): number => {
  const o = v as { _seconds?: number; seconds?: number } | string | undefined;
  if (!o) return 0; if (typeof o === 'string') return Date.parse(o) || 0;
  const s = o._seconds ?? o.seconds; return s ? s * 1000 : 0;
};
const fmt = (v: unknown) => (when(v) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(when(v)) : '');
const norm = (v: string) => { const s = v.trim(); if (!s) return null; try { const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); return u.hostname.includes('.') ? u.href : null; } catch { return null; } };
const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

const copy: Record<Filter, [string, string]> = {
  all: ['No bookmarks yet', 'Save your first link and it will show up here.'],
  favorites: ['No favorites yet', 'Tap the star on any bookmark to pin it here.'],
  recent: ['Nothing saved recently', 'Newly saved links appear here.'],
  trash: ['Trash is empty', 'Deleted bookmarks wait here so you can restore them.'],
};

// Live screenshot of the page (free Microlink endpoint). Loaded lazily, so only cards near the viewport request one.
const shotUrl = (url: string) => `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`;

// Card header: the site's own preview image if it has one, else a live page screenshot, else a letter tile.
// The letter tile shows while the image loads and stays if every source fails.
function PagePreview({ b }: { b: Bookmark }) {
  const sources = useMemo(() => [b.image, shotUrl(b.url)].filter(Boolean) as string[], [b.image, b.url]);
  const [i, setI] = useState(0); const [loaded, setLoaded] = useState(false);
  const src = sources[i];
  return (
    <Box sx={{ position: 'relative', height: 140, overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 800, color: 'primary.main', background: t => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.25)}, ${alpha(t.palette.secondary.main, 0.18)})` }}>
      {(b.domain || b.title)[0]?.toUpperCase()}
      {src && <Box component="img" key={src} src={src} alt={`Preview of ${b.domain}`} loading="lazy" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setI(n => n + 1); }}
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', opacity: loaded ? 1 : 0, transition: 'opacity .3s ease' }} />}
    </Box>
  );
}

function Inner({ filter = 'all', limit, compact }: Props) {
  const { user } = useAuth(); const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const [items, setItems] = useState<Bookmark[]>([]); const [cols, setCols] = useState<Collection[]>([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [sort, setSort] = useState<'new' | 'old' | 'az'>('new'); const col = params.get('c') ?? 'all';
  const [dlg, setDlg] = useState<{ open: boolean; b?: Bookmark }>({ open: false });
  const [form, setForm] = useState<Form>(empty); const [meta, setMeta] = useState<{ favicon: string | null; image: string | null }>({ favicon: null, image: null });
  const [fetching, setFetching] = useState(false); const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<{ el: HTMLElement; b: Bookmark; move?: boolean } | null>(null);
  const [confirm, setConfirm] = useState<'empty' | Bookmark | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [b, c] = await Promise.all([apiFetch<{ bookmarks: Bookmark[] }>('/api/bookmarks?includeDeleted=true'), apiFetch<{ collections: Collection[] }>('/api/collections')]);
      setItems(b.bookmarks); setCols(c.collections);
    } catch (e) { toast.error(msg(e, 'Unable to load bookmarks')); } finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const nameOf = (id: string) => cols.find(c => c.id === id)?.name ?? 'Uncategorized';
  const cap = limit ?? (filter === 'recent' ? 12 : undefined);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let l = items.filter(b => (filter === 'trash' ? b.isDeleted : !b.isDeleted));
    if (filter === 'favorites') l = l.filter(b => b.isFavorite);
    if (col === 'none') l = l.filter(b => !b.collectionId); else if (col !== 'all') l = l.filter(b => b.collectionId === col);
    if (q) l = l.filter(b => `${b.title} ${b.url} ${b.description}`.toLowerCase().includes(q));
    const mode = filter === 'recent' || compact ? 'new' : sort;
    l = [...l].sort(mode === 'az' ? (a, b) => a.title.localeCompare(b.title) : mode === 'old' ? (a, b) => when(a.createdAt) - when(b.createdAt) : (a, b) => when(b.createdAt) - when(a.createdAt));
    return cap ? l.slice(0, cap) : l;
  }, [items, filter, col, search, sort, cap, compact]);

  function openDialog(b?: Bookmark) {
    setForm(b ? { url: b.url, title: b.title, description: b.description, collectionId: b.collectionId || '' } : empty);
    setMeta({ favicon: b?.favicon ?? null, image: b?.image ?? null }); setDlg({ open: true, b });
  }
  // Fills title/description from the site, but never overwrites what the user typed.
  async function lookup() {
    if (dlg.b) return; const u = norm(form.url); if (!u) return; setFetching(true);
    try {
      const m = await apiFetch<Record<string, string | null>>('/api/metadata', { method: 'POST', body: JSON.stringify({ url: u }) });
      setForm(f => ({ ...f, title: f.title || m.title || '', description: f.description || m.description || '' })); setMeta({ favicon: m.favicon ?? null, image: m.image ?? null });
    } catch { toast.message('Could not fetch site details. You can enter them manually.'); } finally { setFetching(false); }
  }
  async function save() {
    const u = norm(form.url); if (!u) { toast.error('Enter a valid website URL'); return; } setSaving(true);
    try {
      const base = { url: u, description: form.description.trim(), collectionId: form.collectionId };
      if (dlg.b) await apiFetch(`/api/bookmarks/${dlg.b.id}`, { method: 'PATCH', body: JSON.stringify({ ...base, title: form.title.trim() || new URL(u).hostname }) });
      else await apiFetch('/api/bookmarks', { method: 'POST', body: JSON.stringify({ ...base, title: form.title.trim() || undefined, favicon: meta.favicon, image: meta.image }) });
      toast.success(dlg.b ? 'Bookmark updated' : 'Bookmark saved'); setDlg({ open: false }); await load();
    } catch (e) { toast.error(msg(e, 'Could not save bookmark')); } finally { setSaving(false); }
  }
  async function patch(b: Bookmark, data: Partial<Bookmark>) {
    setItems(p => p.map(x => (x.id === b.id ? { ...x, ...data } : x)));   // optimistic
    try { await apiFetch(`/api/bookmarks/${b.id}`, { method: 'PATCH', body: JSON.stringify(data) }); } catch (e) { toast.error(msg(e, 'Update failed')); void load(); }
  }
  async function trash(b: Bookmark) { await patch(b, { isDeleted: true }); toast('Moved to trash', { action: { label: 'Undo', onClick: () => void patch(b, { isDeleted: false }) } }); }
  async function forever(list: Bookmark[]) {
    try { await Promise.all(list.map(b => apiFetch(`/api/bookmarks/${b.id}`, { method: 'DELETE' }))); setItems(p => p.filter(x => !list.some(b => b.id === x.id))); toast.success(list.length > 1 ? 'Trash emptied' : 'Bookmark deleted permanently'); }
    catch (e) { toast.error(msg(e, 'Delete failed')); void load(); }
  }
  const setCol = (v: string) => router.replace(v === 'all' ? pathname : `${pathname}?c=${v}`);
  const m = menu?.b; const closeMenu = () => setMenu(null);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} mb={3} alignItems={{ md: 'center' }}>
        {!compact && <TextField size="small" placeholder="Search title, URL or description…" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 440 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }} />}
        {!compact && filter !== 'recent' && <TextField select size="small" label="Collection" value={col} onChange={e => setCol(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="all">All collections</MenuItem><MenuItem value="none">Uncategorized</MenuItem>{cols.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>}
        {!compact && filter !== 'recent' && <TextField select size="small" label="Sort" value={sort} onChange={e => setSort(e.target.value as typeof sort)} sx={{ minWidth: 140 }}><MenuItem value="new">Newest</MenuItem><MenuItem value="old">Oldest</MenuItem><MenuItem value="az">A to Z</MenuItem></TextField>}
        <Box flex={1} />
        {filter === 'trash' ? <Button color="error" variant="outlined" disabled={!visible.length} onClick={() => setConfirm('empty')}>Empty trash</Button> : <Button variant="contained" startIcon={<AddRounded />} onClick={() => openDialog()}>Add bookmark</Button>}
      </Stack>

      {loading ? <Loader height={compact ? 200 : 320} label="Loading your bookmarks…" />
        : visible.length === 0 ? (
          <Stack alignItems="center" textAlign="center" py={9} px={2} sx={{ border: 1, borderStyle: 'dashed', borderColor: 'divider', borderRadius: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 4, display: 'grid', placeItems: 'center', mb: 2, color: 'primary.main', bgcolor: t => alpha(t.palette.primary.main, 0.12) }}><BookmarkAddRounded fontSize="large" /></Box>
            <Typography fontWeight={800} fontSize={18}>{search ? 'No matches' : copy[filter][0]}</Typography>
            <Typography color="text.secondary" mt={0.5} mb={2.5}>{search ? 'Try a different search or filter.' : copy[filter][1]}</Typography>
            {!search && filter !== 'trash' && <Button variant="contained" startIcon={<AddRounded />} onClick={() => openDialog()}>Add bookmark</Button>}
          </Stack>
        ) : (
          <Box display="grid" gap={2.5} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' }}>
            {visible.map(b => (
              <Card key={b.id} sx={{ display: 'flex', flexDirection: 'column', opacity: b.isDeleted ? 0.85 : 1 }}>
                <PagePreview b={b} />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Avatar variant="rounded" src={b.favicon || `https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`} sx={{ width: 34, height: 34, bgcolor: 'action.hover' }} imgProps={{ loading: 'lazy' }}>{b.title[0]}</Avatar>
                    <Box flex={1} minWidth={0}><Typography fontWeight={700} noWrap title={b.title}>{b.title}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block">{b.domain}</Typography></Box>
                    {!b.isDeleted && <IconButton size="small" aria-label="Toggle favorite" onClick={() => patch(b, { isFavorite: !b.isFavorite })} sx={{ color: b.isFavorite ? 'warning.main' : 'text.secondary' }}>{b.isFavorite ? <StarRounded /> : <StarBorderRounded />}</IconButton>}
                    <IconButton size="small" aria-label="More actions" onClick={e => setMenu({ el: e.currentTarget, b })}><MoreVertRounded fontSize="small" /></IconButton>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>{b.description || 'No description added.'}</Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Chip size="small" icon={<FolderRounded />} label={nameOf(b.collectionId)} variant="outlined" color={b.collectionId ? 'primary' : 'default'} sx={{ maxWidth: '65%' }} />
                    <Typography variant="caption" color="text.secondary">{fmt(b.createdAt)}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

      <Menu anchorEl={menu?.el} open={!!menu && !menu.move} onClose={closeMenu}>
        <MenuItem onClick={() => { window.open(m!.url, '_blank', 'noopener'); closeMenu(); }}><OpenInNewRounded fontSize="small" sx={{ mr: 1.25 }} />Open website</MenuItem>
        <MenuItem onClick={() => { void navigator.clipboard.writeText(m!.url); toast.success('URL copied'); closeMenu(); }}><ContentCopyRounded fontSize="small" sx={{ mr: 1.25 }} />Copy URL</MenuItem>
        {m?.isDeleted ? <MenuItem onClick={() => { void patch(m, { isDeleted: false }); toast.success('Bookmark restored'); closeMenu(); }}><RestoreRounded fontSize="small" sx={{ mr: 1.25 }} />Restore</MenuItem> : [
          <MenuItem key="e" onClick={() => { openDialog(m); closeMenu(); }}><EditRounded fontSize="small" sx={{ mr: 1.25 }} />Edit bookmark</MenuItem>,
          <MenuItem key="m" onClick={() => setMenu(x => x && { ...x, move: true })}><DriveFileMoveRounded fontSize="small" sx={{ mr: 1.25 }} />Move to collection</MenuItem>,
          <MenuItem key="f" onClick={() => { void patch(m!, { isFavorite: !m!.isFavorite }); closeMenu(); }}><StarBorderRounded fontSize="small" sx={{ mr: 1.25 }} />{m?.isFavorite ? 'Remove favorite' : 'Add favorite'}</MenuItem>,
        ]}
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (m!.isDeleted) setConfirm(m!); else void trash(m!); closeMenu(); }}><DeleteOutlineRounded fontSize="small" sx={{ mr: 1.25 }} />{m?.isDeleted ? 'Delete permanently' : 'Move to trash'}</MenuItem>
      </Menu>
      <Menu anchorEl={menu?.el} open={!!menu?.move} onClose={closeMenu}>
        <MenuItem selected={!m?.collectionId} onClick={() => { void patch(m!, { collectionId: '' }); toast.success('Moved to Uncategorized'); closeMenu(); }}>Uncategorized</MenuItem>
        {cols.map(c => <MenuItem key={c.id} selected={m?.collectionId === c.id} onClick={() => { void patch(m!, { collectionId: c.id }); toast.success(`Moved to ${c.name}`); closeMenu(); }}>{c.name}</MenuItem>)}
      </Menu>

      <Dialog open={dlg.open} onClose={() => setDlg({ open: false })} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={800}>{dlg.b ? 'Edit bookmark' : 'Add a bookmark'}</DialogTitle>
        <DialogContent><Stack spacing={2} pt={1}>
          <TextField label="Website URL" placeholder="example.com" autoFocus value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} onBlur={lookup} slotProps={{ input: { endAdornment: fetching ? <CircularProgress size={18} /> : null } }} />
          <TextField label="Title (optional)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description (optional)" multiline minRows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <TextField select label="Collection" value={form.collectionId} onChange={e => setForm({ ...form, collectionId: e.target.value })}><MenuItem value="">Uncategorized</MenuItem>{cols.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>
        </Stack></DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}><Button color="inherit" onClick={() => setDlg({ open: false })}>Cancel</Button><Button variant="contained" onClick={save} disabled={saving}>{saving ? 'Saving…' : dlg.b ? 'Save changes' : 'Save bookmark'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle fontWeight={800}>{confirm === 'empty' ? 'Empty trash?' : 'Delete permanently?'}</DialogTitle>
        <DialogContent><DialogContentText>{confirm === 'empty' ? `All ${visible.length} bookmarks in the trash will be deleted for good.` : 'This bookmark will be deleted for good. This cannot be undone.'}</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}><Button color="inherit" onClick={() => setConfirm(null)}>Cancel</Button><Button color="error" variant="contained" onClick={() => { const c = confirm; setConfirm(null); void forever(c === 'empty' ? items.filter(b => b.isDeleted) : [c as Bookmark]); }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export function BookmarkManager(props: Props) { return <Suspense fallback={null}><Inner {...props} /></Suspense>; }
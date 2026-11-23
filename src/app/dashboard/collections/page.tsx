'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Stack, TextField, Typography, alpha } from '@mui/material';
import { AddRounded, EditRounded, DeleteOutlineRounded, FolderRounded, ArrowForwardRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { Bookmark, Collection } from '@/types/bookmark';

const palette = ['#674D9F', '#2FB3A3', '#F5A524', '#E5484D', '#3B82F6', '#EC4899'];
const tint = (id: string) => palette[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

export default function Page() {
  const { user } = useAuth(); const router = useRouter();
  const [cols, setCols] = useState<Collection[]>([]); const [marks, setMarks] = useState<Bookmark[]>([]); const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ open: boolean; c?: Collection }>({ open: false }); const [name, setName] = useState(''); const [desc, setDesc] = useState('');
  const [del, setDel] = useState<Collection | null>(null); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [c, b] = await Promise.all([apiFetch<{ collections: Collection[] }>('/api/collections'), apiFetch<{ bookmarks: Bookmark[] }>('/api/bookmarks')]);
      setCols(c.collections); setMarks(b.bookmarks);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Unable to load collections'); } finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const count = (id: string) => marks.filter(b => (b.collectionId || '') === id && !b.isDeleted).length;
  const open = (c?: Collection) => { setName(c?.name ?? ''); setDesc(c?.description ?? ''); setDlg({ open: true, c }); };
  async function save() {
    if (!name.trim()) { toast.error('Give the collection a name'); return; } setBusy(true);
    try {
      const body = JSON.stringify({ name: name.trim(), description: desc.trim() });
      if (dlg.c) await apiFetch(`/api/collections/${dlg.c.id}`, { method: 'PATCH', body }); else await apiFetch('/api/collections', { method: 'POST', body });
      toast.success(dlg.c ? 'Collection updated' : 'Collection created'); setDlg({ open: false }); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save collection'); } finally { setBusy(false); }
  }
  async function remove() {
    const c = del!; setDel(null);
    try { await apiFetch(`/api/collections/${c.id}`, { method: 'DELETE' }); toast.success('Collection deleted. Its bookmarks are now uncategorized.'); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete collection'); }
  }

  const tiles: (Collection & { fixed?: boolean })[] = [...cols, { id: 'none', name: 'Uncategorized', description: 'Bookmarks without a collection', fixed: true }];
  return (
    <DashboardShell title="Collections" subtitle="Group your links by project or topic">
      <Stack direction="row" justifyContent="flex-end" mb={3}><Button variant="contained" startIcon={<AddRounded />} onClick={() => open()}>New collection</Button></Stack>
      {loading ? <Loader label="Loading collections…" /> : (
        <Box display="grid" gap={2.5} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }}>
          {tiles.map(c => {
            const n = count(c.fixed ? '' : c.id); const color = c.fixed ? '#8A8499' : tint(c.id);
            return (
              <Card key={c.id}><CardContent>
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'grid', placeItems: 'center', color, bgcolor: alpha(color, 0.15), flexShrink: 0 }}><FolderRounded /></Box>
                  <Box flex={1} minWidth={0}><Typography fontWeight={800} noWrap>{c.name}</Typography><Typography variant="body2" color="text.secondary" noWrap>{c.description || 'No description'}</Typography></Box>
                  {!c.fixed && <><IconButton size="small" aria-label="Edit collection" onClick={() => open(c)}><EditRounded fontSize="small" /></IconButton><IconButton size="small" aria-label="Delete collection" onClick={() => setDel(c)}><DeleteOutlineRounded fontSize="small" /></IconButton></>}
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2.5}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>{n} {n === 1 ? 'bookmark' : 'bookmarks'}</Typography>
                  <Button size="small" endIcon={<ArrowForwardRounded />} onClick={() => router.push(`/dashboard/bookmarks?c=${c.id}`)}>Open</Button>
                </Stack>
              </CardContent></Card>
            );
          })}
        </Box>
      )}
      <Dialog open={dlg.open} onClose={() => setDlg({ open: false })} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={800}>{dlg.c ? 'Edit collection' : 'New collection'}</DialogTitle>
        <DialogContent><Stack spacing={2} pt={1}><TextField autoFocus label="Name" value={name} onChange={e => setName(e.target.value)} /><TextField label="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} /></Stack></DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}><Button color="inherit" onClick={() => setDlg({ open: false })}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy}>{dlg.c ? 'Save changes' : 'Create'}</Button></DialogActions>
      </Dialog>
      <Dialog open={!!del} onClose={() => setDel(null)}>
        <DialogTitle fontWeight={800}>Delete collection?</DialogTitle>
        <DialogContent><DialogContentText>Bookmarks in “{del?.name}” won’t be deleted. They’ll move to Uncategorized.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}><Button color="inherit" onClick={() => setDel(null)}>Cancel</Button><Button color="error" variant="contained" onClick={remove}>Delete</Button></DialogActions>
      </Dialog>
    </DashboardShell>
  );
}

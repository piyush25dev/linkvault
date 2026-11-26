'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Box, Button, Chip, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import { AddRounded, SearchRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { FormDialog, Scroll, StatusChip, ago, errMsg, fmtDay, useDebounced } from '@/components/admin/ui';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';

type Row = { uid: string; email: string; displayName: string; photoURL: string | null; disabled: boolean; providers: string[]; createdAt: string; lastSignIn: string | null; bookmarks: number; openFlags: number; warnings: number; isSuperAdmin: boolean };

export default function UsersPage() {
  const router = useRouter(); const [q, setQ] = useState(''); const dq = useDebounced(q); const [status, setStatus] = useState('all'); const [page, setPage] = useState(0);
  const [data, setData] = useState<{ users: Row[]; total: number; pageSize: number } | null>(null); const [creating, setCreating] = useState(false); const [tick, setTick] = useState(0);
  useEffect(() => { setPage(0); }, [dq, status]);
  useEffect(() => {
    let live = true; setData(null);
    apiFetch<{ users: Row[]; total: number; pageSize: number }>(`/api/admin/users?q=${encodeURIComponent(dq)}&status=${status}&page=${page}`).then(r => live && setData(r)).catch(e => toast.error(errMsg(e)));
    return () => { live = false; };
  }, [dq, status, page, tick]);

  return (
    <AdminShell title="Users" subtitle="Every account, with its activity" action={<Button variant="contained" size="small" startIcon={<AddRounded />} onClick={() => setCreating(true)}>Add user</Button>}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} mb={3}>
        <TextField size="small" placeholder="Search name, email or ID…" value={q} onChange={e => setQ(e.target.value)} sx={{ flex: 1, maxWidth: 420 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }} />
        <TextField select size="small" label="Status" value={status} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 150 }}><MenuItem value="all">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="suspended">Suspended</MenuItem></TextField>
      </Stack>
      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        {!data ? <Loader height={260} label="Loading users…" /> : (
          <>
            <Scroll min={860}>
              <Table>
                <TableHead><TableRow>{['User', 'Status', 'Bookmarks', 'Flags', 'Joined', 'Last sign-in'].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {data.users.map(u => (
                    <TableRow key={u.uid} hover onClick={() => router.push(`/admin/users/${u.uid}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Avatar src={u.photoURL ?? undefined} sx={{ width: 34, height: 34 }}>{(u.displayName || u.email)[0]?.toUpperCase()}</Avatar>
                        <Box minWidth={0}><Stack direction="row" alignItems="center" spacing={0.75}><Typography variant="body2" fontWeight={700} noWrap>{u.displayName || 'No name'}</Typography>{u.isSuperAdmin && <Chip size="small" color="error" label="Super admin" sx={{ height: 18 }} />}</Stack><Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography></Box></Stack></TableCell>
                      <TableCell><StatusChip disabled={u.disabled} /></TableCell>
                      <TableCell>{u.bookmarks}</TableCell>
                      <TableCell>{u.openFlags ? <Chip size="small" color="error" label={`${u.openFlags} open`} /> : '–'}{u.warnings > 0 && <Chip size="small" color="warning" variant="outlined" label={`${u.warnings} warn`} sx={{ ml: 0.5 }} />}</TableCell>
                      <TableCell>{fmtDay(u.createdAt)}</TableCell>
                      <TableCell>{ago(u.lastSignIn)}</TableCell>
                    </TableRow>
                  ))}
                  {!data.users.length && <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No users match.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Scroll>
            <TablePagination component="div" count={data.total} page={page} rowsPerPage={data.pageSize} rowsPerPageOptions={[data.pageSize]} onPageChange={(_, p) => setPage(p)} />
          </>
        )}
      </Paper>
      <FormDialog open={creating} onClose={() => setCreating(false)} title="Add a user" intro="Creates an account the person can sign in to right away." submitLabel="Create user"
        fields={[{ key: 'displayName', label: 'Name' }, { key: 'email', label: 'Email', type: 'email', required: true }, { key: 'password', label: 'Temporary password', type: 'password', required: true, helper: 'At least 6 characters. Share it securely.' }]}
        onSubmit={async v => { await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(v) }); toast.success('User created'); setTick(t => t + 1); }} />
    </AdminShell>
  );
}

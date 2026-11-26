'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
} from '@mui/material';
import { RefreshRounded, SearchRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { Scroll, TypeChip, errMsg, fmt } from '@/components/admin/ui';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';

const types = [['', 'All activity'], ['auth', 'Sign-ins'], ['bookmark', 'Bookmarks'], ['bookmark.blocked', 'Blocked saves'], ['collection', 'Collections'], ['admin', 'Admin actions']];

export default function ActivityPage() {
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[] | null>(null);
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setItems(null);
    apiFetch<{
      items: any[]
    }>(`/api/admin/activity?limit=300&type=${type}`)
      .then(r => setItems(r.items))
      .catch(e => toast.error(errMsg(e)));
  }, [type, tick]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (
      items ?? [])
      .filter(i => !s || `${i.email} ${i.details} ${i.type} ${i.actorEmail}`
        .toLowerCase()
        .includes(s));
  }, [items, q]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return shown.slice(start, start + rowsPerPage);
  }, [shown, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [q, type]);

  return (
    <AdminShell title="Activity log" subtitle="Who did what, and when" action={<Button startIcon={<RefreshRounded />} onClick={() => setTick(t => t + 1)}>Refresh</Button>}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} mb={3}>
        <TextField size="small" placeholder="Filter by user, details…" value={q} onChange={e => setQ(e.target.value)} sx={{ flex: 1, maxWidth: 420 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }} />
        <TextField select size="small" label="Type" value={type} onChange={e => setType(e.target.value)} sx={{ minWidth: 190 }}>{types.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>
      </Stack>
      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        {!items ? <Loader height={260} label="Loading activity…" /> : (
          <Scroll min={820}><Table size="small">
            <TableHead><TableRow>{['When', 'User', 'Action', 'Details', 'By'].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {paginatedItems.map(i => (
                <TableRow key={i.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(i.createdAt)}</TableCell>
                  <TableCell>
                    {i.uid ? (
                      <Link href={`/admin/users/${i.uid}`} style={{ color: 'inherit', fontWeight: 600 }}>
                        {i.email ?? i.uid}
                      </Link>
                    ) : '–'}
                  </TableCell>
                  <TableCell><TypeChip type={i.type} /></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{i.details || '–'}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {i.actorUid !== i.uid ? i.actorEmail : 'self'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {!shown.length && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    No activity yet.
                  </TableCell>
                </TableRow>
              )}
              {!shown.length && <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>No activity yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
            <TablePagination
              component="div"
              count={shown.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                '.MuiTablePagination-toolbar': {
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  minHeight: 52,
                },
              }}
            />
          </Scroll>
        )}
      </Paper>
    </AdminShell>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Paper, Stack, TextField, Typography, alpha } from '@mui/material';
import { toast } from 'sonner';

export const fmt = (iso?: string | null) => (iso ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '–');
export const fmtDay = (iso?: string | null) => (iso ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso)) : '–');
export function ago(iso?: string | null) {
  if (!iso) return 'never'; const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value); useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]); return v;
}

export const SeverityChip = ({ s }: { s?: string | null }) => <Chip size="small" label={s ?? '–'} color={s === 'high' ? 'error' : s === 'medium' ? 'warning' : 'default'} sx={{ textTransform: 'capitalize' }} />;
export const StatusChip = ({ disabled }: { disabled: boolean }) => <Chip size="small" label={disabled ? 'Suspended' : 'Active'} color={disabled ? 'error' : 'success'} variant="outlined" />;
export function TypeChip({ type: raw }: { type?: string | null }) {
  const type = raw || 'unknown';   // tolerate log entries that have no type
  const g = type.split('.')[0]; const bad = type === 'bookmark.blocked';
  return <Chip size="small" variant="outlined" label={type.replace(/^admin\./, 'admin: ')} color={bad ? 'error' : g === 'admin' ? 'secondary' : g === 'auth' ? 'info' : 'default'} />;
}

export function StatCard({ label, value, icon, color, onClick }: { label: string; value: React.ReactNode; icon: React.ReactNode; color: string; onClick?: () => void }) {
  return (
    <Paper variant="outlined" onClick={onClick} sx={{ p: 2.25, borderRadius: 4, cursor: onClick ? 'pointer' : 'default', transition: 'all .2s', '&:hover': onClick ? { transform: 'translateY(-2px)', borderColor: color } : undefined }}>
      <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: 'grid', placeItems: 'center', color, bgcolor: alpha(color, 0.14), mb: 1.25 }}>{icon}</Box>
      <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
    </Paper>
  );
}

export const Scroll = ({ children, min = 720 }: { children: React.ReactNode; min?: number }) => <Box sx={{ overflowX: 'auto' }}><Box sx={{ minWidth: min }}>{children}</Box></Box>;

export function ConfirmDialog({ open, title, text, confirmLabel = 'Confirm', danger, onConfirm, onClose }: { open: boolean; title: string; text: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void | Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle fontWeight={800}>{title}</DialogTitle>
      <DialogContent><DialogContentText component="div">{text}</DialogContentText></DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button color="inherit" onClick={onClose}>Cancel</Button>
        <Button variant="contained" color={danger ? 'error' : 'primary'} disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); onClose(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); } }}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

export type Field = { key: string; label: string; type?: 'text' | 'password' | 'email' | 'select'; multiline?: boolean; options?: { value: string; label: string }[]; disabled?: boolean; helper?: string; required?: boolean };
/** One reusable form dialog for every create/edit/reset action in the admin panel. */
export function FormDialog({ open, title, intro, fields, initial, submitLabel = 'Save', onClose, onSubmit }: { open: boolean; title: string; intro?: string; fields: Field[]; initial?: Record<string, string>; submitLabel?: string; onClose: () => void; onSubmit: (v: Record<string, string>) => Promise<void> }) {
  const [v, setV] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const sig = JSON.stringify(initial ?? {});
  useEffect(() => { if (open) setV(JSON.parse(sig)); }, [open, sig]);
  async function submit() {
    const missing = fields.find(f => f.required && !(v[f.key] ?? '').trim()); if (missing) return void toast.error(`${missing.label} is required`);
    setBusy(true); try { await onSubmit(v); onClose(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight={800}>{title}</DialogTitle>
      <DialogContent>
        {intro && <Typography color="text.secondary" variant="body2" mb={2}>{intro}</Typography>}
        <Stack spacing={2} pt={intro ? 0 : 1}>
          {fields.map(f => (
            <TextField key={f.key} label={f.label} type={f.type === 'select' ? undefined : f.type ?? 'text'} select={f.type === 'select'} multiline={f.multiline} minRows={f.multiline ? 3 : undefined}
              disabled={f.disabled} helperText={f.helper} value={v[f.key] ?? ''} onChange={e => setV({ ...v, [f.key]: e.target.value })} autoComplete="off">
              {f.options?.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}><Button color="inherit" onClick={onClose}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Saving…' : submitLabel}</Button></DialogActions>
    </Dialog>
  );
}

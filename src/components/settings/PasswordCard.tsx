'use client';
import { useState } from 'react';
import { Button, Divider, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { VisibilityRounded, VisibilityOffRounded } from '@mui/icons-material';
import { EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { friendlyAuthError } from '@/lib/auth-errors';

export function PasswordCard() {
  const { user } = useAuth();
  const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [mailing, setMailing] = useState(false);
  const hasPassword = !!user?.providerData.some(p => p.providerId === 'password');

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    if (!cur) return void toast.error('Enter your current password');
    if (next.length < 6) return void toast.error('New password must be at least 6 characters');
    if (next !== confirm) return void toast.error('New passwords do not match');
    if (next === cur) return void toast.error('Choose a password different from your current one');
    setBusy(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, cur));   // proves it's really you
      await updatePassword(user, next);
      setCur(''); setNext(''); setConfirm('');
      toast.success('Password updated');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      toast.error(code === 'auth/invalid-credential' || code === 'auth/wrong-password' ? 'Your current password is incorrect.' : friendlyAuthError(err));
    } finally { setBusy(false); }
  }
  async function emailLink() {
    if (!user?.email) return; setMailing(true);
    try { await sendPasswordResetEmail(auth, user.email); toast.success(`Reset link sent to ${user.email}`); }
    catch (err) { toast.error(friendlyAuthError(err)); } finally { setMailing(false); }
  }

  const eye = <InputAdornment position="end"><IconButton edge="end" onClick={() => setShow(s => !s)} aria-label="Show passwords">{show ? <VisibilityOffRounded /> : <VisibilityRounded />}</IconButton></InputAdornment>;
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
      <Typography fontWeight={800}>Password</Typography>
      {!hasPassword ? (
        <Typography color="text.secondary" variant="body2" mt={0.5}>You sign in with Google, so there’s no LinkVault password to change.</Typography>
      ) : (
        <>
          <Typography color="text.secondary" variant="body2" mb={2.5}>Change your password. You’ll need your current one to confirm it’s you.</Typography>
          <Stack component="form" onSubmit={change} spacing={2}>
            <TextField label="Current password" type={show ? 'text' : 'password'} value={cur} onChange={e => setCur(e.target.value)} autoComplete="current-password" slotProps={{ input: { endAdornment: eye } }} />
            <TextField label="New password" type={show ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" helperText="At least 6 characters" />
            <TextField label="Confirm new password" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" error={!!confirm && confirm !== next} helperText={confirm && confirm !== next ? 'Passwords do not match' : ' '} />
            <Button type="submit" variant="contained" disabled={busy} sx={{ alignSelf: 'flex-start' }}>{busy ? 'Updating…' : 'Update password'}</Button>
          </Stack>
          <Divider sx={{ my: 2.5 }} />
          <Typography variant="body2" color="text.secondary" mb={1.5}>Forgot your current password? We’ll email a reset link to <b>{user?.email}</b>.</Typography>
          <Button variant="outlined" color="inherit" onClick={emailLink} disabled={mailing}>{mailing ? 'Sending…' : 'Email me a reset link'}</Button>
        </>
      )}
    </Paper>
  );
}

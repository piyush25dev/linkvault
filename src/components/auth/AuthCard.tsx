'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { BookmarkRounded, Google, VisibilityRounded, VisibilityOffRounded, CheckCircleRounded } from '@mui/icons-material';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';
import { friendlyAuthError as friendly } from '@/lib/auth-errors';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';


export function AuthCard({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'; const router = useRouter(); const { user, loading } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && user) router.replace('/dashboard'); }, [loading, user, router]);

  const [forgot, setForgot] = useState({ open: false, email: '', busy: false, sent: false });
  const closeForgot = () => setForgot(f => ({ ...f, open: false }));
  async function sendReset() {
    const to = forgot.email.trim();
    if (!to) return void toast.error('Enter your email address');
    setForgot(f => ({ ...f, busy: true }));
    try { await sendPasswordResetEmail(auth, to); setForgot(f => ({ ...f, busy: false, sent: true })); }
    catch (err) {
      // Don't reveal whether an account exists for this email
      if ((err as { code?: string })?.code === 'auth/user-not-found') setForgot(f => ({ ...f, busy: false, sent: true }));
      else { setForgot(f => ({ ...f, busy: false })); toast.error(friendly(err)); }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLogin && !name.trim()) return void toast.error('Enter your name');
    if (!email.trim()) return void toast.error('Enter your email');
    if (password.length < 6) return void toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email.trim(), password);
      else { const c = await createUserWithEmailAndPassword(auth, email.trim(), password); await updateProfile(c.user, { displayName: name.trim() }); }
      router.replace('/dashboard');
    } catch (err) { toast.error(friendly(err)); } finally { setBusy(false); }
  }
  async function google() {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); router.replace('/dashboard'); }
    catch (err) { if ((err as { code?: string })?.code === 'auth/popup-blocked') await signInWithRedirect(auth, provider); else toast.error(friendly(err)); }
  }

  return (
    <Box display="grid" minHeight="100vh" gridTemplateColumns={{ xs: '1fr', md: '1.05fr 1fr' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 6, color: '#fff', backgroundImage: 'linear-gradient(145deg,#095E5F,#0E7C7B 55%,#3FB5AE)' }}>
        <Stack direction="row" spacing={1.25} alignItems="center"><BookmarkRounded /><Typography fontWeight={800} fontSize={22}>LinkVault</Typography></Stack>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>Every link worth keeping, one calm place.</Typography>
          <Stack spacing={1.5} mt={4}>{['Auto-fetch titles, descriptions and icons', 'Organize with collections and favorites', 'Private to you, synced everywhere'].map(t => <Stack key={t} direction="row" spacing={1.25} alignItems="center"><CheckCircleRounded fontSize="small" sx={{ opacity: 0.9 }} /><Typography sx={{ opacity: 0.92 }}>{t}</Typography></Stack>)}</Stack>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>© {new Date().getFullYear()} LinkVault</Typography>
      </Box>
      <Box display="grid" sx={{ placeItems: 'center', p: 2.5, position: 'relative' }}>
        <Box position="absolute" top={16} right={16}><ThemeToggle /></Box>
        <Box component="form" onSubmit={submit} width="100%" maxWidth={400}>
          <Typography variant="h4" fontWeight={800}>{isLogin ? 'Welcome back' : 'Create your account'}</Typography>
          <Typography color="text.secondary" mt={0.75} mb={3.5}>{isLogin ? 'Sign in to your LinkVault account.' : 'Start organizing your links in under a minute.'}</Typography>
          <Stack spacing={2}>
            {!isLogin && <TextField label="Name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />}
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            <TextField label="Password" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShow(s => !s)} edge="end" aria-label="Show password">{show ? <VisibilityOffRounded /> : <VisibilityRounded />}</IconButton></InputAdornment> } }} />
            {isLogin && <Box textAlign="right" mt={-1}><Button size="small" onClick={() => setForgot({ open: true, email, busy: false, sent: false })} sx={{ fontWeight: 600 }}>Forgot password?</Button></Box>}
            <Button type="submit" variant="contained" size="large" disabled={busy} sx={{ py: 1.4 }}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</Button>
          </Stack>
          {/* <Divider sx={{ my: 3 }}>or</Divider>
          <Button fullWidth variant="outlined" size="large" startIcon={<Google />} onClick={google} color="inherit" sx={{ py: 1.3 }}>Continue with Google</Button> */}
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <Box component={Link} href={isLogin ? '/register' : '/login'} sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>{isLogin ? 'Create an account' : 'Sign in'}</Box>
          </Typography>
        </Box>
      </Box>
      <Dialog open={forgot.open} onClose={closeForgot} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={800}>Reset your password</DialogTitle>
        <DialogContent>
          {forgot.sent ? (
            <Stack alignItems="center" textAlign="center" spacing={1.5} py={1}>
              <CheckCircleRounded color="success" sx={{ fontSize: 48 }} />
              <Typography>If an account exists for <b>{forgot.email.trim()}</b>, a reset link is on its way. Check your inbox and spam folder.</Typography>
            </Stack>
          ) : (
            <>
              <Typography color="text.secondary" variant="body2" mb={2}>Enter your account email and we’ll send you a link to choose a new password.</Typography>
              <TextField autoFocus fullWidth type="email" label="Email" value={forgot.email} onChange={e => setForgot(f => ({ ...f, email: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') void sendReset(); }} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          {forgot.sent ? <Button variant="contained" onClick={closeForgot}>Done</Button> : <><Button color="inherit" onClick={closeForgot}>Cancel</Button><Button variant="contained" onClick={sendReset} disabled={forgot.busy}>{forgot.busy ? 'Sending…' : 'Send reset link'}</Button></>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

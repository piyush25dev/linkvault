'use client';
import { Avatar, Box, Button, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DarkModeRounded, LightModeRounded, LogoutRounded } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { PasswordCard } from '@/components/settings/PasswordCard';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function Page() {
  const { user } = useAuth(); const { mode, setMode } = useAppTheme(); const router = useRouter();
  const name = user?.displayName || user?.email?.split('@')[0] || 'Your account';
  return (
    <DashboardShell title="Settings" subtitle="Profile and preferences">
      {/* minmax(0, 1fr) lets columns shrink below their content width, so long emails can't stretch the page */}
      <Box sx={{ display: 'grid', gap: 3, alignItems: 'start', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }, maxWidth: 1000 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 4, minWidth: 0 }}>
          <Typography fontWeight={800} mb={2}>Profile</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={user?.photoURL ?? undefined} sx={{ width: 60, height: 60, fontSize: 24, bgcolor: 'primary.main', color: 'primary.contrastText' }}>{name[0]?.toUpperCase()}</Avatar>
            <Box minWidth={0}><Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{name}</Typography><Typography color="text.secondary" variant="body2" sx={{ overflowWrap: 'anywhere' }}>{user?.email}</Typography></Box>
          </Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 4, minWidth: 0 }}>
          <Typography fontWeight={800}>Appearance</Typography>
          <Typography color="text.secondary" variant="body2" mb={2}>Choose how LinkVault looks. Your choice is remembered.</Typography>
          <ToggleButtonGroup exclusive value={mode} onChange={(_, v) => v && setMode(v)} fullWidth>
            <ToggleButton value="light" sx={{ py: 1.25, gap: 1 }}><LightModeRounded fontSize="small" />Light</ToggleButton>
            <ToggleButton value="dark" sx={{ py: 1.25, gap: 1 }}><DarkModeRounded fontSize="small" />Dark</ToggleButton>
          </ToggleButtonGroup>
        </Paper>
        <PasswordCard />
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 4, minWidth: 0 }}>
          <Typography fontWeight={800} mb={1.5}>Account</Typography>
          <Button color="error" variant="outlined" startIcon={<LogoutRounded />} onClick={async () => { await signOut(auth); router.push('/login'); }}>Sign out</Button>
        </Paper>
      </Box>
    </DashboardShell>
  );
}

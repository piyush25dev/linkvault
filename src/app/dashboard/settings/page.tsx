'use client';
import { Avatar, Box, Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
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
      <Stack spacing={3} maxWidth={620}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
          <Typography fontWeight={800} mb={2}>Profile</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user?.photoURL ?? undefined} sx={{ width: 60, height: 60, fontSize: 24, bgcolor: 'primary.main', color: 'primary.contrastText' }}>{name[0]?.toUpperCase()}</Avatar>
            <Box><Typography fontWeight={700}>{name}</Typography><Typography color="text.secondary" variant="body2">{user?.email}</Typography></Box>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
          <Typography fontWeight={800}>Appearance</Typography>
          <Typography color="text.secondary" variant="body2" mb={2}>Choose how LinkVault looks. Your choice is remembered.</Typography>
          <ToggleButtonGroup exclusive value={mode} onChange={(_, v) => v && setMode(v)} fullWidth>
            <ToggleButton value="light" sx={{ py: 1.25, gap: 1 }}><LightModeRounded fontSize="small" />Light</ToggleButton>
            <ToggleButton value="dark" sx={{ py: 1.25, gap: 1 }}><DarkModeRounded fontSize="small" />Dark</ToggleButton>
          </ToggleButtonGroup>
        </Paper>
        <PasswordCard />
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
          <Typography fontWeight={800} mb={1.5}>Account</Typography>
          <Button color="error" variant="outlined" startIcon={<LogoutRounded />} onClick={async () => { await signOut(auth); router.push('/login'); }}>Sign out</Button>
        </Paper>
      </Stack>
    </DashboardShell>
  );
}

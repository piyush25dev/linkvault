'use client';
import { Box, Chip, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { LockRounded } from '@mui/icons-material';
import { AdminShell } from '@/components/admin/AdminShell';
import { PasswordCard } from '@/components/settings/PasswordCard';
import { useAuth } from '@/context/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();
  return (
    <AdminShell title="Settings" subtitle="Your super admin account">
      <Box sx={{ display: 'grid', gap: 3, maxWidth: 640, '& > *': { minWidth: 0 }, overflowWrap: 'anywhere' }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}><Typography fontWeight={800}>Account email</Typography><Chip size="small" color="error" label="Fixed" /></Stack>
          <Typography color="text.secondary" variant="body2" mb={2}>The super admin email is set in the server configuration and cannot be changed from the app. You can change the password below.</Typography>
          <TextField fullWidth label="Super admin email" value={user?.email ?? ''} disabled slotProps={{ input: { endAdornment: <InputAdornment position="end"><LockRounded fontSize="small" /></InputAdornment> } }} />
        </Paper>
        <PasswordCard />
      </Box>
    </AdminShell>
  );
}

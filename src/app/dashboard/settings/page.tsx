
'use client';

import {
  Avatar,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import {
  DarkModeRounded,
  LightModeRounded,
  LogoutRounded,
} from '@mui/icons-material';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { PasswordCard } from '@/components/settings/PasswordCard';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function Page() {
  const { user } = useAuth();
  const { mode, setMode } = useAppTheme();
  const router = useRouter();

  const name =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Your account';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <DashboardShell
      title="Settings"
      subtitle="Profile and preferences"
    >
      <Grid container spacing={{ xs: 2, sm: 2 }} >
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 3, sm: 4 },
              minWidth: 0,
            }}
          >
            <Typography fontWeight={800} mb={2}>
              Profile
            </Typography>

            <Stack
              direction="row"
              spacing={{ xs: 1.5, sm: 2 }}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <Avatar
                src={user?.photoURL ?? undefined}
                sx={{
                  width: { xs: 48, sm: 60 },
                  height: { xs: 48, sm: 60 },
                  flexShrink: 0,
                  fontSize: { xs: 20, sm: 24 },
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                {name[0]?.toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  fontWeight={700}
                  noWrap
                  sx={{ maxWidth: '100%' }}
                >
                  {name}
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    minWidth: 0,
                  }}
                >
                  {user?.email}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 3, sm: 4 },
            }}
          >
            <Typography fontWeight={800}>
              Appearance
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
              mb={2}
            >
              Choose how LinkVault looks. Your choice is remembered.
            </Typography>

            <ToggleButtonGroup
              exclusive
              value={mode}
              onChange={(_, value) => value && setMode(value)}
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  py: { xs: 1, sm: 1.25 },
                  gap: 1,
                  textTransform: 'none',
                  fontSize: { xs: 13, sm: 14 },
                },
              }}
            >
              <ToggleButton value="light">
                <LightModeRounded fontSize="small" />
                Light
              </ToggleButton>

              <ToggleButton value="dark">
                <DarkModeRounded fontSize="small" />
                Dark
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <PasswordCard />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: { xs: 3, sm: 4 },
            }}
          >
            <Typography fontWeight={800} mb={1.5}>
              Account
            </Typography>

            <Button
              color="error"
              variant="outlined"
              startIcon={<LogoutRounded />}
              onClick={handleSignOut}
              fullWidth
              sx={{
                width: { xs: '100%', sm: 'fit-content' },
                textTransform: 'none',
                py: 1,
              }}
            >
              Sign out
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </DashboardShell>
  );
}

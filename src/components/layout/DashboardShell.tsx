'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Box, Drawer, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { MenuRounded } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/admin-config';
import { Sidebar, SidebarContent } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

export function DashboardShell({ children, title, subtitle, variant = 'user', action }: { children: React.ReactNode; title: string; subtitle?: string; variant?: 'user' | 'admin'; action?: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { user } = useAuth(); const router = useRouter();
  const initial = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  return (
    <Stack direction="row" minHeight="100vh">
      <Sidebar variant={variant} />
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: 272 } }}><SidebarContent variant={variant} onNavigate={() => setOpen(false)} /></Drawer>
      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" px={{ xs: 2, md: 4 }} py={1.75} borderBottom={1} borderColor="divider"
          sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'color-mix(in srgb, var(--mui-palette-background-paper, #fff) 80%, transparent)', backdropFilter: 'blur(14px)', backgroundColor: t => t.palette.mode === 'dark' ? 'rgba(23,20,31,.8)' : 'rgba(255,255,255,.8)' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setOpen(true)} aria-label="Open menu"><MenuRounded /></IconButton>
            <Box><Typography fontWeight={800} fontSize={20} letterSpacing="-0.02em" lineHeight={1.2}>{title}</Typography>{subtitle && <Typography variant="caption" color="text.secondary" sx={{display: {xs: 'none', sm: 'block'}}}>{subtitle}</Typography>}</Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {action}
            <ThemeToggle />
            <IconButton onClick={e => setAnchor(e.currentTarget)} aria-label="Account menu"><Avatar src={user?.photoURL ?? undefined} sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>{initial}</Avatar></IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
              {variant === 'user' && isAdminEmail(user?.email) && <MenuItem onClick={() => { setAnchor(null); router.push('/admin'); }}>Admin panel</MenuItem>}
              {variant === 'admin' && <MenuItem onClick={() => { setAnchor(null); router.push('/dashboard'); }}>My vault</MenuItem>}
              <MenuItem onClick={() => { setAnchor(null); router.push(variant === 'admin' ? '/admin/settings' : '/dashboard/settings'); }}>Settings</MenuItem>
              <MenuItem onClick={async () => { setAnchor(null); await signOut(auth); router.push('/login'); }}>Sign out</MenuItem>
            </Menu>
          </Stack>
        </Stack>
        <Box p={{ xs: 2, md: 4 }} maxWidth={1400} mx="auto">{children}</Box>
      </Box>
    </Stack>
  );
}

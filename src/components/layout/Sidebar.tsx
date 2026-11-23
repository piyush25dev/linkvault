'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Box, Button, Divider, Stack, Typography, alpha } from '@mui/material';
import { BookmarkRounded, DashboardRounded, StarRounded, FolderRounded, AccessTimeRounded, DeleteOutlineRounded, SettingsRounded, LogoutRounded } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const links = [
  { label: 'Overview', href: '/dashboard', icon: <DashboardRounded fontSize="small" /> },
  { label: 'All bookmarks', href: '/dashboard/bookmarks', icon: <BookmarkRounded fontSize="small" /> },
  { label: 'Favorites', href: '/dashboard/favorites', icon: <StarRounded fontSize="small" /> },
  { label: 'Collections', href: '/dashboard/collections', icon: <FolderRounded fontSize="small" /> },
  { label: 'Recently added', href: '/dashboard/recent', icon: <AccessTimeRounded fontSize="small" /> },
  { label: 'Trash', href: '/dashboard/trash', icon: <DeleteOutlineRounded fontSize="small" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <SettingsRounded fontSize="small" /> },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname(); const router = useRouter(); const { user } = useAuth();
  const name = user?.displayName || user?.email?.split('@')[0] || 'Your account';
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2.5 }}>
      <Stack component={Link} href="/" direction="row" spacing={1.25} alignItems="center" mb={4} sx={{ textDecoration: 'none', color: 'text.primary' }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: '#fff', backgroundImage: 'linear-gradient(135deg,#8C74C4,#4B3680)', boxShadow: '0 8px 18px -8px rgba(103,77,159,.8)' }}><BookmarkRounded fontSize="small" /></Box>
        <Typography fontWeight={800} fontSize={20} letterSpacing="-0.02em">LinkVault</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" fontWeight={700} px={1.5} mb={1} letterSpacing=".08em">WORKSPACE</Typography>
      <Stack spacing={0.5}>
        {links.map(item => {
          const active = item.href === '/dashboard' ? path === item.href : path.startsWith(item.href);
          return (
            <Button key={item.href} component={Link} href={item.href} onClick={onNavigate} startIcon={item.icon} fullWidth
              sx={{ justifyContent: 'flex-start', px: 1.5, py: 1.1, borderRadius: 2.5, fontWeight: active ? 700 : 500, color: active ? 'primary.main' : 'text.secondary', bgcolor: active ? t => alpha(t.palette.primary.main, 0.12) : 'transparent', '&:hover': { bgcolor: t => alpha(t.palette.primary.main, 0.08), color: 'primary.main' } }}>
              {item.label}
            </Button>
          );
        })}
      </Stack>
      <Box flex={1} />
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1.5} alignItems="center" px={0.5} mb={1.5}>
        <Avatar src={user?.photoURL ?? undefined} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>{name[0]?.toUpperCase()}</Avatar>
        <Box minWidth={0}><Typography fontWeight={700} variant="body2" noWrap>{name}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block">{user?.email}</Typography></Box>
      </Stack>
      <Button startIcon={<LogoutRounded />} color="inherit" sx={{ justifyContent: 'flex-start', color: 'text.secondary' }} onClick={async () => { await signOut(auth); toast.success('Signed out'); router.push('/login'); }}>Sign out</Button>
    </Box>
  );
}

export function Sidebar() {
  return <Box sx={{ width: 264, flexShrink: 0, borderRight: 1, borderColor: 'divider', height: '100vh', position: 'sticky', top: 0, display: { xs: 'none', md: 'block' }, bgcolor: 'background.paper' }}><SidebarContent /></Box>;
}

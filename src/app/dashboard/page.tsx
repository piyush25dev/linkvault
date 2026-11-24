'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, Paper, Stack, Typography, alpha } from '@mui/material';
import { BookmarkRounded, StarRounded, FolderRounded, DeleteOutlineRounded, ArrowForwardRounded } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookmarkManager } from '@/components/bookmarks/BookmarkManager';

type Stats = { bookmarks: number; favorites: number; collections: number; trash: number };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { if (user) apiFetch<{ stats: Stats }>('/api/dashboard').then(r => setStats(r.stats)).catch(() => setStats({ bookmarks: 0, favorites: 0, collections: 0, trash: 0 })); }, [user]);
  const first = (user?.displayName || user?.email?.split('@')[0] || '').split(' ')[0];
  const cards = [
    { label: 'Total bookmarks', value: stats?.bookmarks, icon: <BookmarkRounded />, href: '/dashboard/bookmarks', c: '#0E7C7B' },
    { label: 'Favorites', value: stats?.favorites, icon: <StarRounded />, href: '/dashboard/favorites', c: '#F5A524' },
    { label: 'Collections', value: stats?.collections, icon: <FolderRounded />, href: '/dashboard/collections', c: '#3B82F6' },
    { label: 'In trash', value: stats?.trash, icon: <DeleteOutlineRounded />, href: '/dashboard/trash', c: '#E5484D' },
  ];
  return (
    <DashboardShell title="Overview" subtitle="Your vault at a glance">
      <Box sx={{ p: { xs: 3, md: 4 }, mb: 3, borderRadius: 5, color: '#fff', backgroundImage: 'linear-gradient(135deg,#095E5F,#0E7C7B 55%,#3FB5AE)', boxShadow: '0 24px 50px -24px rgba(14,124,123,.8)' }}>
        <Typography variant="h4" fontWeight={800}>Welcome back{first ? `, ${first}` : ''} 👋</Typography>
        <Typography sx={{ opacity: 0.85, mt: 0.75 }}>Save a link, tidy a collection, or find something you stashed away.</Typography>
      </Box>
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }} mb={4}>
        {cards.map(x => (
          <Paper key={x.label} component={Link} href={x.href} variant="outlined" sx={{ p: 2.5, textDecoration: 'none', color: 'inherit', borderRadius: 4, transition: 'all .2s', '&:hover': { transform: 'translateY(-2px)', borderColor: x.c } }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: x.c, bgcolor: alpha(x.c, 0.14), mb: 1.5 }}>{x.icon}</Box>
            <Typography variant="h4" fontWeight={800} lineHeight={1}>{x.value ?? '–'}</Typography>
            <Typography color="text.secondary" variant="body2" mt={0.5}>{x.label}</Typography>
          </Paper>
        ))}
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={800}>Recently added</Typography>
        <Button component={Link} href="/dashboard/bookmarks" endIcon={<ArrowForwardRounded />}>View all</Button>
      </Stack>
      <BookmarkManager filter="recent" limit={6} compact />
    </DashboardShell>
  );
}
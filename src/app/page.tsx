'use client';
import { useState } from 'react';
import Link from 'next/link';
import { alpha, Box, Button, Chip, Container, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { BookmarkRounded, MenuRounded } from '@mui/icons-material';
import { AutoAwesomeRounded, SearchRounded, FolderRounded, StarRounded, DarkModeRounded, LockRounded, ArrowForwardRounded } from '@mui/icons-material';
import { ThemeToggle } from '@/components/layout/ThemeToggle';



function LandingHeader() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} py={{ xs: 2, md: 3 }}>
      {/* Logo: links home, never shrinks */}
      <Stack component={Link} href="/" direction="row" spacing={1.25} alignItems="center"
        sx={{ textDecoration: 'none', color: 'text.primary', flexShrink: 0, minWidth: 0 }}>
        <Box sx={{
          width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, borderRadius: 2.5, display: 'grid', placeItems: 'center',
          color: '#fff', backgroundImage: 'linear-gradient(135deg,#3FB5AE,#095E5F)',
        }}>
          <BookmarkRounded fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={800} noWrap
          sx={{ fontSize: { xs: 18, sm: 20 }, '@media (max-width:339px)': { display: 'none' } }}>
          LinkVault
        </Typography>
      </Stack>

      {/* Tablet and desktop: full buttons */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
        <ThemeToggle />
        <Button component={Link} href="/login" color="inherit">Log in</Button>
        <Button component={Link} href="/register" variant="contained">Get started</Button>
      </Stack>

      {/* Mobile: theme toggle + menu */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'flex', sm: 'none' } }}>
        <ThemeToggle />
        <IconButton aria-label="Open menu" onClick={e => setAnchor(e.currentTarget)}><MenuRounded /></IconButton>
        <Menu anchorEl={anchor} open={!!anchor} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <MenuItem component={Link} href="/login" onClick={close}>Log in</MenuItem>
          <MenuItem component={Link} href="/register" onClick={close} sx={{ fontWeight: 700, color: 'primary.main' }}>Get started</MenuItem>
        </Menu>
      </Stack>
    </Stack>
  );
}
const features = [
  { icon: <AutoAwesomeRounded />, t: 'Smart saving', d: 'Paste a URL and LinkVault fetches the title, description and icon for you.' },
  { icon: <FolderRounded />, t: 'Collections', d: 'Group links by project or topic. Deleting a collection never deletes your links.' },
  { icon: <SearchRounded />, t: 'Instant search', d: 'Search by title, URL or description, then sort and filter in a click.' },
  { icon: <StarRounded />, t: 'Favorites', d: 'Star what matters so your best links are always one tap away.' },
  { icon: <DarkModeRounded />, t: 'Light and dark', d: 'A polished theme for day and night that remembers your choice.' },
  { icon: <LockRounded />, t: 'Private by design', d: 'Your bookmarks belong to your account, and nobody else can read them.' },
];
const demo = [{ t: 'Next.js Documentation', d: 'nextjs.org', c: 'Development' }, { t: 'Refactoring UI', d: 'refactoringui.com', c: 'Design' }, { t: 'Firebase Console', d: 'firebase.google.com', c: 'Tools' }];

export default function Home() {
  return (
    <Box>
      <Container maxWidth="lg">
        <LandingHeader />

        <Box sx={{ pt: { xs: 7, md: 11 }, pb: { xs: 6, md: 8 }, textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
          <Chip label="Your personal corner of the internet" color="primary" variant="outlined" sx={{ mb: 3, bgcolor: t => alpha(t.palette.primary.main, 0.08) }} />
          <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: 40, md: 66 }, lineHeight: 1.05 }}>
            Every link worth keeping,{' '}
            <Box component="span" sx={{ backgroundImage: 'linear-gradient(135deg,#3FB5AE,#0E7C7B 50%,#F2994A)', WebkitBackgroundClip: 'text', color: 'transparent' }}>in one place.</Box>
          </Typography>
          <Typography color="text.secondary" fontSize={{ xs: 16, md: 19 }} mt={3} mx="auto" maxWidth={600}>Save websites, organize them into collections, and find exactly what you need in seconds.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={2} mt={4.5}>
            <Button component={Link} href="/register" variant="contained" size="large" endIcon={<ArrowForwardRounded />} sx={{ py: 1.5, px: 3.5 }}>Create your free vault</Button>
            <Button component={Link} href="/login" size="large" color="inherit" variant="outlined" sx={{ py: 1.5, px: 3.5 }}>I have an account</Button>
          </Stack>
        </Box>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 5, maxWidth: 900, mx: 'auto', boxShadow: '0 40px 80px -40px rgba(14,124,123,.5)' }}>
          <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: 'repeat(3,1fr)' }}>
            {demo.map((x, i) => (
              <Paper key={x.t} variant="outlined" sx={{ p: 2.25, borderRadius: 3.5 }}>
                <Stack direction="row" spacing={1.25} alignItems="center" mb={1.25}><Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', fontWeight: 800, color: 'primary.main', bgcolor: t => alpha(t.palette.primary.main, 0.14) }}>{x.t[0]}</Box><Box minWidth={0}><Typography fontWeight={700} noWrap>{x.t}</Typography><Typography variant="caption" color="text.secondary">{x.d}</Typography></Box></Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center"><Chip size="small" label={x.c} color="primary" variant="outlined" /><StarRounded sx={{ color: i === 0 ? 'warning.main' : 'text.disabled' }} fontSize="small" /></Stack>
              </Paper>
            ))}
          </Box>
        </Paper>

        <Box py={{ xs: 8, md: 12 }}>
          <Typography variant="h4" fontWeight={800} textAlign="center" mb={1}>Everything you need, nothing you don’t</Typography>
          <Typography color="text.secondary" textAlign="center" mb={5}>A calm, fast home for the links you actually want to find again.</Typography>
          <Box display="grid" gap={2.5} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }}>
            {features.map(f => (
              <Paper key={f.t} variant="outlined" sx={{ p: 3, borderRadius: 4, transition: 'all .25s', '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main' } }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: t => alpha(t.palette.primary.main, 0.12), mb: 2 }}>{f.icon}</Box>
                <Typography fontWeight={800}>{f.t}</Typography><Typography color="text.secondary" variant="body2" mt={0.75}>{f.d}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        <Box sx={{ p: { xs: 4, md: 7 }, mb: 8, borderRadius: 6, textAlign: 'center', color: '#fff', backgroundImage: 'linear-gradient(135deg,#064B4C,#0E7C7B 55%,#3FB5AE)' }}>
          <Typography variant="h4" fontWeight={800}>Ready to tidy up your tabs?</Typography>
          <Typography sx={{ opacity: 0.85, mt: 1, mb: 3.5 }}>Create your vault in under a minute. It’s free.</Typography>
          <Button component={Link} href="/register" size="large" sx={{ bgcolor: '#fff', color: '#095E5F', px: 4, py: 1.4, '&:hover': { bgcolor: '#E4F4F2' } }}>Get started</Button>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" pb={4}>© {new Date().getFullYear()} LinkVault</Typography>
      </Container>
    </Box>
  );
}
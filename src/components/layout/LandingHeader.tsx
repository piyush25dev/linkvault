import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { BookmarkRounded, MenuRounded } from '@mui/icons-material';
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
          color: '#fff', backgroundImage: 'linear-gradient(135deg,#8C74C4,#4B3680)',
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
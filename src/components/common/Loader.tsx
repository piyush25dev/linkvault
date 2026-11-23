'use client';
import { PacmanLoader } from 'react-spinners';
import { Box, Typography, useTheme } from '@mui/material';

// Shared Pacman loader, coloured from the active theme (works in light and dark mode).
export function Loader({ fullScreen = false, height = 280, label }: { fullScreen?: boolean; height?: number; label?: string }) {
  const theme = useTheme();
  return (
    <Box role="status" aria-label={label ?? 'Loading'} sx={{ display: 'grid', placeItems: 'center', minHeight: fullScreen ? '100vh' : height, textAlign: 'center' }}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', pr: 2.5 }}><PacmanLoader color={theme.palette.primary.main} size={26} /></Box>
        {label && <Typography variant="body2" color="text.secondary" mt={2}>{label}</Typography>}
      </Box>
    </Box>
  );
}

'use client';
import { IconButton, Tooltip } from '@mui/material';
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material';
import { useAppTheme } from '@/context/ThemeContext';
export function ThemeToggle() { const { mode, toggleTheme } = useAppTheme(); return <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}><IconButton onClick={toggleTheme} aria-label="Toggle theme" color="inherit">{mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}</IconButton></Tooltip>; }

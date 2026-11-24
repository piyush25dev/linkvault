'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, alpha, createTheme } from '@mui/material';

type Mode = 'light' | 'dark';
type ThemeContextValue = { mode: Mode; toggleTheme: () => void; setMode: (mode: Mode) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('linkvault-theme');
    if (saved === 'dark' || saved === 'light') setMode(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('linkvault-theme', mode); }, [mode, ready]);

  const theme = useMemo(() => {
    const dark = mode === 'dark';
    const main = dark ? '#A68FE0' : '#674D9F';
    return createTheme({
      palette: {
        mode,
        primary: { main, light: dark ? '#C4B3EE' : '#8C74C4', dark: dark ? '#8A6FD0' : '#4B3680', contrastText: dark ? '#15111F' : '#FFFFFF' },
        secondary: { main: dark ? '#4FD1C0' : '#2FB3A3' },
        warning: { main: dark ? '#FFB84D' : '#F5A524' },
        error: { main: dark ? '#FF6B70' : '#E5484D' },
        background: dark ? { default: '#0E0C14', paper: '#17141F' } : { default: '#F7F6FB', paper: '#FFFFFF' },
        text: dark ? { primary: '#F3F0FA', secondary: '#A29BB8' } : { primary: '#1B1530', secondary: '#6B6580' },
        divider: dark ? 'rgba(255,255,255,.08)' : 'rgba(103,77,159,.12)',
      },
      // shape: { borderRadius: 14 },
      typography: {
        fontFamily: 'var(--font-inter, Inter), system-ui, -apple-system, "Segoe UI", sans-serif',
        h2: { letterSpacing: '-0.03em' }, h4: { letterSpacing: '-0.025em' }, h5: { letterSpacing: '-0.02em' }, h6: { letterSpacing: '-0.015em' },
        button: { textTransform: 'none', fontWeight: 600 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundImage: `radial-gradient(1100px 520px at 88% -8%, ${alpha(main, 0.14)}, transparent 62%), radial-gradient(900px 460px at -8% 2%, ${alpha(dark ? '#4FD1C0' : '#2FB3A3', 0.08)}, transparent 60%)`,
              backgroundAttachment: 'fixed', WebkitFontSmoothing: 'antialiased',
            }, '::selection': { background: alpha(main, 0.3) }
          }
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiCard: { styleOverrides: { root: { borderRadius: 18, border: `1px solid ${dark ? 'rgba(255,255,255,.08)' : 'rgba(103,77,159,.12)'}`, boxShadow: dark ? '0 12px 30px -16px rgba(0,0,0,.7)' : '0 10px 28px -16px rgba(31,18,66,.18)', transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease', '&:hover': { transform: 'translateY(-3px)', borderColor: alpha(main, 0.4), boxShadow: `0 20px 40px -18px ${alpha(main, 0.45)}` } } } },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: { borderRadius: 12, paddingInline: 18, transition: 'all .2s ease' },
            containedPrimary: { backgroundImage: dark ? 'linear-gradient(135deg,#C4B3EE,#A68FE0)' : 'linear-gradient(135deg,#7A5FB5,#4B3680)', boxShadow: `0 8px 18px -8px ${alpha(main, 0.7)}`, '&:hover': { filter: 'brightness(1.07)', transform: 'translateY(-1px)' } },
          },
        },
        MuiIconButton: { styleOverrides: { root: { '&:hover': { backgroundColor: alpha(main, 0.1) } } } },
        MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: alpha(main, 0.04), '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(main, 0.16)}`, backgroundColor: 'transparent' } } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 22, boxShadow: '0 30px 80px -20px rgba(20,10,50,.5)' } } },
        MuiMenu: { styleOverrides: { paper: { borderRadius: 14, marginTop: 6, boxShadow: '0 16px 40px -12px rgba(20,10,50,.35)' }, list: { padding: 6 } } },
        MuiMenuItem: { styleOverrides: { root: { borderRadius: 9, fontSize: 14, fontWeight: 500 } } },
        MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 600 } } },
        MuiTooltip: { defaultProps: { arrow: true } },
      },
    });
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggleTheme: () => setMode(v => (v === 'light' ? 'dark' : 'light')) }), [mode]);
  return <ThemeContext.Provider value={value}><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></ThemeContext.Provider>;
}
export function useAppTheme() { const c = useContext(ThemeContext); if (!c) throw new Error('useAppTheme must be used inside AppThemeProvider'); return c; }

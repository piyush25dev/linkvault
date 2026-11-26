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
    const main = dark ? '#4FD1C5' : '#0E7C7B';
    return createTheme({
      palette: {
        mode,
        primary: { main, light: dark ? '#8BE8DF' : '#3FB5AE', dark: dark ? '#2BB3A8' : '#095E5F', contrastText: dark ? '#06201F' : '#FFFFFF' },
        secondary: { main: dark ? '#FFB366' : '#F2994A' },
        warning: { main: dark ? '#FFB84D' : '#F5A524' },
        error: { main: dark ? '#FF6B70' : '#E5484D' },
        background: dark ? { default: '#0A1112', paper: '#101B1C' } : { default: '#F4F9F9', paper: '#FFFFFF' },
        text: dark ? { primary: '#EAF6F5', secondary: '#8FA9A8' } : { primary: '#0F2022', secondary: '#52686A' },
        divider: dark ? 'rgba(255,255,255,.08)' : 'rgba(14,124,123,.12)',
      },
      // shape: { borderRadius: 14 },
      typography: {
        fontFamily: 'var(--font-outfit), sans-serif',

        h1: {
          fontSize: '2.5rem',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.04em',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '3.5rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '4rem',
          },
        },

        h2: {
          fontSize: '2rem',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.03em',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '2.5rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '3rem',
          },
        },

        h3: {
          fontSize: '1.75rem',
          fontWeight: 700,
          lineHeight: 1.25,
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '2rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '2.5rem',
          },
        },

        h4: {
          fontSize: '1.4rem',
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: '-0.025em',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '1.75rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '2rem',
          },
        },

        h5: {
          fontSize: '1.2rem',
          fontWeight: 700,
          lineHeight: 1.35,
          letterSpacing: '-0.02em',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '1.4rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '1.5rem',
          },
        },

        h6: {
          fontSize: '1.05rem',
          fontWeight: 700,
          lineHeight: 1.4,
          letterSpacing: '-0.015em',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '1.15rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '1.25rem',
          },
        },

        subtitle1: {
          fontSize: '0.95rem',
          [createTheme().breakpoints.up('md')]: {
            fontSize: '1rem',
          },
        },

        subtitle2: {
          fontSize: '0.85rem',
          [createTheme().breakpoints.up('md')]: {
            fontSize: '0.875rem',
          },
        },

        body1: {
          fontSize: '0.875rem',
          lineHeight: 1.7,
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '0.95rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '1rem',
          },
        },

        body2: {
          fontSize: '0.8rem',
          lineHeight: 1.65,
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '0.85rem',
          },
          [createTheme().breakpoints.up('md')]: {
            fontSize: '0.875rem',
          },
        },

        button: {
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'none',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '0.875rem',
          },
        },

        caption: {
          fontSize: '0.7rem',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '0.75rem',
          },
        },

        overline: {
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          [createTheme().breakpoints.up('sm')]: {
            fontSize: '0.7rem',
          },
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundImage: `radial-gradient(1100px 520px at 88% -8%, ${alpha(main, 0.14)}, transparent 62%), radial-gradient(900px 460px at -8% 2%, ${alpha(dark ? '#FFB366' : '#F2994A', 0.08)}, transparent 60%)`,
              backgroundAttachment: 'fixed', WebkitFontSmoothing: 'antialiased',
            }, '::selection': { background: alpha(main, 0.3) }
          }
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiCard: { styleOverrides: { root: { borderRadius: 18, border: `1px solid ${dark ? 'rgba(255,255,255,.08)' : 'rgba(14,124,123,.12)'}`, boxShadow: dark ? '0 12px 30px -16px rgba(0,0,0,.7)' : '0 10px 28px -16px rgba(6,32,33,.18)', transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease', '&:hover': { borderColor: alpha(main, 0.4), boxShadow: `0 0 20px 5px ${alpha(main, 0.25)}` } } } },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: { borderRadius: 12, paddingInline: 8, transition: 'all .2s ease' },
            containedPrimary: { backgroundImage: dark ? 'linear-gradient(135deg,#8BE8DF,#4FD1C5)' : 'linear-gradient(135deg,#1B9693,#095E5F)', boxShadow: `0 8px 18px -8px ${alpha(main, 0.7)}`, '&:hover': { filter: 'brightness(1.07)', transform: 'translateY(-1px)' } },
          },
        },
        MuiIconButton: { styleOverrides: { root: { '&:hover': { backgroundColor: alpha(main, 0.1) } } } },
        MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: alpha(main, 0.04), '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(main, 0.16)}`, backgroundColor: 'transparent' } } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 22, boxShadow: '0 30px 80px -20px rgba(6,32,33,.5)' } } },
        MuiMenu: { styleOverrides: { paper: { borderRadius: 14, marginTop: 6, boxShadow: '0 16px 40px -12px rgba(6,32,33,.35)' }, list: { padding: 6 } } },
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
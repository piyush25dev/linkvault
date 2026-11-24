'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { BookmarkRounded, DashboardRounded, StarRounded, FolderRounded, AccessTimeRounded, DeleteOutlineRounded, SettingsRounded, LogoutRounded, TipsAndUpdatesRounded } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';

type Stats = { bookmarks: number; favorites: number; collections: number; trash: number };
type Item = { label: string; href: string; icon: React.ReactNode; stat?: keyof Stats };
const groups: { title: string; items: Item[] }[] = [
  { title: 'Library', items: [
    { label: 'Overview', href: '/dashboard', icon: <DashboardRounded fontSize="small" /> },
    { label: 'All bookmarks', href: '/dashboard/bookmarks', icon: <BookmarkRounded fontSize="small" />, stat: 'bookmarks' },
    { label: 'Favorites', href: '/dashboard/favorites', icon: <StarRounded fontSize="small" />, stat: 'favorites' },
    { label: 'Recently added', href: '/dashboard/recent', icon: <AccessTimeRounded fontSize="small" /> },
  ] },
  { title: 'Organize', items: [
    { label: 'Collections', href: '/dashboard/collections', icon: <FolderRounded fontSize="small" />, stat: 'collections' },
    { label: 'Trash', href: '/dashboard/trash', icon: <DeleteOutlineRounded fontSize="small" />, stat: 'trash' },
  ] },
  { title: 'Account', items: [{ label: 'Settings', href: '/dashboard/settings', icon: <SettingsRounded fontSize="small" /> }] },
];

// Every colour the sidebar uses, for each theme. Switching light/dark swaps this whole set.
const tokens = (dark: boolean) => dark ? {
  bg: 'linear-gradient(180deg,#2B2050 0%,#1E1639 55%,#140F28 100%)', ring: 'inset 0 0 0 1px rgba(255,255,255,.07)', shadow: '0 30px 60px -28px rgba(30,15,70,.75)',
  glow1: 'rgba(140,116,196,.5)', glow2: 'rgba(47,179,163,.28)', text: '#fff', muted: 'rgba(255,255,255,.55)', faint: 'rgba(255,255,255,.4)',
  item: 'rgba(255,255,255,.66)', itemHoverBg: 'rgba(255,255,255,.06)', itemHoverText: '#fff',
  activeBg: 'linear-gradient(135deg, rgba(166,143,224,.32), rgba(79,209,192,.10))', activeBorder: 'rgba(255,255,255,.14)', activeText: '#fff',
  tileBg: 'rgba(255,255,255,.06)', tileColor: 'rgba(255,255,255,.78)', tileHoverBg: 'rgba(255,255,255,.12)', tileActiveShadow: '0 6px 16px -6px rgba(155,131,214,.95)',
  barGlow: 'rgba(196,179,238,.9)', barFrom: '#C4B3EE', barTo: '#4FD1C0',
  badgeBg: 'rgba(255,255,255,.12)', badgeText: 'rgba(255,255,255,.88)', badgeActiveBg: '#E9E1FA', badgeActiveText: '#1B1530',
  tipBg: 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))', tipBorder: 'rgba(255,255,255,.1)', tipText: 'rgba(255,255,255,.75)', tipStrong: '#fff', tipIcon: '#FFD58A',
  userBg: 'rgba(255,255,255,.07)', userBorder: 'rgba(255,255,255,.1)', iconBtn: 'rgba(255,255,255,.75)', iconBtnHoverBg: 'rgba(255,255,255,.12)', iconBtnHover: '#fff', avatarRing: '0 0 0 2px rgba(255,255,255,.25)',
  logoShadow: '0 10px 24px -8px rgba(183,163,234,.9), inset 0 1px 0 rgba(255,255,255,.4)',
} : {
  bg: 'linear-gradient(180deg,#FFFFFF 0%,#F4EFFB 100%)', ring: 'inset 0 0 0 1px rgba(103,77,159,.14)', shadow: '0 24px 50px -28px rgba(75,54,128,.35)',
  glow1: 'rgba(140,116,196,.22)', glow2: 'rgba(47,179,163,.14)', text: '#1B1530', muted: '#6B6580', faint: 'rgba(27,21,48,.42)',
  item: '#5E5775', itemHoverBg: 'rgba(103,77,159,.07)', itemHoverText: '#1B1530',
  activeBg: 'linear-gradient(135deg, rgba(103,77,159,.16), rgba(47,179,163,.08))', activeBorder: 'rgba(103,77,159,.22)', activeText: '#3E2C73',
  tileBg: 'rgba(103,77,159,.08)', tileColor: '#674D9F', tileHoverBg: 'rgba(103,77,159,.15)', tileActiveShadow: '0 6px 16px -6px rgba(103,77,159,.6)',
  barGlow: 'rgba(103,77,159,.5)', barFrom: '#674D9F', barTo: '#2FB3A3',
  badgeBg: 'rgba(103,77,159,.1)', badgeText: '#4B3680', badgeActiveBg: '#674D9F', badgeActiveText: '#fff',
  tipBg: 'linear-gradient(135deg, rgba(103,77,159,.08), rgba(47,179,163,.06))', tipBorder: 'rgba(103,77,159,.16)', tipText: '#5E5775', tipStrong: '#1B1530', tipIcon: '#E09A1F',
  userBg: 'rgba(103,77,159,.06)', userBorder: 'rgba(103,77,159,.14)', iconBtn: '#6B6580', iconBtnHoverBg: 'rgba(103,77,159,.1)', iconBtnHover: '#4B3680', avatarRing: '0 0 0 2px rgba(103,77,159,.25)',
  logoShadow: '0 10px 24px -10px rgba(103,77,159,.7), inset 0 1px 0 rgba(255,255,255,.4)',
};
type Tokens = ReturnType<typeof tokens>;

function NavItem({ item, active, count, onClick, c }: { item: Item; active: boolean; count?: number; onClick?: () => void; c: Tokens }) {
  return (
    <Box component={Link} href={item.href} onClick={onClick} sx={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 1.5, p: 1, pr: 1.25, borderRadius: 3.5, textDecoration: 'none', fontSize: 14.5,
      color: active ? c.activeText : c.item, fontWeight: active ? 700 : 500, border: '1px solid', borderColor: active ? c.activeBorder : 'transparent',
      background: active ? c.activeBg : 'transparent', transition: 'all .2s ease',
      '&:hover': { color: c.itemHoverText, background: active ? undefined : c.itemHoverBg, transform: 'translateX(3px)' },
      '&:hover .tile': { background: active ? undefined : c.tileHoverBg },
    }}>
      {active && <Box sx={{ position: 'absolute', left: -9, top: '24%', bottom: '24%', width: 4, borderRadius: 4, background: `linear-gradient(180deg,${c.barFrom},${c.barTo})`, boxShadow: `0 0 14px ${c.barGlow}` }} />}
      <Box className="tile" sx={{ width: 34, height: 34, borderRadius: 2.5, display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all .2s ease',
        color: active ? '#fff' : c.tileColor, background: active ? 'linear-gradient(135deg,#9B83D6,#674D9F)' : c.tileBg, boxShadow: active ? c.tileActiveShadow : 'none' }}>{item.icon}</Box>
      <Box flex={1} minWidth={0}>{item.label}</Box>
      {!!count && <Box sx={{ minWidth: 24, px: 0.9, py: 0.2, borderRadius: 10, fontSize: 11.5, fontWeight: 700, textAlign: 'center', color: active ? c.badgeActiveText : c.badgeText, bgcolor: active ? c.badgeActiveBg : c.badgeBg }}>{count}</Box>}
    </Box>
  );
}

// `rounded` makes it a floating panel on desktop; inside the mobile drawer it fills the edge.
export function SidebarContent({ onNavigate, rounded = false }: { onNavigate?: () => void; rounded?: boolean }) {
  const path = usePathname(); const router = useRouter(); const { user } = useAuth();
  const c = tokens(useTheme().palette.mode === 'dark');   // follows the app's light/dark theme
  const [stats, setStats] = useState<Stats | null>(null);
  const name = user?.displayName || user?.email?.split('@')[0] || 'Your account';
  useEffect(() => { if (user) apiFetch<{ stats: Stats }>('/api/dashboard').then(r => setStats(r.stats)).catch(() => {}); }, [user, path]);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', p: 2, color: c.text, borderRadius: rounded ? 6 : 0,
      background: c.bg, boxShadow: rounded ? `${c.shadow}, ${c.ring}` : 'none', transition: 'background .3s ease',
      '&::before': { content: '""', position: 'absolute', top: -90, left: -70, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${c.glow1}, transparent 70%)`, pointerEvents: 'none' },
      '&::after': { content: '""', position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${c.glow2}, transparent 70%)`, pointerEvents: 'none' } }}>
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Box component={Link} href="/" onClick={onNavigate} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, mb: 2, textDecoration: 'none', color: c.text }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#B7A3EA,#674D9F)', boxShadow: c.logoShadow }}><BookmarkRounded /></Box>
          <Box><Typography fontWeight={800} fontSize={20} letterSpacing="-0.02em" lineHeight={1.1}>LinkVault</Typography><Typography sx={{ fontSize: 11.5, color: c.muted }}>Your link library</Typography></Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.5, mx: -1.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {groups.map(g => (
            <Box key={g.title} mb={2}>
              <Typography sx={{ px: 1, mb: 0.75, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.faint }}>{g.title}</Typography>
              <Box display="grid" gap={0.5}>
                {g.items.map(item => (
                  <NavItem key={item.href} item={item} c={c} onClick={onNavigate} count={item.stat ? stats?.[item.stat] : undefined}
                    active={item.href === '/dashboard' ? path === item.href : path.startsWith(item.href)} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', mt: 1, mb: 1.5, p: 1.5, gap: 1.25, borderRadius: 4, border: '1px solid', borderColor: c.tipBorder, background: c.tipBg, '@media (max-height: 760px)': { display: 'none' } }}>
          <TipsAndUpdatesRounded sx={{ color: c.tipIcon, mt: 0.25 }} fontSize="small" />
          <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: c.tipText }}><b style={{ color: c.tipStrong }}>Quick tip:</b> paste a link and LinkVault fills in the title and description for you.</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 4, background: c.userBg, border: '1px solid', borderColor: c.userBorder, backdropFilter: 'blur(8px)' }}>
          <Avatar src={user?.photoURL ?? undefined} sx={{ width: 38, height: 38, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#9B83D6,#4FD1C0)', boxShadow: c.avatarRing }}>{name[0]?.toUpperCase()}</Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={700} fontSize={13.5} noWrap>{name}</Typography>
            <Typography noWrap sx={{ fontSize: 11.5, color: c.muted }}>{user?.email}</Typography>
          </Box>
          <Tooltip title="Sign out"><IconButton size="small" aria-label="Sign out" sx={{ color: c.iconBtn, '&:hover': { color: c.iconBtnHover, bgcolor: c.iconBtnHoverBg } }}
            onClick={async () => { await signOut(auth); toast.success('Signed out'); router.push('/login'); }}><LogoutRounded fontSize="small" /></IconButton></Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

export function Sidebar() {
  return <Box sx={{ width: 288, flexShrink: 0, p: 1.5, height: '100vh', position: 'sticky', top: 0, display: { xs: 'none', md: 'block' } }}><SidebarContent rounded /></Box>;
}
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { BookmarkRounded, DashboardRounded, StarRounded, FolderRounded, AccessTimeRounded, DeleteOutlineRounded, SettingsRounded, LogoutRounded, TipsAndUpdatesRounded, PeopleRounded, GppMaybeRounded, HistoryRounded, ShieldRounded } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';

type Stats = { bookmarks: number; favorites: number; collections: number; trash: number; openFlags?: number };
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

// Navigation for the super admin panel (same sidebar component, different links)
const adminGroups: { title: string; items: Item[] }[] = [
  { title: 'Manage', items: [
    { label: 'Overview', href: '/admin', icon: <DashboardRounded fontSize="small" /> },
    { label: 'Users', href: '/admin/users', icon: <PeopleRounded fontSize="small" /> },
    { label: 'Moderation', href: '/admin/moderation', icon: <GppMaybeRounded fontSize="small" />, stat: 'openFlags' },
  ] },
  { title: 'Audit', items: [{ label: 'Activity log', href: '/admin/activity', icon: <HistoryRounded fontSize="small" /> }] },
  { title: 'Account', items: [
    { label: 'Settings', href: '/admin/settings', icon: <SettingsRounded fontSize="small" /> },
    { label: 'My vault', href: '/dashboard', icon: <BookmarkRounded fontSize="small" /> },
  ] },
];

// Every colour the sidebar uses, for each theme. Switching light/dark swaps this whole set.
const tokens = (dark: boolean) => dark ? {
  bg: 'linear-gradient(180deg,#0F3B3C 0%,#0B2A2B 55%,#071C1D 100%)', ring: 'inset 0 0 0 1px rgba(255,255,255,.07)', shadow: '0 30px 60px -28px rgba(6,32,33,.75)',
  glow1: 'rgba(63,181,174,.5)', glow2: 'rgba(242,153,74,.28)', text: '#fff', muted: 'rgba(255,255,255,.55)', faint: 'rgba(255,255,255,.4)',
  item: 'rgba(255,255,255,.66)', itemHoverBg: 'rgba(255,255,255,.06)', itemHoverText: '#fff',
  activeBg: 'linear-gradient(135deg, rgba(79,209,197,.32), rgba(255,179,102,.10))', activeBorder: 'rgba(255,255,255,.14)', activeText: '#fff',
  tileBg: 'rgba(255,255,255,.06)', tileColor: 'rgba(255,255,255,.78)', tileHoverBg: 'rgba(255,255,255,.12)', tileActiveShadow: '0 6px 16px -6px rgba(38,166,154,.95)',
  barGlow: 'rgba(139,232,223,.9)', barFrom: '#8BE8DF', barTo: '#FFB366',
  badgeBg: 'rgba(255,255,255,.12)', badgeText: 'rgba(255,255,255,.88)', badgeActiveBg: '#D7F3F0', badgeActiveText: '#0F2022',
  tipBg: 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))', tipBorder: 'rgba(255,255,255,.1)', tipText: 'rgba(255,255,255,.75)', tipStrong: '#fff', tipIcon: '#FFD58A',
  userBg: 'rgba(255,255,255,.07)', userBorder: 'rgba(255,255,255,.1)', iconBtn: 'rgba(255,255,255,.75)', iconBtnHoverBg: 'rgba(255,255,255,.12)', iconBtnHover: '#fff', avatarRing: '0 0 0 2px rgba(255,255,255,.25)',
  logoShadow: '0 10px 24px -8px rgba(122,220,211,.9), inset 0 1px 0 rgba(255,255,255,.4)',
} : {
  bg: 'linear-gradient(180deg,#FFFFFF 0%,#EAF5F4 100%)', ring: 'inset 0 0 0 1px rgba(14,124,123,.14)', shadow: '0 24px 50px -28px rgba(9,94,95,.35)',
  glow1: 'rgba(63,181,174,.22)', glow2: 'rgba(242,153,74,.14)', text: '#0F2022', muted: '#52686A', faint: 'rgba(15,32,34,.42)',
  item: '#46605F', itemHoverBg: 'rgba(14,124,123,.07)', itemHoverText: '#0F2022',
  activeBg: 'linear-gradient(135deg, rgba(14,124,123,.16), rgba(242,153,74,.08))', activeBorder: 'rgba(14,124,123,.22)', activeText: '#0B5655',
  tileBg: 'rgba(14,124,123,.08)', tileColor: '#0E7C7B', tileHoverBg: 'rgba(14,124,123,.15)', tileActiveShadow: '0 6px 16px -6px rgba(14,124,123,.6)',
  barGlow: 'rgba(14,124,123,.5)', barFrom: '#0E7C7B', barTo: '#F2994A',
  badgeBg: 'rgba(14,124,123,.1)', badgeText: '#095E5F', badgeActiveBg: '#0E7C7B', badgeActiveText: '#fff',
  tipBg: 'linear-gradient(135deg, rgba(14,124,123,.08), rgba(242,153,74,.06))', tipBorder: 'rgba(14,124,123,.16)', tipText: '#46605F', tipStrong: '#0F2022', tipIcon: '#E09A1F',
  userBg: 'rgba(14,124,123,.06)', userBorder: 'rgba(14,124,123,.14)', iconBtn: '#52686A', iconBtnHoverBg: 'rgba(14,124,123,.1)', iconBtnHover: '#095E5F', avatarRing: '0 0 0 2px rgba(14,124,123,.25)',
  logoShadow: '0 10px 24px -10px rgba(14,124,123,.7), inset 0 1px 0 rgba(255,255,255,.4)',
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
        color: active ? '#fff' : c.tileColor, background: active ? 'linear-gradient(135deg,#26A69A,#0E7C7B)' : c.tileBg, boxShadow: active ? c.tileActiveShadow : 'none' }}>{item.icon}</Box>
      <Box flex={1} minWidth={0}>{item.label}</Box>
      {!!count && <Box sx={{ minWidth: 24, px: 0.9, py: 0.2, borderRadius: 10, fontSize: 11.5, fontWeight: 700, textAlign: 'center', color: active ? c.badgeActiveText : c.badgeText, bgcolor: active ? c.badgeActiveBg : c.badgeBg }}>{count}</Box>}
    </Box>
  );
}

// `rounded` makes it a floating panel on desktop; inside the mobile drawer it fills the edge.
export function SidebarContent({ onNavigate, rounded = false, variant = 'user' }: { onNavigate?: () => void; rounded?: boolean; variant?: 'user' | 'admin' }) {
  const path = usePathname(); const router = useRouter(); const { user } = useAuth();
  const c = tokens(useTheme().palette.mode === 'dark');   // follows the app's light/dark theme
  const admin = variant === 'admin'; const navGroups = admin ? adminGroups : groups;
  const [stats, setStats] = useState<Stats | null>(null);
  const name = user?.displayName || user?.email?.split('@')[0] || 'Your account';
  useEffect(() => {
    if (!user) return;   // badge counts refresh on every navigation
    if (admin) apiFetch<{ items: unknown[] }>('/api/admin/flags?status=open').then(r => setStats({ bookmarks: 0, favorites: 0, collections: 0, trash: 0, openFlags: r.items.length })).catch(() => {});
    else apiFetch<{ stats: Stats }>('/api/dashboard').then(r => setStats(r.stats)).catch(() => {});
  }, [user, path, admin]);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', p: 2, color: c.text, borderRadius: rounded ? 6 : 0,
      background: c.bg, boxShadow: rounded ? `${c.shadow}, ${c.ring}` : 'none', transition: 'background .3s ease',
      '&::before': { content: '""', position: 'absolute', top: -90, left: -70, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${c.glow1}, transparent 70%)`, pointerEvents: 'none' },
      '&::after': { content: '""', position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${c.glow2}, transparent 70%)`, pointerEvents: 'none' } }}>
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Box component={Link} href="/" onClick={onNavigate} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, mb: 2, textDecoration: 'none', color: c.text }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg,#7ADCD3,#0E7C7B)', boxShadow: c.logoShadow }}>{admin ? <ShieldRounded /> : <BookmarkRounded />}</Box>
          <Box><Typography fontWeight={800} fontSize={20} letterSpacing="-0.02em" lineHeight={1.1}>LinkVault</Typography><Typography sx={{ fontSize: 11.5, color: c.muted }}>{admin ? 'Super admin' : 'Your link library'}</Typography></Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.5, mx: -1.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {navGroups.map(g => (
            <Box key={g.title} mb={2}>
              <Typography sx={{ px: 1, mb: 0.75, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: c.faint }}>{g.title}</Typography>
              <Box display="grid" gap={0.5}>
                {g.items.map(item => (
                  <NavItem key={item.href} item={item} c={c} onClick={onNavigate} count={item.stat ? stats?.[item.stat] : undefined}
                    active={item.href === '/dashboard' || item.href === '/admin' ? path === item.href : path.startsWith(item.href)} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', mt: 1, mb: 1.5, p: 1.5, gap: 1.25, borderRadius: 4, border: '1px solid', borderColor: c.tipBorder, background: c.tipBg, '@media (max-height: 760px)': { display: 'none' } }}>
          <TipsAndUpdatesRounded sx={{ color: c.tipIcon, mt: 0.25 }} fontSize="small" />
          <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: c.tipText }}>{admin ? <><b style={{ color: c.tipStrong }}>Reminder:</b> review the Moderation queue regularly and act on open flags.</> : <><b style={{ color: c.tipStrong }}>Quick tip:</b> paste a link and LinkVault fills in the title and description for you.</>}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 4, background: c.userBg, border: '1px solid', borderColor: c.userBorder, backdropFilter: 'blur(8px)' }}>
          <Avatar src={user?.photoURL ?? undefined} sx={{ width: 38, height: 38, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#26A69A,#FFB366)', boxShadow: c.avatarRing }}>{name[0]?.toUpperCase()}</Avatar>
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

export function Sidebar({ variant = 'user' }: { variant?: 'user' | 'admin' }) {
  return <Box sx={{ width: 288, flexShrink: 0, p: 1.5, height: '100vh', position: 'sticky', top: 0, display: { xs: 'none', md: 'block' } }}><SidebarContent rounded variant={variant} /></Box>;
}
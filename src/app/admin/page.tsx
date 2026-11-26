'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { PeopleRounded, PersonAddAlt1Rounded, BlockRounded, BookmarkRounded, FolderRounded, GppMaybeRounded, BoltRounded, ArrowForwardRounded } from '@mui/icons-material';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { SeverityChip, StatCard, TypeChip, ago, errMsg } from '@/components/admin/ui';
import { Loader } from '@/components/common/Loader';
import { apiFetch } from '@/lib/api-client';

type Stats = { users: number; suspended: number; newLast7Days: number; signups: { date: string; count: number }[]; bookmarks: number; collections: number; openFlags: number; activity24h: number; recentActivity: any[]; recentFlags: any[] };

export default function AdminOverview() {
  const router = useRouter(); const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { apiFetch<Stats>('/api/admin/stats').then(setS).catch(e => toast.error(errMsg(e))); }, []);
  const max = Math.max(1, ...(s?.signups.map(d => d.count) ?? [1]));
  return (
    <AdminShell title="Overview" subtitle="Everything happening across LinkVault">
      {!s ? <Loader label="Loading statistics…" /> : (
        <Box display="grid" gap={3}>
          <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }}>
            <StatCard label="Total users" value={s.users} icon={<PeopleRounded />} color="#0E7C7B" onClick={() => router.push('/admin/users')} />
            <StatCard label="New in 7 days" value={s.newLast7Days} icon={<PersonAddAlt1Rounded />} color="#3B82F6" />
            <StatCard label="Suspended" value={s.suspended} icon={<BlockRounded />} color="#E5484D" onClick={() => router.push('/admin/users')} />
            <StatCard label="Open policy flags" value={s.openFlags} icon={<GppMaybeRounded />} color={s.openFlags ? '#E5484D' : '#2BB3A8'} onClick={() => router.push('/admin/moderation')} />
            <StatCard label="Bookmarks saved" value={s.bookmarks} icon={<BookmarkRounded />} color="#0E7C7B" />
            <StatCard label="Collections" value={s.collections} icon={<FolderRounded />} color="#F2994A" />
            <StatCard label="Actions in 24h" value={s.activity24h} icon={<BoltRounded />} color="#8B5CF6" onClick={() => router.push('/admin/activity')} />
          </Box>
          <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', lg: '1fr 1fr' }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
              <Typography fontWeight={800} mb={2}>Sign-ups, last 7 days</Typography>
              <Stack direction="row" alignItems="flex-end" spacing={1.5} height={150}>
                {s.signups.map(d => (
                  <Stack key={d.date} flex={1} alignItems="center" justifyContent="flex-end" height="100%" spacing={0.5}>
                    <Typography variant="caption" fontWeight={700}>{d.count}</Typography>
                    <Box sx={{ width: '100%', maxWidth: 38, height: `${Math.max(4, (d.count / max) * 100)}%`, borderRadius: 1.5, backgroundImage: 'linear-gradient(180deg,#3FB5AE,#0E7C7B)' }} />
                    <Typography variant="caption" color="text.secondary">{d.date.slice(5)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}><Typography fontWeight={800}>Needs review</Typography><Button component={Link} href="/admin/moderation" size="small" endIcon={<ArrowForwardRounded />}>Open queue</Button></Stack>
              {s.recentFlags.length === 0 ? <Typography color="text.secondary" variant="body2">No open flags. Nothing suspicious right now.</Typography> : s.recentFlags.map(f => (
                <Stack key={f.id} direction="row" spacing={1.5} alignItems="center" py={1} sx={{ borderTop: 1, borderColor: 'divider' }}>
                  <SeverityChip s={f.severity} />
                  <Box minWidth={0} flex={1}><Typography variant="body2" fontWeight={700} noWrap>{f.domain}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block">{f.email} · {ago(f.createdAt)}</Typography></Box>
                  {f.categories?.slice(0, 1).map((c: string) => <Chip key={c} size="small" label={c} />)}
                </Stack>
              ))}
            </Paper>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 4,
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              gap={1}
            >
              <Typography fontWeight={800} fontSize={{ xs: 15, sm: 17 }}>
                Latest activity
              </Typography>

              <Button
                component={Link}
                href="/admin/activity"
                size="small"
                endIcon={<ArrowForwardRounded />}
                sx={{ flexShrink: 0 }}
              >
                View all
              </Button>
            </Stack>

            {s.recentActivity.map((a) => (
              <Box
                key={a.id}
                sx={{
                  py: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  minWidth: 0,
                }}
              >
                {/* Desktop and mobile header */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                  mb={{ xs: 0.75, sm: 0 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <TypeChip type={a.type} />
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      fontSize: { xs: 10, sm: 12 },
                    }}
                  >
                    {ago(a.createdAt)}
                  </Typography>
                </Stack>

                {/* User and activity details */}
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 0,
                    overflowWrap: 'anywhere',
                    lineHeight: 1.6,
                  }}
                >
                  <Box component="b" sx={{ fontWeight: 700 }}>
                    {a.email ?? a.uid}
                  </Box>

                  {a.details && (
                    <Box component="span" color="text.secondary">
                      {' · '}{a.details}
                    </Box>
                  )}
                </Typography>
              </Box>
            ))}

            {s.recentActivity.length === 0 && (
              <Typography
                color="text.secondary"
                variant="body2"
                textAlign="center"
                py={3}
              >
                No recent activity found.
              </Typography>
            )}
          </Paper>

        </Box>
      )}
    </AdminShell>
  );
}

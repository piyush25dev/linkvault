
'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  BookmarkRounded,
  MenuRounded,
  AutoAwesomeRounded,
  SearchRounded,
  FolderRounded,
  StarRounded,
  DarkModeRounded,
  LockRounded,
  ArrowForwardRounded,
  DashboardRounded,
} from '@mui/icons-material';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/context/AuthContext';

function LandingHeader() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { user } = useAuth();

  const close = () => setAnchor(null);
  const isLoggedIn = !!user;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1}
      py={{ xs: 2, md: 3 }}
    >
      {/* Logo */}
      <Stack
        component={Link}
        href="/"
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{
          textDecoration: 'none',
          color: 'text.primary',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: { xs: 34, sm: 38 },
            height: { xs: 34, sm: 38 },
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            backgroundImage: 'linear-gradient(135deg,#3FB5AE,#095E5F)',
            boxShadow: '0 5px 15px rgba(9,94,95,.25)',
          }}
        >
          <BookmarkRounded fontSize="small" />
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          noWrap
          sx={{
            fontSize: { xs: 19, sm: 22 },
            letterSpacing: '-0.7px',
          }}
        >
          LinkVault
        </Typography>
      </Stack>

      {/* Desktop Navigation */}
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        <ThemeToggle />

        {isLoggedIn ? (
          <Button
            component={Link}
            href="/dashboard"
            variant="contained"
            startIcon={<DashboardRounded />}
          >
            Go to Dashboard
          </Button>
        ) : (
          <>
            <Button component={Link} href="/login" color="inherit">
              Log in
            </Button>

            <Button
              component={Link}
              href="/register"
              variant="contained"
            >
              Get started
            </Button>
          </>
        )}
      </Stack>

      {/* Mobile Navigation */}
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        sx={{ display: { xs: 'flex', sm: 'none' } }}
      >
        <ThemeToggle />

        <IconButton
          aria-label="Open navigation menu"
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <MenuRounded />
        </IconButton>

        <Menu
  anchorEl={anchor}
  open={Boolean(anchor)}
  onClose={close}
  anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'right',
  }}
  transformOrigin={{
    vertical: 'top',
    horizontal: 'right',
  }}
  slotProps={{
    paper: {
      sx: {
        minWidth: 185,
        mt: 1,
      },
    },
  }}
>
  {isLoggedIn
    ? [
        <MenuItem
          key="dashboard"
          component={Link}
          href="/dashboard"
          onClick={close}
        >
          <DashboardRounded sx={{ mr: 1.5, fontSize: 20 }} />
          Dashboard
        </MenuItem>,
      ]
    : [
        <MenuItem
          key="login"
          component={Link}
          href="/login"
          onClick={close}
        >
          Log in
        </MenuItem>,

        <MenuItem
          key="register"
          component={Link}
          href="/register"
          onClick={close}
          sx={{
            fontWeight: 700,
            color: 'primary.main',
          }}
        >
          Get started
        </MenuItem>,
      ]}
</Menu>
      </Stack>
    </Stack>
  );
}

const features = [
  {
    icon: <AutoAwesomeRounded />,
    title: 'Smart saving',
    description:
      'Paste a URL and LinkVault fetches the title, description and icon for you.',
  },
  {
    icon: <FolderRounded />,
    title: 'Collections',
    description:
      'Group links by project or topic. Deleting a collection never deletes your links.',
  },
  {
    icon: <SearchRounded />,
    title: 'Instant search',
    description:
      'Search by title, URL or description, then sort and filter in a click.',
  },
  {
    icon: <StarRounded />,
    title: 'Favorites',
    description:
      'Star what matters so your best links are always one tap away.',
  },
  {
    icon: <DarkModeRounded />,
    title: 'Light and dark',
    description:
      'A polished theme for day and night that remembers your choice.',
  },
  {
    icon: <LockRounded />,
    title: 'Private by design',
    description:
      'Your bookmarks belong to your account, and nobody else can read them.',
  },
];

const demo = [
  {
    title: 'Next.js Documentation',
    domain: 'nextjs.org',
    category: 'Development',
  },
  {
    title: 'Refactoring UI',
    domain: 'refactoringui.com',
    category: 'Design',
  },
  {
    title: 'Firebase Console',
    domain: 'firebase.google.com',
    category: 'Tools',
  },
];

export default function Home() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Container maxWidth="lg">
        <LandingHeader />

        {/* Hero Section */}
        <Box
          sx={{
            pt: { xs: 7, sm: 9, md: 12 },
            pb: { xs: 7, md: 10 },
            textAlign: 'center',
            maxWidth: 850,
            mx: 'auto',
          }}
        >
          <Chip
            icon={<AutoAwesomeRounded sx={{ fontSize: 17 }} />}
            label="Your personal corner of the internet"
            color="primary"
            variant="outlined"
            sx={{
              mb: 3,
              bgcolor: (theme) =>
                alpha(theme.palette.primary.main, 0.08),
              fontWeight: 600,
              height: 34,
            }}
          />

          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              fontSize: {
                xs: '2.5rem',
                sm: '3.5rem',
                md: '4.5rem',
              },
              lineHeight: 1.08,
              letterSpacing: '-0.055em',
              textWrap: 'balance',
            }}
          >
            Every link worth keeping,{' '}
            <Box
              component="span"
              sx={{
                backgroundImage:
                  'linear-gradient(135deg,#3FB5AE,#0E7C7B 50%,#F2994A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              in one place.
            </Box>
          </Typography>

          <Typography
            color="text.secondary"
            fontSize={{ xs: 15, sm: 17, md: 19 }}
            mt={3}
            mx="auto"
            maxWidth={620}
            sx={{ lineHeight: 1.8 }}
          >
            Save websites, organize them into collections, and find
            exactly what you need in seconds. Your entire web,
            beautifully organized.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="center"
            alignItems="stretch"
            spacing={1.75}
            mt={4.5}
            sx={{
              '& .MuiButton-root': {
                py: 1.5,
                px: 3.5,
                minHeight: 48,
                width: { xs: '100%', sm: 'auto' },
              },
            }}
          >
            {isLoggedIn ? (
              <Button
                component={Link}
                href="/dashboard"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRounded />}
              >
                Open your dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardRounded />}
                >
                  Create your free vault
                </Button>

                <Button
                  component={Link}
                  href="/login"
                  size="large"
                  color="inherit"
                  variant="outlined"
                >
                  I have an account
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* Product Preview */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 2.5, md: 3 },
            borderRadius: { xs: 3, sm: 5 },
            maxWidth: 950,
            mx: 'auto',
            boxShadow: '0 40px 80px -40px rgba(14,124,123,.5)',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2.5}
            px={0.5}
          >
            <Typography fontWeight={800}>
              Your saved links
            </Typography>

            <Chip
              label="Preview"
              size="small"
              color="primary"
              variant="outlined"
            />
          </Stack>

          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2,1fr)',
              md: 'repeat(3,1fr)',
            }}
          >
            {demo.map((item, index) => (
              <Paper
                key={item.title}
                variant="outlined"
                sx={{
                  p: 2.25,
                  borderRadius: 3.5,
                  minWidth: 0,
                  transition: 'all .25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  mb={2}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      color: 'primary.main',
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.14),
                    }}
                  >
                    {item.title[0]}
                  </Box>

                  <Box minWidth={0} flex={1}>
                    <Typography fontWeight={700} noWrap>
                      {item.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {item.domain}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Chip
                    size="small"
                    label={item.category}
                    color="primary"
                    variant="outlined"
                  />

                  <StarRounded
                    sx={{
                      color:
                        index === 0
                          ? 'warning.main'
                          : 'text.disabled',
                    }}
                    fontSize="small"
                  />
                </Stack>
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* Features */}
        <Box py={{ xs: 8, md: 12 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            textAlign="center"
            mb={1.5}
            sx={{
              fontSize: { xs: 26, sm: 32, md: 38 },
              letterSpacing: '-0.035em',
            }}
          >
            Everything you need, nothing you don't
          </Typography>

          <Typography
            color="text.secondary"
            textAlign="center"
            mb={5}
            maxWidth={550}
            mx="auto"
          >
            A calm, fast home for the links you actually want to
            find again.
          </Typography>

          <Box
            display="grid"
            gap={{ xs: 2, md: 2.5 }}
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2,1fr)',
              md: 'repeat(3,1fr)',
            }}
          >
            {features.map((feature) => (
              <Paper
                key={feature.title}
                variant="outlined"
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 4,
                  transition: 'all .25s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    borderColor: 'primary.main',
                    boxShadow: (theme) =>
                      `0 12px 30px ${alpha(
                        theme.palette.primary.main,
                        0.12
                      )}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main',
                    bgcolor: (theme) =>
                      alpha(theme.palette.primary.main, 0.12),
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>

                <Typography fontWeight={800} mb={0.75}>
                  {feature.title}
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body2"
                  lineHeight={1.8}
                >
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Final CTA */}
        <Box
          sx={{
            p: { xs: 3.5, sm: 5, md: 7 },
            mb: { xs: 5, md: 8 },
            borderRadius: { xs: 4, md: 6 },
            textAlign: 'center',
            color: '#fff',
            backgroundImage:
              'linear-gradient(135deg,#064B4C,#0E7C7B 55%,#3FB5AE)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              fontSize: { xs: 26, sm: 32, md: 38 },
              letterSpacing: '-0.035em',
            }}
          >
            Ready to tidy up your tabs?
          </Typography>

          <Typography
            sx={{
              opacity: 0.85,
              mt: 1.5,
              mb: 3.5,
              fontSize: { xs: 14, sm: 16 },
            }}
          >
            Create your vault in under a minute. It's free.
          </Typography>

          <Button
            component={Link}
            href={isLoggedIn ? '/dashboard' : '/register'}
            size="large"
            endIcon={<ArrowForwardRounded />}
            sx={{
              bgcolor: '#fff',
              color: '#095E5F',
              px: 4,
              py: 1.4,
              '&:hover': {
                bgcolor: '#E4F4F2',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {isLoggedIn ? 'Open dashboard' : 'Get started'}
          </Button>
        </Box>

        {/* Footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
          pb={4}
        >
          © {new Date().getFullYear()} LinkVault. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

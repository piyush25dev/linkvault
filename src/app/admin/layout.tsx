'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader } from '@/components/common/Loader';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { isAdminEmail } from '@/lib/admin-config';

// Client check for UX only. Every /api/admin route re-verifies the super admin on the server.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); const router = useRouter(); const [ok, setOk] = useState(false);
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isAdminEmail(user.email)) { router.replace('/dashboard'); return; }
    user.getIdToken(true)   // refresh so the freshly set admin claim is in the token
      .then(() => apiFetch('/api/admin/me')).then(() => setOk(true))
      .catch(() => { toast.error('Super admin access required. Run "npm run seed:admin" first.'); router.replace('/dashboard'); });
  }, [loading, user, router]);
  if (!ok) return <Loader fullScreen label="Checking admin access…" />;
  return <>{children}</>;
}

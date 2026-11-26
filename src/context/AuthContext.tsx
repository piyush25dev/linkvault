'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { apiFetch } from '@/lib/api-client';
import { isAdminEmail } from '@/lib/admin-config';
const AuthContext = createContext<{ user: User | null; loading: boolean; isSuperAdmin: boolean }>({ user: null, loading: true, isSuperAdmin: false });
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, value => {
    setUser(value); setLoading(false);
    if (!value) { sessionStorage.removeItem('lv-session'); return; }
    if (sessionStorage.getItem('lv-session')) return;   // record each browser session once: keeps the profile fresh and logs the login for the admin
    sessionStorage.setItem('lv-session', '1');
    apiFetch<{ warnings: number; lastWarning: string | null }>('/api/session', { method: 'POST', body: '{}' })
      .then(r => { if (r.warnings && r.lastWarning) toast.warning(`Notice from LinkVault admin: ${r.lastWarning}`, { duration: 12000 }); }).catch(() => {});
  }), []);
  return <AuthContext.Provider value={{ user, loading, isSuperAdmin: isAdminEmail(user?.email) }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

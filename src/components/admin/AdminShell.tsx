'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';

// The admin panel uses the same shell and sidebar as the user dashboard, with the admin navigation.
export function AdminShell(props: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <DashboardShell variant="admin" {...props} />;
}

import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookmarkManager } from '@/components/bookmarks/BookmarkManager';

export default function Page() {
  return <DashboardShell title="Trash" subtitle="Restore or permanently delete"><BookmarkManager filter="trash" /></DashboardShell>;
}

import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookmarkManager } from '@/components/bookmarks/BookmarkManager';

export default function Page() {
  return <DashboardShell title="All bookmarks" subtitle="Everything you've saved"><BookmarkManager filter="all" /></DashboardShell>;
}

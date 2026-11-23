import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookmarkManager } from '@/components/bookmarks/BookmarkManager';

export default function Page() {
  return <DashboardShell title="Favorites" subtitle="Your starred links"><BookmarkManager filter="favorites" /></DashboardShell>;
}

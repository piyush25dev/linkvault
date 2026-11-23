import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookmarkManager } from '@/components/bookmarks/BookmarkManager';

export default function Page() {
  return <DashboardShell title="Recently added" subtitle="Your latest saves"><BookmarkManager filter="recent" /></DashboardShell>;
}

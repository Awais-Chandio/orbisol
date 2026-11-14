/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { AppHeader } from '@/views/components/AppHeader';
import { BottomNav } from '@/views/components/BottomNav';
import { JudgmentNotice } from '@/views/components/JudgmentNotice';
import { OfflineBanner } from '@/views/components/OfflineBanner';

export function AppLayout() {
  // The overview carries its own judgment line, so the shared notice is not repeated there.
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <AppHeader />
      <OfflineBanner />
      <main className="app-main container">
        <Outlet />
        {pathname !== '/overview' && <JudgmentNotice />}
      </main>
      <BottomNav />
      <ScrollRestoration />
    </div>
  );
}

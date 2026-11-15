/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { AppHeader } from '@/views/components/AppHeader';
import { BottomNav } from '@/views/components/BottomNav';
import { JudgmentNotice } from '@/views/components/JudgmentNotice';
import { NextStep } from '@/views/components/NextStep';
import { ScienceProvider } from '@/views/components/Science';
import { useFieldStore } from '@/stores/fieldStore';
import { OfflineBanner } from '@/views/components/OfflineBanner';
import { TourProvider } from '@/views/tour/Tour';

export function AppLayout() {
  // The overview carries its own judgment line, so the shared notice is not repeated there.
  const { pathname } = useLocation();
  const pinned = useFieldStore((s) => s.pin !== null);
  return (
    <ScienceProvider>
    <TourProvider>
    <div className="app-shell">
      <AppHeader />
      <OfflineBanner />
      <main className="app-main container">
        <Outlet />
        {pinned && pathname !== '/report' && <NextStep pathname={pathname} />}
        {pathname !== '/overview' && pathname !== '/report' && <JudgmentNotice />}
      </main>
      <BottomNav />
      <ScrollRestoration />
    </div>
    </TourProvider>
    </ScienceProvider>
  );
}

/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/views/components/AppHeader';
import { BottomNav } from '@/views/components/BottomNav';
import { JudgmentNotice } from '@/views/components/JudgmentNotice';
import { OfflineBanner } from '@/views/components/OfflineBanner';

export function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <OfflineBanner />
      <main className="app-main container">
        <Outlet />
        <JudgmentNotice />
      </main>
      <BottomNav />
    </div>
  );
}

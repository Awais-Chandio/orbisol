/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { FieldScreen } from '@/views/screens/FieldScreen';
import { AboutScreen } from '@/views/screens/AboutScreen';
import { SeasonScreen } from '@/views/screens/SeasonScreen';
import { FarmScreen } from '@/views/screens/FarmScreen';
import { RotationsScreen } from '@/views/screens/RotationsScreen';
import { CalendarScreen } from '@/views/screens/CalendarScreen';
import { OverviewScreen } from '@/views/screens/OverviewScreen';
import { useFieldStore } from '@/stores/fieldStore';

/** Landing: the overview once a field is pinned, otherwise the field picker. */
function Landing() {
  const pinned = useFieldStore((s) => s.pin !== null);
  return <Navigate to={pinned ? '/overview' : '/field'} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'field', element: <FieldScreen /> },
      { path: 'overview', element: <OverviewScreen /> },
      { path: 'farm', element: <FarmScreen /> },
      { path: 'season', element: <SeasonScreen /> },
      { path: 'rotations', element: <RotationsScreen /> },
      { path: 'calendar', element: <CalendarScreen /> },
      { path: 'about', element: <AboutScreen /> },
      { path: '*', element: <Landing /> },
    ],
  },
]);

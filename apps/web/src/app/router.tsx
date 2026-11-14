/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { FieldScreen } from '@/views/screens/FieldScreen';
import { AboutScreen } from '@/views/screens/AboutScreen';
import { SeasonScreen } from '@/views/screens/SeasonScreen';
import { FarmScreen } from '@/views/screens/FarmScreen';
import { RotationsScreen } from '@/views/screens/RotationsScreen';
import { CalendarScreen } from '@/views/screens/CalendarScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <FieldScreen /> },
      { path: 'farm', element: <FarmScreen /> },
      { path: 'season', element: <SeasonScreen /> },
      { path: 'rotations', element: <RotationsScreen /> },
      { path: 'calendar', element: <CalendarScreen /> },
      { path: 'about', element: <AboutScreen /> },
      { path: '*', element: <FieldScreen /> },
    ],
  },
]);

/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { FieldScreen } from '@/views/screens/FieldScreen';
import { PlaceholderScreen } from '@/views/screens/PlaceholderScreen';
import { AboutScreen } from '@/views/screens/AboutScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <FieldScreen /> },
      { path: 'farm', element: <PlaceholderScreen screen="farm" /> },
      { path: 'season', element: <PlaceholderScreen screen="season" /> },
      { path: 'rotations', element: <PlaceholderScreen screen="rotations" /> },
      { path: 'calendar', element: <PlaceholderScreen screen="calendar" /> },
      { path: 'about', element: <AboutScreen /> },
      { path: '*', element: <FieldScreen /> },
    ],
  },
]);

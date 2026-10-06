import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { seedGuideSnapshot } from '@/lib/guide-snapshot';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

// The Upper East Horology atelier theme is a flat black/turquoise/silver
// dark surface — apply the design system's dark token set globally.
document.documentElement.classList.add('dark');

const client = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});
const snapshot = document.getElementById('published-guide-snapshot');
if (snapshot?.textContent) seedGuideSnapshot(client, JSON.parse(snapshot.textContent));

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App client={client} />
  </ErrorBoundary>,
);

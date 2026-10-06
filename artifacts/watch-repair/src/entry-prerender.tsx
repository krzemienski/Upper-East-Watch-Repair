import { renderToString } from 'react-dom/server';
import { QueryClient } from '@tanstack/react-query';
import type { Guide } from '@workspace/api-client-react';
import App from './App';
import { PageMetaCollector, type PageMetaProps } from './components/PageMeta';
import { seedGuideSnapshot } from './lib/guide-snapshot';

export function renderPage(path: string, guides: Guide[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  seedGuideSnapshot(client, guides);
  let metadata: PageMetaProps | undefined;
  const body = renderToString(
    <PageMetaCollector.Provider value={(meta) => { metadata = meta; }}>
      <App ssrPath={path} client={client} />
    </PageMetaCollector.Provider>,
  );
  client.clear();
  if (!metadata) throw new Error(`No page metadata emitted for ${path}`);
  if (!/<h1[\s>]/.test(body)) throw new Error(`No primary heading rendered for ${path}`);
  return { body, metadata };
}

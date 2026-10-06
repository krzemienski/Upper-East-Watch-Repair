import { QueryClient } from '@tanstack/react-query';
import {
  getListPublishedGuidesQueryKey,
  getGetPublishedGuideQueryKey,
  type Guide,
} from '@workspace/api-client-react';

/** Shared boot path keeps articles present while the live API refreshes them. */
export function seedGuideSnapshot(client: QueryClient, guides: Guide[]) {
  client.setQueryData(getListPublishedGuidesQueryKey(), guides);
  for (const guide of guides) client.setQueryData(getGetPublishedGuideQueryKey(guide.slug), guide);
}

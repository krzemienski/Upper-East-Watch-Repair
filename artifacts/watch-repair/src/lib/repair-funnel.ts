import { trackEvent } from './analytics';

export type FunnelVariant = 'consultation' | 'diagnosis';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const VARIANT_KEY = 'uewr_repair_variant';
const CTA_KEY = 'uewr_repair_cta';
const ATTRIBUTION_KEY = 'uewr_repair_attribution';

export function getRepairVariant(): FunnelVariant {
  const saved = localStorage.getItem(VARIANT_KEY);
  if (saved === 'consultation' || saved === 'diagnosis') return saved;
  const variant: FunnelVariant = Math.random() < 0.5 ? 'consultation' : 'diagnosis';
  localStorage.setItem(VARIANT_KEY, variant);
  return variant;
}

export function selectRepairCta(cta: string) {
  sessionStorage.setItem(CTA_KEY, cta);
  trackFunnelEvent('cta_clicked', { cta });
}

export function getAttribution() {
  const query = new URLSearchParams(window.location.search);
  let saved: Record<string, string | undefined> = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || '{}') as Record<string, string | undefined>;
  } catch {
    saved = {};
  }
  const campaign = {
    source: query.get('source') || query.get('utm_source') || saved.source || 'direct',
    referrer: saved.referrer || document.referrer || undefined,
    utmSource: query.get('utm_source') || saved.utmSource || undefined,
    utmMedium: query.get('utm_medium') || saved.utmMedium || undefined,
    utmCampaign: query.get('utm_campaign') || saved.utmCampaign || undefined,
    utmTerm: query.get('utm_term') || saved.utmTerm || undefined,
    utmContent: query.get('utm_content') || saved.utmContent || undefined,
  };
  sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(campaign));
  return {
    ...campaign,
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    variant: getRepairVariant(),
    selectedCta: sessionStorage.getItem(CTA_KEY) || undefined,
  };
}

export function trackFunnelEvent(event: string, properties: Record<string, unknown> = {}) {
  // Only explicitly approved dimensions go to third-party analytics.
  // Never forward lead IDs, query strings, referrers, or arbitrary form values.
  const analyticsData: Record<string, string | number | boolean> = {};
  try {
    analyticsData.variant = getRepairVariant();
  } catch {
    // Restricted browser storage must not block tracking or submission.
  }
  if (typeof properties.cta === 'string' &&
      ['call', 'call_request', 'online_intake', 'directions', 'directions_footer'].includes(properties.cta)) {
    analyticsData.cta = properties.cta;
  }
  if (typeof properties.inStore === 'boolean') analyticsData.in_store = properties.inStore;
  if (typeof properties.imageCount === 'number') analyticsData.photo_count = properties.imageCount;
  trackEvent(event, analyticsData);
  try {
  const attribution = getAttribution();
  const body = JSON.stringify({
    event,
    ...attribution,
    metadata: { ...properties, path: window.location.pathname },
  });
  try {
    window.gtag?.('event', event, analyticsData);
  } catch {
    // Google Analytics failures must not block the database event.
  }
  void fetch('/api/funnel-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
  } catch {
    // Storage restrictions and analytics failures must not affect the form.
  }
}
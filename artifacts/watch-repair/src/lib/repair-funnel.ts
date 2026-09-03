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
  const attribution = getAttribution();
  const body = JSON.stringify({
    event,
    ...attribution,
    metadata: { ...properties, path: window.location.pathname },
  });
  window.gtag?.('event', event, {
    ...properties,
    source: attribution.source,
    campaign: attribution.utmCampaign,
    variant: attribution.variant,
    selected_cta: attribution.selectedCta,
    page_path: window.location.pathname,
  });
  void fetch('/api/funnel-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
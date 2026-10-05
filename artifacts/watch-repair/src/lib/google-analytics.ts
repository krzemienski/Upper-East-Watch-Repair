/**
 * GA4 owns initial/history page_view events. Keep enhanced-measurement history
 * page views ON; this module NEVER emits page_view or disables send_page_view.
 * Disable enhanced outbound clicks, file downloads, form interactions and scrolls
 * in the stream: their built-in raw link/form parameters bypass this allowlist.
 * URL/referrer overrides are best effort for Google's automatic events: Google's
 * event-scoped history parameters can take precedence over global `set` values.
 * Verify actual production collect requests; the custom-event allowlist alone
 * is not a guarantee about automatically collected pageviews/engagement events.
 * Consent gap: analytics storage is unchanged; this is not a consent manager.
 * https://developers.google.com/analytics/devguides/collection/ga4/views
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/config
 * https://developers.google.com/tag-platform/gtagjs/reference#parameter_precedence
 * https://developers.google.com/tag-platform/gtagjs/configure
 */
export const GOOGLE_MEASUREMENT_ID = 'G-CHF9G5PYE4';
export const GOOGLE_DEBUG_STORAGE_KEY = 'uewr_ga_debug';

const PRODUCTION_HOSTS = new Set([
  'uppereastwatchrepair.com',
  'www.uppereastwatchrepair.com',
  'upper-east-watch-repair.replit.app',
]);
const PUBLIC_ROUTES = {
  '/': 'home',
  '/about': 'about',
  '/book': 'booking',
  '/repair': 'repair',
  '/repair/intake': 'repair_intake',
  '/repair/intake/in-store': 'repair_intake_in_store',
  '/services/watch-repair': 'watch_repair',
  '/services/battery-replacement': 'battery_replacement',
  '/services/jewelry-repair': 'jewelry_repair',
  '/guides': 'guides',
} as const;

export type PublicPageType = typeof PUBLIC_ROUTES[keyof typeof PUBLIC_ROUTES] | 'guide';
export interface PublicAnalyticsRoute {
  page_path: string;
  page_type: PublicPageType;
}
export type GoogleEventName =
  | 'page_visit' | 'navigation_click' | 'contact_click' | 'outbound_link_clicked'
  | 'download_clicked' | 'action_click' | 'faq_expanded' | 'scroll_depth'
  | 'cta_clicked' | 'repair_landing_viewed' | 'repair_intake_viewed'
  | 'repair_form_started' | 'repair_form_submitted' | 'repair_form_error'
  | 'repair_lead_submitted' | 'repair_lead_created' | 'photo_uploaded'
  | 'booking_page_viewed' | 'booking_embed_loaded' | 'booking_embed_failed'
  | 'booking_started' | 'booking_completed'
  | 'in_store_intake_started' | 'repair_intake_started' | 'repair_intake_submitted'
  | 'repair_photos_attached' | 'repair_photos_failed' | 'repair_photos_retry_clicked'
  | 'repair_form_abandoned' | 'repair_service_selected' | 'repair_contact_method_selected'
  | 'repair_photo_rejected' | 'repair_photos_selected' | 'repair_photo_removed'
  | 'repair_form_submit_attempt' | 'repair_form_validation_error' | 'repair_form_submit_failed'
  | 'generate_lead' | 'site_error' | 'site_error_retry'
  | 'booking_page_view' | 'booking_embed_viewed' | 'booking_link_clicked'
  | 'booking_error' | 'booking_success';

/** Only approved primitive dimensions. No text, contact details, IDs or form data. */
export interface GoogleEventParams {
  page_type?: PublicPageType;
  page_path?: string;
  destination_path?: string;
  location?: 'nav' | 'footer' | 'body';
  contact_method?: 'phone' | 'sms' | 'email' | 'directions';
  external_host?: string;
  file_extension?: string;
  action_id?: string;
  faq_id?: string;
  percent_scrolled?: 25 | 50 | 75 | 90;
  variant?: 'consultation' | 'diagnosis';
  cta?: 'call' | 'call_request' | 'online_intake' | 'directions' | 'directions_footer';
  in_store?: boolean;
  photo_count?: number;
  form_id?: 'online_repair' | 'in_store_repair';
  service_type?: 'diagnosis' | 'battery' | 'mechanical' | 'crystal_case' | 'bracelet' | 'restoration' | 'other';
  error_type?: 'too_large' | 'unsupported_type' | 'missing_upload_authorization' |
    'required_fields' | 'invalid_field' | 'submission_failed' | 'render_failed' |
    'embed_failed' | 'not_configured' | 'load_failed' | 'timeout';
  booking_provider?: 'cal';
  configured?: boolean;
  fatal?: boolean;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    'ga-disable-G-CHF9G5PYE4'?: boolean;
  }
}

const EVENT_NAMES = new Set<string>([
  'page_visit', 'navigation_click', 'contact_click', 'outbound_link_clicked',
  'download_clicked', 'action_click', 'faq_expanded', 'scroll_depth', 'cta_clicked',
  'repair_landing_viewed', 'repair_intake_viewed', 'repair_form_started',
  'repair_form_submitted', 'repair_form_error', 'repair_lead_submitted',
  'repair_lead_created', 'photo_uploaded', 'booking_page_viewed',
  'booking_embed_loaded', 'booking_embed_failed', 'booking_started', 'booking_completed',
  'in_store_intake_started', 'repair_intake_started', 'repair_intake_submitted',
  'repair_photos_attached', 'repair_photos_failed', 'repair_photos_retry_clicked',
  'repair_form_abandoned', 'repair_service_selected', 'repair_contact_method_selected',
  'repair_photo_rejected', 'repair_photos_selected', 'repair_photo_removed',
  'repair_form_submit_attempt', 'repair_form_validation_error', 'repair_form_submit_failed',
  'generate_lead', 'site_error', 'site_error_retry',
  'booking_page_view', 'booking_embed_viewed', 'booking_link_clicked', 'booking_error', 'booking_success',
]);
const PAGE_TYPES = new Set<string>([...Object.values(PUBLIC_ROUTES), 'guide']);
const CAMPAIGN_KEYS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
]);
const CLICK_KEYS = new Set(['gclid', 'dclid', 'wbraid', 'gbraid']);
// Static, reviewed UI identifiers only; never harvest arbitrary test IDs.
const ACTION_IDS = new Set([
  'button-mobile-menu', 'button-watch-book', 'button-watch-battery',
  'button-jewelry-book', 'button-jewelry-watch', 'button-battery-book',
  'button-battery-repair', 'button-back-guides', 'button-all-guides',
  'button-guide-book', 'button-hero-book', 'button-hero-services',
  'button-process-book', 'button-more-story', 'button-cta-book',
  'button-cta-directions', 'button-about-book', 'button-directions',
  'button-book-intake', 'button-book-services', 'button-service-book',
  'button-service-visit', 'nav-book-appointment', 'mobile-nav-book',
  'repair-start-intake',
]);
const listeners = new Set<() => void>();
let initialized = false;
let tagLoaded = false;
let lastPath: string | null = null;
let currentLocation = '';
let currentReferrer = '';

export function getPublicAnalyticsRoute(pathname: string): PublicAnalyticsRoute | null {
  if (Object.prototype.hasOwnProperty.call(PUBLIC_ROUTES, pathname)) {
    return { page_path: pathname, page_type: PUBLIC_ROUTES[pathname as keyof typeof PUBLIC_ROUTES] };
  }
  if (/^\/guides\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname) && pathname.length <= 108) {
    return { page_path: pathname, page_type: 'guide' };
  }
  return null;
}

function isProductionHost(): boolean {
  return typeof window !== 'undefined' &&
    import.meta.env.PROD &&
    window.location.protocol === 'https:' &&
    PRODUCTION_HOSTS.has(window.location.hostname);
}

/** Keeps only safe public paths and validated campaign/click IDs. Never includes a hash. */
export function getSafeAnalyticsUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const route = getPublicAnalyticsRoute(url.pathname);
    if (url.protocol !== 'https:' || !PRODUCTION_HOSTS.has(url.hostname) || !route) return null;
    const safe = new URL(route.page_path, url.origin);
    for (const [key, value] of url.searchParams) {
      // Decoding happens in URLSearchParams; reject encoded/email-like/contact values.
      if (value.includes('@') || /%40/i.test(value) || /\b[A-Z0-9._%+-]+(?:@|%40)/i.test(value)) continue;
      if (CAMPAIGN_KEYS.has(key) && /^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,99}$/.test(value)) {
        safe.searchParams.set(key, value);
      } else if (CLICK_KEYS.has(key) && /^[a-zA-Z0-9_-]{1,256}$/.test(value)) {
        safe.searchParams.set(key, value);
      }
    }
    return safe.href;
  } catch {
    return null;
  }
}

function safeInitialReferrer(): string {
  try {
    if (!document.referrer) return '';
    const url = new URL(document.referrer);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    // Never reveal an admin route or an external referrer's path/query.
    if (PRODUCTION_HOSTS.has(url.hostname)) {
      const route = getPublicAnalyticsRoute(url.pathname);
      return route ? new URL(route.page_path, url.origin).href : '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

function queue(...args: unknown[]): void {
  try {
    window.dataLayer = window.dataLayer || [];
    // gtag uses an arguments object, not an array, in the dataLayer.
    window.dataLayer.push(arguments);
  } catch {
    // Analytics must never interfere with navigation or customer actions.
  }
}

function debugEnabled(): boolean {
  try {
    return isProductionHost() && sessionStorage.getItem(GOOGLE_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function sanitizeParams(input: GoogleEventParams): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'page_type' && typeof value === 'string' && PAGE_TYPES.has(value)) safe[key] = value;
    if ((key === 'page_path' || key === 'destination_path') && typeof value === 'string' &&
        getPublicAnalyticsRoute(value)) safe[key] = value;
    if (key === 'location' && ['nav', 'footer', 'body'].includes(String(value))) safe[key] = String(value);
    if (key === 'contact_method' && ['phone', 'sms', 'email', 'directions'].includes(String(value))) safe[key] = String(value);
    if (key === 'external_host' && typeof value === 'string' && value.length <= 253 &&
        /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) safe[key] = value;
    if (key === 'file_extension' && typeof value === 'string' &&
        ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip', 'png', 'jpg', 'jpeg', 'webp'].includes(value)) safe[key] = value;
    if (key === 'action_id' && typeof value === 'string' && ACTION_IDS.has(value)) safe[key] = value;
    if (key === 'faq_id' && typeof value === 'string' && /^faq-\d{1,2}$/.test(value)) safe[key] = value;
    if (key === 'percent_scrolled' && typeof value === 'number' && [25, 50, 75, 90].includes(value)) safe[key] = value;
    if (key === 'variant' && (value === 'consultation' || value === 'diagnosis')) safe[key] = value;
    if (key === 'cta' && ['call', 'call_request', 'online_intake', 'directions', 'directions_footer'].includes(String(value))) safe[key] = String(value);
    if (key === 'in_store' && typeof value === 'boolean') safe[key] = value;
    if (key === 'photo_count' && typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 20) safe[key] = value;
    if (key === 'form_id' && (value === 'online_repair' || value === 'in_store_repair')) safe[key] = value;
    if (key === 'service_type' && ['diagnosis', 'battery', 'mechanical', 'crystal_case', 'bracelet', 'restoration', 'other'].includes(String(value))) safe[key] = String(value);
    if (key === 'error_type' && ['too_large', 'unsupported_type', 'missing_upload_authorization',
      'required_fields', 'invalid_field', 'submission_failed', 'render_failed',
      'embed_failed', 'not_configured', 'load_failed', 'timeout'].includes(String(value))) safe[key] = String(value);
    if (key === 'booking_provider' && value === 'cal') safe[key] = value;
    if ((key === 'configured' || key === 'fatal') && typeof value === 'boolean') safe[key] = value;
  }
  return safe;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return isProductionHost() && !!getPublicAnalyticsRoute(window.location.pathname) &&
    window['ga-disable-G-CHF9G5PYE4'] !== true;
}

/** Fail-closed runtime sanitization also protects JS/untyped callers and legacy events. */
export function trackGoogleEvent(name: GoogleEventName, params?: GoogleEventParams): void;
export function trackGoogleEvent(name: string, params?: Record<string, string | number | boolean>): void;
export function trackGoogleEvent(name: string, params: GoogleEventParams = {}): void {
  try {
    if (!tagLoaded || !isGoogleAnalyticsEnabled() || !EVENT_NAMES.has(name)) return;
    const route = getPublicAnalyticsRoute(window.location.pathname);
    if (!route) return;
    queue('event', name, {
      ...sanitizeParams(params),
      ...route,
      page_location: getSafeAnalyticsUrl(window.location.href),
      page_referrer: currentReferrer,
      send_to: GOOGLE_MEASUREMENT_ID,
      ...(debugEnabled() ? { debug_mode: true } : {}),
    });
  } catch {
    // No exceptions or rejected promises may escape this synchronous wrapper.
  }
}

function prepareLocation(href: string): void {
  const safeUrl = getSafeAnalyticsUrl(href);
  const route = safeUrl ? getPublicAnalyticsRoute(new URL(safeUrl).pathname) : null;
  window['ga-disable-G-CHF9G5PYE4'] = !isProductionHost() || !route;
  if (!route || !safeUrl) return;
  const referrer = lastPath !== route.page_path
    ? (currentLocation ? new URL(lastPath || '/', window.location.origin).href : safeInitialReferrer())
    : currentReferrer;
  // Global overrides are updated before the history notification, best effort.
  // Google's outer pushState/replaceState wrapper calls this wrapper and then
  // processes the change. Its event-scoped values can still override these sets.
  // Google documents config ONCE per tag and set for subsequent updates; repeating
  // config here risks duplicate pageviews. No documented config `update` flag
  // guarantees sanitized enhanced-measurement history event parameters.
  queue('set', {
    page_location: safeUrl,
    page_referrer: referrer,
    page_title: `Upper East Watch Repair | ${route.page_type}`,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

function loadTag(): void {
  if (tagLoaded || !isGoogleAnalyticsEnabled()) return;
  tagLoaded = true;
  queue('js', new Date());
  queue('config', GOOGLE_MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(debugEnabled() ? { debug_mode: true } : {}),
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_MEASUREMENT_ID}`;
  script.id = 'public-google-analytics';
  script.onerror = () => { /* Blocked analytics must not affect the application. */ };
  document.head.appendChild(script);
}

function commitLocation(): void {
  try {
    const route = getPublicAnalyticsRoute(window.location.pathname);
    prepareLocation(window.location.href);
    if (!isGoogleAnalyticsEnabled() || !route) {
      lastPath = null;
      currentLocation = '';
      currentReferrer = '';
      for (const listener of listeners) listener();
      return;
    }
    loadTag();
    if (route.page_path === lastPath) return;
    currentReferrer = currentLocation
      ? new URL(lastPath || '/', window.location.origin).href
      : safeInitialReferrer();
    currentLocation = getSafeAnalyticsUrl(window.location.href) || '';
    lastPath = route.page_path;
    trackGoogleEvent('page_visit', route);
    for (const listener of listeners) listener();
  } catch {
    // Navigation must always work even if storage, the tag or an observer fails.
  }
}

/** Installed before downloading gtag, so admin suppression precedes history pageviews. */
export function initializeGoogleAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  window['ga-disable-G-CHF9G5PYE4'] = true;
  if (!isProductionHost()) return;
  // Preserve the standard command interface for trusted CMP/Tag Assistant code,
  // including commands queued on an initial admin route before the tag loads.
  // Public application events always pass through the sanitized event wrapper.
  window.gtag = (...args: unknown[]) => {
    try {
      if (args[0] === 'event') {
        if (typeof args[1] === 'string') {
          trackGoogleEvent(args[1] as GoogleEventName, (args[2] || {}) as GoogleEventParams);
        }
      } else {
        // config, consent, get, set, js and future standard commands retain their
        // arguments/callbacks. These are trusted control commands, not a PII filter.
        queue(...args);
      }
    } catch {
      // Third-party tracking cannot break the public site.
    }
  };
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method];
    window.history[method] = function (data: unknown, unused: string, url?: string | URL | null) {
      try {
        prepareLocation(url == null ? window.location.href : new URL(url, window.location.href).href);
      } catch {
        // Native history retains responsibility for invalid/cross-origin URLs.
      }
      try {
        original.call(this, data, unused, url);
      } finally {
        commitLocation();
      }
    };
  }
  // Capture listeners are installed before gtag's listeners (including popstate).
  window.addEventListener('popstate', commitLocation, true);
  window.addEventListener('hashchange', commitLocation, true);
  commitLocation();
}

export function subscribeGoogleAnalyticsRoutes(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getSafeActionId(element: Element): string | null {
  const id = element.getAttribute('data-testid');
  return id && ACTION_IDS.has(id) ? id : null;
}

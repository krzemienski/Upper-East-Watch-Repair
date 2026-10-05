import { useEffect } from 'react';
import {
  getPublicAnalyticsRoute,
  getSafeAnalyticsUrl,
  getSafeActionId,
  initializeGoogleAnalytics,
  isGoogleAnalyticsEnabled,
  subscribeGoogleAnalyticsRoutes,
  trackGoogleEvent,
} from '@/lib/google-analytics';

// Initialization precedes mounting and the download of Google's history observer.
initializeGoogleAnalytics();

function clickLocation(element: Element): 'nav' | 'footer' | 'body' {
  if (element.closest('footer, [role="contentinfo"]')) return 'footer';
  if (element.closest('nav, [role="navigation"], header')) return 'nav';
  return 'body';
}

function isMapsLink(url: URL): boolean {
  return url.hostname === 'maps.app.goo.gl' || url.hostname === 'maps.google.com' ||
    ((url.hostname === 'google.com' || url.hostname === 'www.google.com') &&
      /^\/maps(?:\/|$)/.test(url.pathname));
}

/** Document-level observers cover rendered articles and keyboard-activated controls. */
export function SiteAnalytics() {
  useEffect(() => {
    let seenDepths = new Set<number>();
    let observedPath = window.location.pathname;
    let scrollFrame = 0;

    const resetRoute = () => {
      if (observedPath === window.location.pathname) return;
      observedPath = window.location.pathname;
      seenDepths = new Set();
      // Do not immediately measure the old route's scroll position during SPA render.
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    };
    const unsubscribe = subscribeGoogleAnalyticsRoutes(resetRoute);

    const click = (event: MouseEvent) => {
      try {
        if (!isGoogleAnalyticsEnabled() || !(event.target instanceof Element)) return;
        const anchor = event.target.closest('a[href]');
        const location = clickLocation(event.target);
        if (anchor instanceof HTMLAnchorElement) {
          const raw = anchor.getAttribute('href') || '';
          if (/^tel:/i.test(raw)) {
            trackGoogleEvent('contact_click', { contact_method: 'phone', location });
            return;
          }
          if (/^mailto:/i.test(raw)) {
            trackGoogleEvent('contact_click', { contact_method: 'email', location });
            return;
          }
          const url = new URL(anchor.href, window.location.href);
          if (!['https:', 'http:'].includes(url.protocol)) return;
          const extension = url.pathname.match(/\.([a-z0-9]{1,8})$/i)?.[1].toLowerCase();
          if (anchor.hasAttribute('download') ||
              (extension && ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip'].includes(extension))) {
            trackGoogleEvent('download_clicked', { file_extension: extension, location });
            return;
          }
          if (isMapsLink(url)) {
            trackGoogleEvent('contact_click', { contact_method: 'directions', location });
            return;
          }
          if (url.origin === window.location.origin || getSafeAnalyticsUrl(url.href)) {
            const destination = getPublicAnalyticsRoute(url.pathname);
            if (destination) trackGoogleEvent('navigation_click', {
              destination_path: destination.page_path, location,
            });
            return;
          }
          trackGoogleEvent('outbound_link_clicked', { external_host: url.hostname, location });
          return;
        }
        const button = event.target.closest('button, [role="button"], summary');
        if (!button || button.getAttribute('aria-disabled') === 'true' ||
            (button instanceof HTMLButtonElement && button.disabled)) return;
        const actionId = getSafeActionId(button);
        if (actionId) trackGoogleEvent('action_click', { action_id: actionId, location });
      } catch {
        // Malformed links and blocked browser APIs must not interrupt user actions.
      }
    };

    // Observe the actual expansion, not the click: covers keyboard and Radix accordions.
    const observer = new MutationObserver((mutations) => {
      try {
        if (!isGoogleAnalyticsEnabled()) return;
        for (const mutation of mutations) {
          if (!(mutation.target instanceof Element)) continue;
          const element = mutation.target;
          const expanded = mutation.attributeName === 'aria-expanded'
            ? element.getAttribute('aria-expanded') === 'true' && mutation.oldValue !== 'true'
            : element.hasAttribute('open') && mutation.oldValue === null;
          if (!expanded) continue;
          const faq = element.closest('[data-testid^="faq-"]');
          const id = faq?.getAttribute('data-testid');
          if (id && /^faq-\d{1,2}$/.test(id)) {
            trackGoogleEvent('faq_expanded', { faq_id: id, location: clickLocation(element) });
          }
        }
      } catch {
        // Observation is best effort and never blocks rendering.
      }
    });
    observer.observe(document.body, {
      subtree: true, attributes: true, attributeOldValue: true,
      attributeFilter: ['aria-expanded', 'open'],
    });

    const measureScroll = () => {
      scrollFrame = 0;
      if (!isGoogleAnalyticsEnabled()) return;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      const percent = Math.max(0, window.scrollY) / height * 100;
      for (const depth of [25, 50, 75, 90] as const) {
        if (percent >= depth && !seenDepths.has(depth)) {
          seenDepths.add(depth);
          trackGoogleEvent('scroll_depth', { percent_scrolled: depth });
        }
      }
    };
    const scroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(measureScroll);
    };

    document.addEventListener('click', click, true);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      unsubscribe();
      document.removeEventListener('click', click, true);
      window.removeEventListener('scroll', scroll);
      observer.disconnect();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
    };
  }, []);

  return null;
}

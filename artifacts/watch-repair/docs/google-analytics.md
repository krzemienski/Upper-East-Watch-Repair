# Google Analytics operating guide

Measurement ID: `G-CHF9G5PYE4`

Primary published domain verified during implementation: https://uppereastwatchrepair.com
Also allowed: www.uppereastwatchrepair.com and upper-east-watch-repair.replit.app.
The www entry is an analytics allowlist, not confirmation that its DNS is configured.

## What the application measures

| Area | Events | Interpretation |
| --- | --- | --- |
| Pages | GA automatic `page_view`; custom `page_visit` | Initial loads and SPA routes. These are separate metrics: do not add their counts together. |
| Navigation | `navigation_click` | Public destination path plus nav/footer/body placement; includes service cards, guides, breadcrumbs and CTAs. |
| Contact | `contact_click` | Phone, email and directions links; does not imply a call was answered or a customer visited. |
| Links | `outbound_link_clicked`, `download_clicked` | Host or extension only, never raw URL or file name. |
| Engagement | `action_click`, `faq_expanded`, `scroll_depth` | Reviewed control IDs, FAQ index, and 25/50/75/90% depth once per route visit. |
| Repair landing | `repair_landing_viewed`, `cta_clicked` | Includes persistent consultation/diagnosis variant. |
| Intake arrival | `repair_intake_started`, `in_store_intake_started` | Legacy names: these mean the intake screen was opened, not edited. |
| First edit | `repair_form_started` | First actual edit once per mounted form. |
| Intent | `repair_service_selected`, `repair_contact_method_selected` | Only fixed options; no user-entered text. |
| Submission | `repair_form_submit_attempt`, `repair_form_validation_error`, `repair_form_submit_failed` | Attempts and failures, not conversions. Disabled incomplete forms cannot be submitted. |
| Success | `generate_lead`, `repair_intake_submitted` | Server accepted the lead. Mark only generate_lead as the repair conversion, not both. Photo retries do not create another conversion. |
| Exit | `repair_form_abandoned` | Best effort after editing without success, on unmount/pagehide. Mobile termination and blockers can prevent delivery. Analyze by form_id; SPA cleanup can use destination page context. |
| Photos | `repair_photos_selected`, `repair_photo_removed`, `repair_photo_rejected`, `repair_photos_attached`, `repair_photos_failed`, `repair_photos_retry_clicked` | Counts and categorical failure reasons only. |
| Booking | `booking_page_viewed`, `booking_embed_loaded`, `booking_embed_failed`, `booking_completed` | Completion uses Cal's bookingSuccessfulV2 callback, not a click or loading timer. Requires a configured Cal link. A completed request may still await confirmation in Cal. |
| Errors | `site_error`, `site_error_retry` | Render failures and recovery, with no raw exception or stack trace. |

Decorative autoplay background loops are intentionally not engagement events.
Internal staff routes, unknown URLs and development hosts are excluded from this
GA implementation. There is no browser fingerprinting, precise geolocation,
keystroke recording, session replay, or transmission of contact/watch details,
upload tokens, photos, lead IDs or booking IDs in custom events.

## Required GA4 property setup (not changed by application code)

1. Admin → Data streams → your Web stream: update the website URL to
   `https://uppereastwatchrepair.com`. Keep the existing stream/measurement ID.
2. Enhanced measurement → Page views → Advanced settings: keep **Page changes
   based on browser history events ON**. The app uses Google's automatic
   pageviews; do not configure a second pageview tag in GTM.
3. Disable automatic **Form interactions**, **Outbound clicks**, **File downloads**
   and **Scrolls** when using this custom instrumentation. Custom equivalents
   above provide controlled fields. Automatic form_submit is not proof that the
   server saved a lead. Keep automatic site search off: there is no public search.
4. Admin → Events / Key events: mark `generate_lead` and, when Cal is configured,
   `booking_completed` as key events. Do not also mark the legacy submission
   event as a conversion for the same lead.
5. Admin → Custom definitions: register event-scoped dimensions as needed:
   `page_type`, `destination_path`, `location`, `variant`, `cta`, `form_id`,
   `in_store`, `service_type`, `contact_method`, `error_type`, `booking_provider`,
   `configured`, `faq_id`, `action_id`, `external_host`, `file_extension`.
   Custom metrics: `photo_count`, `percent_scrolled`. Definitions are not
   retroactive; avoid creating every optional definition if it is not useful.
6. Configure internal-traffic exclusions for shop/team traffic carefully. In-store
   customer intake uses the same shop network: excluding the entire shop IP also
   excludes those customer events. Prefer reporting segments by form_id.
7. Review data retention and consent/privacy policy with the business owner.
   This change does not implement a consent banner. It preserves the previous
   analytics storage behavior; advertising personalization and Google signals
   are disabled. Contact consent on the repair form is NOT analytics consent.
   Use an appropriate consent manager before collecting where consent is required.
8. Enable email/query-parameter data redaction in the stream. Custom event fields
   are allowlisted. Safe global URL/referrer overrides remove unapproved parameters,
   but Google's automatic history/engagement event parameters can take precedence:
   verify actual outgoing requests rather than assuming these overrides sanitize
   every automatic event. Never put customer data in URLs or campaign values.

## Domain migration and attribution

- One domain change does not require another measurement ID.
- Prefer redirecting the old public domain to the proper domain while preserving
  marketing parameters. DNS/domain redirects are not changed by this work.
- If visitors intentionally travel between both domains, use Configure tag
  settings → Configure your domains, with the same stream on both. Google
  recommends configuring this in Analytics. Verify `_gl` survives redirects.
- Do not add Google Maps or all of cal.com as owned cross-domain sites.
- Use non-personal campaign tags on incoming marketing links, for example:
  `https://uppereastwatchrepair.com/repair?utm_source=google&utm_medium=organic&utm_campaign=business_profile`.
  Use distinct values for newsletters, QR cards and ads; never customer identifiers.
- GA provides source/medium/campaign/referrer, device and approximate country/
  region/city when available. Geographic detail is affected by privacy settings,
  thresholds, consent and network location; this is not GPS.
- The first-party lead attribution/reporting remains separate. Do not add its
  totals to GA/Umami totals. Internal navigation must not be tagged with UTMs.

## Reports to use

- Reports → Acquisition → Traffic acquisition: session source/medium/campaign.
- User attributes → Demographic details: country/region/city where available.
- Engagement → Pages and screens: views and engagement by page.
- Explore → Funnel: page_visit (repair) → repair_form_started → generate_lead.
  Break down by variant, device and session source/medium.
- Explore → Path exploration: what visitors open before intake.
- Segment online versus in-store forms; compare upload failures/retries.

The measurement ID is a public destination identifier, NOT an API credential.
Reading reports programmatically requires authorized Google Analytics Data API
access and the numeric property ID. Changing stream settings requires account
permissions. Offline won/received conversions need a separately designed,
consent-aware Measurement Protocol integration and a server-side API secret;
this implementation does not send staff actions as if staff were customers.
Do not create made-up purchase values or send contact data to approximate that.

## Verification and release checklist

Typecheck/build and source review do not prove Google received events.
Publish the new build and verify these in Tag Assistant, browser Network, and
GA4 Realtime/DebugView on the proper domain:

1. Initial page + two SPA links + Back: one automatic page_view per actual route,
   no duplicate config/pageview tags, correct URL/referrer/campaign.
2. Enable debug for your tab with
   `sessionStorage.setItem('uewr_ga_debug', '1')`, then reload. Remove this key
   after the check. Debug mode is never enabled for ordinary visitors.
3. Click nav, service, directions, FAQ; scroll; check their controlled parameters.
4. Edit intake: one repair_form_started; successful real submission produces
   one generate_lead. Photo failure/retry must not send generate_lead again.
5. Inspect collect requests for unknown URL query parameters and private fields.
   Verify the enhanced measurement switches above.
6. Open admin and development preview: no new GA requests should be dispatched.
7. Cal callbacks need real configured booking verification. A fallback booking
   page is not evidence that booking conversion collection works.
8. Test consent behavior, blockers, and cross-domain transitions if applicable.

GA4 property access was not available during implementation; account configuration,
live ingestion and Cal booking success are not verified by a successful build.

## Official references

- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications
- https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead
- https://support.google.com/analytics/answer/10071811 (cross-domain measurement)
- https://support.google.com/analytics/answer/12017362 (geographic data and privacy)
- https://cal.com/help/embedding/embed-events (booking callbacks)

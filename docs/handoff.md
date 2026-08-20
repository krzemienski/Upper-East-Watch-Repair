# Upper East Watch Repair handoff

## Editorial guides

1. Visit `/admin`.
2. Select **Log in** and complete the Replit sign-in flow.
3. If access is not yet configured, copy the signed-in user ID displayed on the
   access-required screen.
4. Set `ADMIN_REPLIT_USER_IDS` in the Replit environment to that stable ID. For
   multiple editors, use a comma-separated list with no quotes.
5. Restart the API workflow, revisit `/admin`, and create or edit a guide.
6. Use the preview before saving.
7. Keep the status **Draft** until ready, then choose **Published**.

Published guides appear on `/guides` immediately without a redeploy. Drafts stay
hidden from the public API. Authentication alone never grants editor access; the
server rejects signed-in identities outside `ADMIN_REPLIT_USER_IDS` with 403.
The seeded Rolex valuation guide is live; the
service-interval, battery-cost, and vintage-care pieces are editable outlines.

## Booking

The public `/book` page uses `VITE_CAL_LINK`. Follow
`docs/booking-setup.md` to create the shop-owned Cal.com account and perform the
required real booking test. Until then, the page presents an honest setup state
with walk-in directions.

## Updating business hours

Edit only `artifacts/watch-repair/src/data/business.ts`.

- `HOURS_DISPLAY` controls visible hours.
- `OPENING_HOURS` and `OPENING_HOURS_SPEC` control structured SEO data.
- Keep all three representations aligned.

Remove the `TODO(hours)` comment only after the client confirms exact hours.

## Replacing the logo

The current logo is the brief-authorized interim SVG wordmark with a 10:10
watch-hands mark. The original brief states that no source logo file was
available.

Replace the implementation behind
`artifacts/watch-repair/src/components/Logo.tsx` while keeping the exported
`Logo` component API (`className`, `variant`, and `color`). Remove
`TODO(brand)` only when the client provides and approves the real source asset.

## Hero media

Production media lives in `artifacts/watch-repair/public/media/`. Keep the exact
filenames when replacing it. Generation provenance, authored prompts, dimensions,
loop construction, compression, parallax, and accessibility rules are in
`docs/media-production.md`.

## Ads

Ad positions remain inert while `VITE_ADS_ENABLED` is unset or not `true`.
Do not enable the flag until the ad account, privacy language, and network code
are approved.

## Database and publishing

Development uses the project's built-in PostgreSQL database. Replit's Publish
flow applies the development schema diff to production; do not add startup-time
DDL or a separate production migration script.

## Final client-owned launch items

- Confirm exact shop hours.
- Supply and approve the final logo source.
- Configure `ADMIN_REPLIT_USER_IDS` for the shop's approved editor account(s).
- Connect the shop-owned Cal.com account and complete the real booking test.
- Supply the real public telephone number and social/profile URLs for structured
  data.
- Review all copy and seeded editorial content.
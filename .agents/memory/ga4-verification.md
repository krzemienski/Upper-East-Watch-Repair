---
name: GA4 ownership and verification
description: Why automatic pageviews were retained and what requires external account verification.
---

Retain one owner for pageviews: Google's automatic initial/history tracking.
Do not add manual page_view events without first changing and verifying the GA4
stream's enhanced measurement configuration.

**Why:** The measurement ID grants sending access, not property administration.
An independent manual route tracker could double-count traffic while automatic
history tracking remains on. The custom page_visit event is a distinct event,
not another page_view.

**How to apply:** Consult the project analytics operating guide before changing
pageview ownership. Stream settings, consent configuration and live ingestion
require separate verification in the actual Google account after publishing.
Do not claim global URL overrides guarantee sanitization of Google's automatic
events: event-scoped fields can override them.

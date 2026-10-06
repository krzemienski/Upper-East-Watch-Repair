---
name: Guide editorial source
description: Why public rendering must follow published editorial records rather than bundled seed articles.
---

Use the published editorial database as the authority for public guide content.
Bundled Markdown is bootstrap material, not permission to replace an edited
article or reconstruct the full published library from files.

**Why:** The public library includes existing editorial records that are not
bundled Markdown, and the guide editor can change or unpublish seeded articles.
Rendering seed files alone would publish different content or resurrect drafts.

**How to apply:** When changing crawlability, exports, or guide synchronization,
preserve editor changes, honor publication state, and fail explicitly if the
authoritative content cannot be read. Static content changes require a new
published build; do not imply a successful live API update refreshed static HTML.

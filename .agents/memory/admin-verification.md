---
name: Admin verification
description: Preview-proxy rate-limit isolation and shared-library build prerequisites.
---

Do not assume a custom X-Forwarded-For header isolates login-throttle tests through the preview proxy.

**Why:** A rate-limit probe using a synthetic forwarded address still locked out the browser tester. The preview proxy can replace forwarded client information.

**How to apply:** Run throttle checks last, after successful login workflows, or clear the development process's in-memory throttle before continuing. Never reset production throttles for test convenience.

Rebuild shared TypeScript project references before diagnosing an apparently missing export in an artifact.

**Why:** The source export existed but the consumer's typecheck used stale declaration output.

**How to apply:** Run the workspace library typecheck/build before changing source to fix a missing-export error.

Do not enter an owner credential through browser tooling that automatically records password field values in layout snapshots.

**Why:** Browser verification reported that its automatic observation exposed a filled password despite scripts never logging it.

**How to apply:** Confirm redaction first or use an isolated test credential/session with a documented cleanup strategy. If an owner credential is exposed, notify the owner without reproducing it and request rotation.

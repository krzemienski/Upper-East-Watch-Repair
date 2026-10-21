---
name: Browser driving in this workspace
description: How to drive the real app with agent-browser here, since the browser does not survive between shell calls.
---

agent-browser is not installed globally; run it via `npx -y agent-browser`. Its browser daemon does not survive between separate shell calls, so every call starts at about:blank and earlier refs are invalid.

**Why:** separate calls each printed "launched browser", and refs from a previous call failed with "Unknown ref".

**How to apply:** chain the whole flow (open → fill → click → read result) with `&&` in one shell call, and use semantic locators (`find label "Name *" fill ...`, `find role option click --name ...`) instead of refs carried across calls.

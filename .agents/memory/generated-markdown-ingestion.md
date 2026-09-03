---
name: Generated Markdown ingestion
description: Reliable handling of Markdown files created by subagents or generation tools in this workspace.
---

Normalize generated Markdown from CRLF to LF before parsing frontmatter, and fall back to a shell-backed read when a durable file callback reports a newly created file as unavailable.

**Why:** Newly generated guide files were immediately visible to workspace shell commands but not to the durable file callback, and their CRLF line endings caused an otherwise valid frontmatter parser to reject them.

**How to apply:** When generated Markdown cannot be read or parsed despite existing on disk, verify it with `file`/`cat`, normalize line endings in memory, and keep database writes parameterized and idempotent.
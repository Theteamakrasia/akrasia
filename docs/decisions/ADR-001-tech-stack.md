# ADR-001: Initial Tech Stack

**Date:** 2025-05-09  
**Status:** Accepted

## Context
We are a small startup team building our first web product. We need to move fast, keep costs low, and avoid over-engineering early on.

## Decision
- **Frontend:** Plain HTML, CSS, and JavaScript — no framework overhead at launch.
- **Backend:** To be decided when we need server-side features (auth, DB, APIs).
- **Database:** To be decided alongside the backend.

## Consequences
- ✅ Zero build tooling complexity at launch
- ✅ Any team member can open and edit HTML files immediately
- ⚠️ Will need a migration plan when adopting a framework (React, Vue, etc.)

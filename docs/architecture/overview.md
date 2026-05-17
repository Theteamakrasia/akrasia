# Architecture Overview

## Current (Phase 1 — Frontend Only)

```
Browser ──► Nginx ──► Static Files (HTML/CSS/JS)
```

## Planned (Phase 2 — Full Stack)

```
Browser ──► Nginx ──► Frontend (Static)
                 └──► Backend API ──► Database
```

## Key Decisions

| Decision              | Choice         | Reason           |
|-----------------------|----------------|------------------|
| Frontend framework    | Vanilla HTML/CSS/JS | Lightweight start |
| Backend framework     | TBD            | To be decided    |
| Database              | TBD            | To be decided    |
| Hosting               | TBD            | To be decided    |

See `decisions/` for full Architecture Decision Records.



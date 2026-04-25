# KOSHA — PROGRESS

**Last updated** : 2026-04-25
**Current phase** : P1 — Setup & Auth
**Current task** : P1.1 — tracking files init
**Last file touched** : task_plan.md
**Build status** : N/A (project not yet scaffolded)
**Live URL** : N/A (not deployed yet)

---

## Defaults taken (no answer to clarifying questions)

1. **Treezor** = stub mode (Phase 1 BRIEF §6, points + simulation). Real API binding deferred until SASU active.
2. **Map** = MapLibre GL JS + MapTiler tiles (0€, no API key required for OSM tiles).
3. **i18n** = port YANA's 16 locales (ar, de, en, es, fr, hi, it, ja, ko, nl, pl, pt, ru, sv, tr, zh). BRIEF said 29 = aspirational.
4. **RevenueCat** = stub in P11. Real init requires Apple Dev + Play Console accounts (post-SASU).
5. **Score d'Humanité initial** = 5.0/10 médian for new users (avoid "anciens favorisés" bias).
6. **Cap 12 mois ancienneté** = STRICT (no bonus beyond 12 months) per BRIEF wording.
7. **App Store / Play Store** = artifacts only in P11, no submission (post-SASU).
8. **Context management** = /compact at 50%, restart + handoff at 60%.

---

## Current session log

- 2026-04-25 15:30 — Plan P1→P11 validé par Tissma ("ok").
- 2026-04-25 15:32 — TaskCreate × 10 sub-steps P1.
- 2026-04-25 15:33 — Env check OK : sshpass, vercel, gh, node 24.13.1, npm 11.8. psql absent (utilise SSH VPS docker exec).
- 2026-04-25 15:33 — VPS reachable. supabase-* containers tous UP (auth, kong, rest, edge-functions, studio, storage, meta, analytics, pooler, realtime).
- 2026-04-25 15:34 — YANA i18n découvert : 16 locales, next-intl, Next 16.2.2, React 19.2.4. Pattern porté.
- 2026-04-25 15:35 — Tracking files créés.

---

## What works

- N/A (project not yet scaffolded)

## What doesn't work / blockers

- None.

## Next session priorities

If session ends mid-P1, resume here:
1. Read task_plan.md + progress.md + ERRORS.md + PATTERNS.md
2. Continue from current task (P1.X marked in_progress)
3. NEVER recode what works

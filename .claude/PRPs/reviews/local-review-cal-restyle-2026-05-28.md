# Local Code Review — Cal.com Re-skin + Nav Shell + i18n

**Reviewed**: 2026-05-28
**Scope**: Uncommitted changes on `feat/cal-restyle-i18n` vs `f9b8830` (35 modified + 15 new files)
**Decision**: ✅ **APPROVE with comments** — 0 CRITICAL, 0 HIGH, 1 MEDIUM, 4 LOW

## Summary
Clean, well-tested restyle + i18n. Type-safe message catalog (compile-time key parity), token-only Cal re-skin (category accents retained), accessible nav shell + language toggle, localized durations/dates. No security issues; validation fully green (typecheck, lint, 89 unit tests, build+PWA, 4 E2E incl. language switch + visual regression).

## Findings

### CRITICAL — None
i18n strings are static; `translate()` only substitutes app-provided params (counts/durations/category labels), never raw user input; note text renders as escaped React text (no `dangerouslySetInnerHTML`); no secrets, no network, no injection surface.

### HIGH — None
Happy paths verified by unit + E2E (including the zh↔en switch and nav).

### MEDIUM
- **M1 (pre-existing, persists)** — `:date` route param is still unvalidated in `DailyScreen`. With i18n it now renders **"Invalid Date"** for a garbage URL like `/day/foo` (via `dayKeyLabel` → `Intl` on `new Date(NaN)`); nav arrows compute `NaN-NaN-NaN`. Not introduced here (flagged in the prior review, out of this plan's scope), but re-noting. **Fix**: `isDayKey()` guard + fall back to today.

### LOW
- **L1** — `shell.module.css`: mobile `.content { padding-bottom: calc(56px + safe) }` hard-codes the fixed tab-bar height (56px). If the bar grows (larger text/locale), content could be clipped. Consider a CSS var or `padding-bottom: env(...)` + measured height.
- **L2** — Inter ships per-script subsets; the Workbox precache now includes unused latin-ext/cyrillic/greek woff2 (~+220 KB SW cache). Runtime only fetches the latin subset (unicode-range). Trim non-latin from `globPatterns` if offline-cache size matters.
- **L3** — `--hold-duration` token in `tokens.css` is still unused (ring driven by the JS `HOLD_DURATION_MS`). Carried over.
- **L4 (carryover)** — `useLongPress` still lacks a rAF cleanup on unmount (prior review M2). Unchanged by this work.

## Positives
- **Type-safe i18n**: `MessageKey` derived from zh; en typed as `Record<MessageKey,string>` → missing/typo'd key is a compile error. Runtime parity + placeholder-consistency tests back it up.
- **Token-only re-skin**: neutral Cal chrome with `--cat-*` accents retained; minimal component churn, all visual baselines regenerated.
- **a11y**: `LanguageToggle` (role=group, `aria-pressed`), `NavBar` (`aria-current`, `nav[aria-label]`), icons `aria-hidden`.
- **Correct engineering calls**: provider split for HMR rule; Playwright `locale: zh-CN` to make auto-detect deterministic; ambient module for the CSS-only font package.
- **Coverage** 99.6% stmts / 89.3% branch; domain/data/timer logic untouched (pure restyle + i18n).

## Validation Results
| Check | Result |
|---|---|
| Type check (`tsc -b`, strict) | ✅ Pass |
| Lint (eslint) | ✅ Pass (0/0) |
| Unit tests (vitest) | ✅ Pass (89) |
| Build (vite + PWA) | ✅ Pass |
| E2E + visual regression (Playwright) | ✅ Pass (4) |

## Files Reviewed
New: `src/i18n/**` (locale, messages, I18nContext, I18nProvider + 3 tests), `src/components/shell/**` (AppShell, NavBar, LanguageToggle, css + 2 tests), `src/test/renderWithI18n.tsx`, `src/fonts.d.ts`.
Modified: `tokens.css`, `typography.css`, `main.tsx`, `App.tsx`, `categories.ts`(+test), `time.ts`(+test), all category-picker/timer/summary/daily/ui components (+7 tests), 3 route screens, `vite.config.ts`, `package.json`, `playwright.config.ts`, `core-flow.spec.ts` + 2 baseline PNGs.

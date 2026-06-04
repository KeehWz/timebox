# Implementation Report: Cal.com Re-skin + Nav Shell + zh/en i18n

## Summary
Restyled Timebox to Cal.com's neutral aesthetic via a `tokens.css` value swap (kept CSS Modules + tests), added a Cal-style navigation shell (desktop sidebar / mobile bottom tabs) that also fixes the Home→Daily gap (review finding M3), and introduced a lightweight, type-safe zh/en i18n with a `中 / EN` toggle (persisted, reactive, updates `<html lang>`). No login page, no dark mode. On branch `feat/cal-restyle-i18n` atop the committed UI phase (`f9b8830`).

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large (~32 files) | Large — ~34 files touched |
| Confidence | 8/10 | Held; snags were lint-rule + test-locale, both resolved |
| Files | ~32 | 8 new (i18n + shell + helper) · ~26 modified |
| Coverage | ≥80% | 99.6% stmts / 89.3% branch / 98.9% funcs |

## Tasks Completed

| # | Task | Status |
|---|---|---|
| 1 | i18n core + typed zh/en catalog | ✅ |
| 2 | Categories → i18n + localized formatters (`formatDuration`, `dayKeyLabel`) | ✅ |
| 3 | Extract all hardcoded strings → `useT` (12 components/routes) | ✅ |
| 4 | Cal.com token re-skin + self-hosted Inter | ✅ |
| 5 | Cal nav shell (AppShell/NavBar/LanguageToggle) + nested routing | ✅ |
| 6 | `renderWithI18n` helper + updated 7 component tests + i18n/shell/locale tests | ✅ |
| 7 | E2E + visual baseline refresh (+ language-switch & nav tests) | ✅ |
| 8 | Full validation | ✅ |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | ✅ Pass | tsc -b strict, eslint 0/0 |
| Unit Tests | ✅ Pass | 89 tests, 20 files |
| Coverage | ✅ Pass | 99.6% stmts (i18n + shell covered) |
| Build | ✅ Pass | PWA sw + manifest; Inter woff2 precached |
| E2E + Visual | ✅ Pass | 4 tests (flow + lang switch + nav + 4 breakpoint baselines) |

## Deviations from Plan

1. **Split `I18nProvider` into its own file** — the React-Compiler `react-hooks/only-export-components` rule rejects a hook (`useT`) co-located with a component (`I18nProvider`). `useT`/context/types stay in `I18nContext.tsx` (so all 14 consumer imports are unchanged); the Provider moved to `I18nProvider.tsx`.
2. **Playwright locale set to `zh-CN`** — Chromium defaults to `en-US`, and the app now auto-detects locale, which would flip E2E to English and break the zh selectors. Pinned the context locale; added an explicit language-switch E2E instead.
3. **Ambient font module** (`src/fonts.d.ts`) — TS couldn't type the bare side-effect import of the CSS-only `@fontsource-variable/inter`. Added `declare module`; excluded `src/**/*.d.ts` + `AppShell.tsx` from coverage.
4. **`formatHuman` kept as a thin delegate** to `formatDuration(ms, 'en')` (DRY; preserves its existing tests).
5. **Category accents retained** — Cal chrome is grayscale, but per-type color is core to a tracker, so chrome went neutral while `--cat-*` stayed (as planned, stated explicitly).

## Issues Encountered (all resolved)

- `categories.test` asserted the removed `.label` → updated to `.icon`.
- Default locale is now `zh`, so `SessionSummary`/`DailyTotals` duration assertions were English → updated to zh (`1时14分`, `1时30分`).
- `react-refresh` lint on the context file → provider split.
- Playwright auto-detect → English → set context `locale: 'zh-CN'`.
- TS side-effect import of CSS-only package → ambient declaration.

## Files Changed

| Area | Files |
|---|---|
| New — i18n | `locale.ts`, `messages.ts`, `I18nContext.tsx`, `I18nProvider.tsx` (+ `messages.test`, `I18nContext.test`, `locale.test`) |
| New — shell | `shell/{AppShell,NavBar,LanguageToggle}.tsx`, `shell.module.css` (+ `NavBar.test`, `LanguageToggle.test`) |
| New — misc | `test/renderWithI18n.tsx`, `fonts.d.ts` |
| Modified — styles | `tokens.css` (Cal re-skin), `typography.css`, `main.tsx` (Inter + provider) |
| Modified — domain | `categories.ts` (drop label/hint), `time.ts` (+`formatDuration`/`dayKeyLabel`) + `time.test`, `categories.test` |
| Modified — UI | all category-picker / timer / summary / daily / ui components + 4 route screens → `useT`; 7 component tests → `renderWithI18n` |
| Modified — app/config | `App.tsx` (nested shell route), `vite.config.ts` (coverage excludes), `package.json` (+`@fontsource-variable/inter`) |
| Modified — e2e | `playwright.config.ts` (locale), `core-flow.spec.ts` (+2 tests), 4 regenerated baseline PNGs |

## Notable Follow-up (optional)
- **Inter precache size**: the variable font ships per-script subsets (latin/latin-ext/cyrillic/greek). The browser only downloads the needed subset at runtime (unicode-range), but the Workbox precache currently includes all (~+220 KB). Could trim non-latin woff2 from `globPatterns` if offline cache size matters.
- Review findings **M1** (date-param validation) and **M2** (`useLongPress` cleanup) remain open — not in this plan's scope.

## Next Steps
- [ ] `/code-review`
- [ ] Commit on `feat/cal-restyle-i18n`; open PR

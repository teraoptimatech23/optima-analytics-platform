# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server on port 5173 (auto-opens browser)
npm run build      # tsc -b && vite build
npm run preview    # serve the production build
npm run lint       # ESLint across the repo
npm run typecheck  # tsc -b --pretty
```

No test runner is configured. Treat `npm run typecheck` + `npm run lint` as the required validation before handing off; use `npm run build` for release-oriented checks.

## What this is

A single-page customer-insight dashboard prototype (React 19 + Vite + TypeScript strict + Less + Zustand), rebuilding the UI in `public/reference/dashboard-reference.jpeg`. All content is Indonesian and all data is static — there is no backend yet.

## Architecture

**Data flow is currently mock-only.** `src/mock/dashboard.ts` exports `dashboardData` (typed via `DashboardData`), which seeds `useDashboardStore` as its initial state. `src/services/api.ts` exports a configured axios instance (`VITE_API_BASE_URL`) but nothing calls it yet; the store already has `setData`/`setLoading`/`setError` so wiring a real fetch means replacing the seed, not restructuring. Only `kpis`, `customerProfiles` and `motivations` come from the store; the rest of the dashboard content (`needs`, `painPoints`, `purchaseFrequency`, `purchaseChannels`, `kpiSummary`, `recommendations`) lives as typed constants at the top of `src/pages/Dashboard/index.tsx` and is passed down as props — cards are presentational and never read a store themselves. Move those constants to `src/mock` when making them dynamic.

**Navigation is state-driven, not route-driven.** `src/router/index.tsx` has exactly one real route (`/` → `Dashboard`), with everything else redirecting there. The sidebar's active item lives in `useAppStore.activeMenu` as a *label string* (`'Ringkasan'`, etc.) matched against the `menuItems` array in `Sidebar.tsx`. Adding a real page means adding both a `<Route>` and reconciling that label-based selection with the URL.

**Three Zustand stores**, all flat `create<T>()` with no middleware:
- `useAppStore` — sidebar collapse, mobile drawer, active menu label
- `useDashboardStore` — dashboard data + loading/error
- `useFilterStore` — five-key `DashboardFilters` record (`period`/`outlet`/`region`/`channel`/`segment`), values are display strings

Components subscribe with individual selectors (`useAppStore((state) => state.sidebarCollapsed)`) — keep that pattern rather than destructuring the whole store.

**Layout shell:** `DashboardLayout` renders the decorative `__scene` (liquid blobs + ring), a floating desktop `Sidebar`, a duplicate `Sidebar` inside a mobile drawer plus scrim, and `Topbar` + `<Outlet />` inside a single scroll container. `body` has `overflow: hidden`; scrolling happens in `.dashboard-layout__scroller`.

**Charts:** `src/components/charts/Sparkline` is hand-rolled SVG (Catmull-Rom → cubic bezier, gradient stroke, `useId` for gradient ids) because Recharts is unwieldy at 100×40px; `src/components/charts/DonutChart` uses Recharts `PieChart`. Reach for Recharts for anything with axes or tooltips, Sparkline for inline trends.

## Two parallel component families

This is the biggest thing to know before adding UI:

- `src/components/common/*` + `src/components/dashboard/*` + `src/components/layout/*` — the components the Dashboard page actually uses. Plain markup + Less, class prefix `glass-card`, `badge`, etc.
- `src/components/glass/*` — a separate Radix-UI–based glass design-system kit (`GlassCard`, `GlassButton`, `GlassInput`, `GlassSelect`, `GlassModal`, `GlassTooltip`, `GlassBadge`, `GlassSidebar`), barrel-exported from `src/components/glass/index.ts`. Nothing outside that folder imports it yet; its `GlassCard` uses the `glass-card-ds` class to avoid colliding with the `common` one.

There are therefore **two different `GlassCard` components**. Pages currently import `@/components/common/GlassCard/GlassCard`. When adding interactive controls (select, modal, tooltip), prefer the Radix `@/components/glass` kit rather than hand-rolling; when adding a static card in the existing dashboard, stay consistent with the `common` one already used on that page.

## Styling

Vite injects `@import "@/styles/variables.less"` into **every** `.less` file (`vite.config.ts` → `css.preprocessorOptions.less.additionalData`). Never import `variables.less` manually in a component stylesheet — it will be a duplicate. Only `src/styles/index.less` (imported once in `main.tsx`) pulls in reset/mixins/animation/glass/layout.

Every translucent surface derives from one recipe — `.glass()` in `src/styles/mixins.less` (`rgba(255,255,255,.45)` + `blur(24px)` + hairline white border + `0 8px 30px rgba(31,38,135,.12)`). Use its wrappers rather than re-deriving the effect: `.glass-card()`, `.glass-control()` (pill-shaped controls), `.glass-sheen()` (specular top-left highlight), `.hover-lift()` (the shared −2px / 200ms hover), `.icon-bubble()`, `.stack-rows()`, `.truncate()`, `.scroll-thin()`. Colors, radii, shadows, spacing, typography weights (`@fw-*`), motion (`@duration`, `@ease-out`) and four breakpoints (`@breakpoint-wide: 1500px`, `@breakpoint-laptop: 1240px`, `@breakpoint-tablet: 980px`, `@breakpoint-mobile: 680px`) are tokens in `variables.less` — use them, don't hardcode hex or px.

Cards whose inner layout splits into columns (`PurchaseCard`, `PerceptionCard`) use **container queries** (`container-type: inline-size` + `@container`), not media queries, because their width depends on the grid column they land in, not the viewport.

Motion: cards enter with a Framer Motion fade/rise and lift on hover via `whileHover` in `GlassCard`; the box-shadow half of that hover is CSS. Both are disabled under `useReducedMotion`. Everything else uses the CSS `.hover-lift()` mixin — don't mix the two on one element or the transforms fight.

Typography is Inter, bundled via `@fontsource/inter` (weights 400/500/600/700/800 imported in `main.tsx`) — no network font fetch.

## Conventions

- TypeScript strict, plus `noUncheckedIndexedAccess` — indexing an array yields `T | undefined`; the codebase handles it with `as const` tone tuples plus a `?? fallback` at the access site.
- Two-space indent, single quotes, **no semicolons**.
- PascalCase component folders with a sibling `.less`: `src/components/common/GlassCard/GlassCard.tsx` + `GlassCard.less`. Pages use `index.tsx` + `index.less`.
- Zustand stores named `useXStore.ts`.
- Import from `src` via the `@` alias (configured in both `vite.config.ts` and `tsconfig.app.json`).
- Icons come from `lucide-react`; type icon props as `LucideIcon`.
- UI copy is Indonesian, including `aria-label`s. Numbers use comma decimals (`'4,2%'`, `value.toFixed(1).replace('.', ',')`).

## Environment

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` when an API exists.

## Agent skills

`.agents/skills/` holds vendored skills (`frontend-design`, `frontend-design-ui-ux`, `premium-frontend-ui`, `react-expert`, `dependency-upgrade`) pinned by source + hash in `skills-lock.json`. Treat them as vendored content — don't hand-edit; update via their source.

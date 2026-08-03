# Repository Guidelines

## Project Structure & Module Organization

This is a React 19 + Vite + TypeScript dashboard prototype using Less and Zustand. Application code lives in `src/`. Reusable UI belongs in `src/components/common`, layout shell pieces in `src/components/layout`, and dashboard-specific components in `src/components/dashboard`. Page-level routes live under `src/pages`, routing is configured in `src/router`, and state stores are in `src/store` using the `useXStore.ts` naming pattern. API helpers live in `src/services`, temporary dashboard data in `src/mock`, and global Less tokens/mixins in `src/styles`. Static references and public assets belong in `public/`, including `public/reference/dashboard-reference.jpeg`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: run TypeScript project build, then produce a production Vite build.
- `npm run preview`: serve the built app locally for inspection.
- `npm run lint`: run ESLint across the repository.
- `npm run typecheck`: run TypeScript checks without starting Vite.

Run `npm run lint` and `npm run typecheck` before handing off changes; use `npm run build` for release-oriented validation.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Keep component folders PascalCase, for example `src/components/common/GlassCard/GlassCard.tsx`, with a sibling `.less` file when styling is component-specific. Use `useSomethingStore.ts` for Zustand stores and `index.tsx` for page entry files. Prefer the `@` alias for imports from `src`, such as `import GlassCard from '@/components/common/GlassCard/GlassCard'`. Follow the existing style: two-space indentation, single quotes, no semicolons, and concise named constants.

## Testing Guidelines

No test runner is currently configured. For now, treat `npm run typecheck`, `npm run lint`, and `npm run build` as required validation. If tests are added, colocate them near the implementation as `*.test.ts` or `*.test.tsx`, prefer React Testing Library for UI behavior, and keep mock data deterministic.

## Commit & Pull Request Guidelines

This checkout does not include accessible Git history, so no project-specific commit convention can be inferred. Use short, imperative commit subjects such as `Add dashboard KPI card` or `Fix sidebar filter state`. Pull requests should include a clear summary, validation commands run, linked issue or task context, and screenshots or short screen recordings for UI changes.

## Security & Configuration Tips

Copy `.env.example` to `.env` when an API is available and set `VITE_API_BASE_URL`. Do not commit secrets or local environment files. Keep generated build output and dependency folders out of source control.

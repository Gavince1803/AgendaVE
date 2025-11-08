# Repository Guidelines

## Project Structure & Module Organization
The Expo Router surfaces live under `app/`, with nested route groups such as `app/(tabs)` for the main experience and `app/(auth)` for onboarding. Shared UI and logic belong in `components/`, `hooks/`, and `contexts/`, while single-purpose helpers live in `lib/` and constants in `constants/`. Native assets (fonts, icons, illustrations) are stored in `assets/`, and platform configuration sits in `android/`, `app.json`, `eas.json`, and `metro.config.js`. Supabase SQL, seed data, and edge helpers stay in `database/` and `supabase/`. Automation scripts (e.g., `scripts/reset-project.js`) and debug utilities (`debug-*.js`) round out the toolbelt.

## Build, Test, and Development Commands
- `npm install`: hydrate dependencies before any build.
- `npm run start`: launch Expo Dev Server for simulators, the local client, or the QR app.
- `npm run android` / `npm run ios`: build and install native binaries via `expo run`.
- `npm run web`: verify parity in the web runtime.
- `npm run lint`: run `eslint-config-expo` to catch style and safety regressions.
- `npm run typecheck`: ensure the TypeScript surface compiles (`tsc --noEmit`) before bundling.
- `npm run reset-project`: clear caches, reinstall pods, and refresh Expo assets; use when runtime issues persist.

## Coding Style & Naming Conventions
TypeScript is the default; prefer `.tsx` for UI and `.ts` for logic. Follow 2-space indentation, semicolons, and single quotes as enforced by ESLint. Component files are `PascalCase.tsx`, hooks use the `useThing.ts` pattern, and context providers live under `contexts/*Context.tsx`. Import shared modules via the `@/` alias instead of relative climbs. Keep components pure, with side-effects isolated to hooks or providers; document complex flows with concise inline comments.

## Testing Guidelines
Automated testing is still emerging; when adding new logic, co-locate Jest/RTL specs under a `__tests__` folder next to the source (e.g., `components/__tests__/Calendar.test.tsx`). Use descriptive `it('renders empty state')` strings and cover error paths plus Supabase edge cases. Until CI is in place, attach Expo preview recordings or screenshots that demonstrate the feature on at least one platform.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes (`feat:`, `fix:`, `chore:`). Keep subjects imperative and under ~72 characters, e.g., `feat: add offline booking sync`. Each PR should describe scope, testing steps (`npm run start`, lint output), linked issue IDs, and UI proof when visuals change. Highlight data migrations touching `database/` or `supabase/` and include rollback notes when applicable.

## Security & Configuration Tips
Never commit real Supabase keys—copy `env.example`, populate `.env.local`, and register secrets in EAS. When working with notifications or deep links, validate payload parsing just like `DeepLinkHandler` in `app/_layout.tsx`. For contributor machines, run `setup-mac.sh` or the platform-specific instructions in `README-MAC.md` before shipping to ensure native toolchains stay aligned.

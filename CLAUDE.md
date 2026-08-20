# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FitPro is an Expo Router (React Native) fitness app: workout programs, dashboard/nutrition tracking, onboarding, and a local-first SQLite data layer. UI copy is Brazilian Portuguese (pt-BR).

## Commands

- `expo start` — dev server (`npm start`)
- `expo start --web` — web target (`npm run web`)
- `expo run:android` / `expo run:ios` — native builds (`npm run android` / `npm run ios`)

There is no lint script, no test script, and no test runner configured (no Jest config exists despite `react-test-renderer` being a devDependency and a `components/__tests__/` folder existing with one spec). Don't assume `npm test` works — verify before relying on it.

## Architecture

**Routing (`/app`) vs. domain logic (`/src/features`)**: Expo Router file-based routes live under `/app` and are kept thin — each route file mostly re-exports or thinly wraps a screen component from `/src/features/<feature>/screens/`. The actual UI, state, and logic for a feature live together under `src/features/<feature>/` (`screens/`, `components/`, `hooks/`, `services/`). When changing behavior for a screen, look for its implementation in `src/features/**` first, not in `/app`.

- `app/_layout.tsx` is the root: sets up the `Stack` navigator, wraps everything in `ProfileDrawerProvider` + `SafeAreaProvider`, and — on mount — calls `initLocalDatabase()`, `WorkoutService.seedInitialData()`, then `WorkoutService.seedExerciseLibrary()` before hiding the splash screen. Any new global provider, startup side effect, or one-time data seed goes here.
- `app/(tabs)/` is the bottom-tab group (home, workout, diet, stats, social, market, profile). `app/bkp_tabs/` is a legacy/backup copy, not part of the live route tree.
- Top-level `/components` holds route-adjacent, less structured UI (older code, modals for `workout/` and `profile/` domains). `/src/components` holds newer shared, generic components (e.g. `ActionButton`, `MacroBar`, `ProfileSideDrawer`). New generic/reusable components go in `/src/components`.

**Data layer**: `src/database/db.ts` opens a singleton `expo-sqlite` connection and owns all `CREATE TABLE` statements, run inside `ensureSchema()`. Feature-specific SQL lives in a `services/` class per feature (e.g. `src/features/workout/services/WorkoutService.ts`), not in components or hooks. Screens/components never query the DB directly — they call a hook (e.g. `useWorkout`, `useDashboard`) which calls the service. `getDBConnection()` guarantees the schema exists before returning the connection (memoized) — every caller can call it directly without racing `_layout.tsx`'s boot sequence.

Database name: native (iOS/Android) uses the real persistent file `fitpro_local.db`; **web uses `:memory:`** specifically (see `db.ts` top comment) — expo-sqlite's web VFS is OPFS-backed and unreliable without cross-origin-isolation headers Metro's dev server doesn't send, while `:memory:` routes to expo-sqlite's separate in-RAM VFS and sidesteps that entirely. Consequence: data does **not** persist across a web page reload — expected, not a bug.

**Schema migrations — read before adding any column to an existing table.** `CREATE TABLE IF NOT EXISTS` only runs on a table's *first-ever* creation; adding a column to a table definition that already shipped does nothing for installs that already have that table (the native DB is a persistent file that survives app updates — it does not get recreated). Every column added after a table's initial release must *also* get an explicit entry in the `migrations` array inside `ensureSchema()` (`db.ts`), e.g. `'ALTER TABLE WorkoutPrograms ADD COLUMN total_weeks INTEGER DEFAULT 12'` — each is wrapped to swallow "duplicate column name" (fine, already migrated) while letting any other error surface. Forgetting this produces `table X has no column named Y` at runtime, only on devices that installed before the column existed (a fresh install/fresh `:memory:` web session never hits it, which is why it's easy to miss while testing) — this exact bug shipped twice in one session (`WorkoutExercises.library_id`/`target_reps`, then `WorkoutPrograms.total_weeks`/`created_at`) before the pattern was internalized.

Key tables: `WorkoutV3` (per-date calendar log — completed/skipped/today/future — keyed by ISO date, also the "calendar" scheduling mode's source of truth), `WorkoutPrograms` / `WorkoutSessions` / `WorkoutExercises` (user-created ficha → divisions A/B/C → exercises, with `target_sets`/`target_reps` and an optional `library_id` FK into `ExerciseLibrary`), `WorkoutLogs` / `SetLogs` (a real completed workout + its per-set weight/reps, written by `WorkoutService.completeWorkout()`), `ExerciseLibrary` (seeded reference catalog, see below), `UserPreferences` (key/value settings — `schedulingMode`, `queueCursor`). Scheduling has two modes — `queue` (rotates through the active program's sessions, cursor advanced only on a genuine `completeWorkout()` call, resolved in `WorkoutService.getQueueWeek()`) and `calendar` (reads `WorkoutV3` directly) — both behind `WorkoutService.getWeeklySchedule()`.

**Exercise library**: `src/data/exercises.json` (~1MB, bundled, `resolveJsonModule`) is a trimmed, pt-BR-translated copy of a public exercise dataset:

- Source: **exercises-dataset** by hasaneyldrm — <https://github.com/hasaneyldrm/exercises-dataset> (1,324 exercises; MIT-licensed text/categories; original data at `data/exercises.json` in that repo).

Seeded once into `ExerciseLibrary` by `WorkoutService.seedExerciseLibrary()` (called from `_layout.tsx`). Deliberately **excludes the dataset's photos/GIFs** — that media is © Gym Visual, licensed separately from the dataset's MIT text; don't bundle or hotlink it without a separate license from them. `steps_en` (per-exercise instructions) were kept in English only (translating 1,324 short names was in scope this session; translating full instruction paragraphs wasn't) — don't surface them in the UI as-is without translating first, since all user-facing text must be pt-BR. If the upstream dataset is ever re-pulled/updated, re-run the same trim + pt-BR translation pass rather than bundling its raw fields directly.

**State**: no global store (Redux/Zustand) — state is per-feature via hooks (`useWorkout`, `useDashboard`) that wrap the service layer, plus a couple of small React Contexts for cross-cutting UI (`src/context/ProfileDrawerContext.tsx` for the profile side-drawer).

**Styling**: plain React Native `StyleSheet.create`, driven by design tokens from `src/constants/theme.ts` (`COLORS`, `SPACING`, `TYPOGRAPHY`, `SHADOWS`) — no hardcoded colors/sizes in components. Tailwind/NativeWind is present in the dependency tree and config (`tailwind.config.js`, `global.css`, `babel.config.js`) but is not actually used anywhere in the code (no `className` usage) — treat it as vestigial, not as the intended styling approach.

**Strings**: user-facing text is centralized in `src/constants/strings.json` (nested by feature, e.g. `STRINGS.diet.header.protein`) rather than inlined in JSX. Add new UI copy there, in pt-BR, matching the existing tone (see `.agents/rules/copywriting-and-microcopy-guide.md`).

**Path alias**: `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/components/useColorScheme`.

## Testing & visual verification workflow

There's no emulator/simulator in the agent's environment and no automated test suite — verification happens two ways, and both matter:

- **The user's phone via Expo Go** is the authoritative check (real native SQLite, real gestures/animations, no web-only quirks). Run `npx expo start` (defaults to port 8081) and have the user scan/connect from Expo Go on the same Wi-Fi (`exp://<lan-ip>:8081`).
- **The web target, driven headlessly**, is how the agent verifies its own changes without waiting on the user. Run `npx expo start --web --port 8082` (a *different* port so it doesn't disturb the phone's Metro instance), then drive it with Playwright (`@playwright/test`, installed as a devDependency; `npx playwright install chromium` once per machine). `metro.config.js` adds `wasm` to `resolver.assetExts` — required for `expo-sqlite`'s web worker to bundle at all.
  - **Never `page.goto()` for in-app navigation** after the first load — each `goto` is a full document reload, which remounts the whole app and (per the `:memory:` web DB above) wipes all data created so far in that test. Do the first load with `goto`, everything after with `page.click()`/`page.fill()` so Expo Router's client-side routing (pushState) keeps the same JS realm and DB connection alive.
  - `Alert.alert(...)` **does not render on React Native Web** — any flow gated behind an Alert button's `onPress` (e.g. a success dialog's "OK" triggering navigation) silently never fires there, even though it works fine natively. Don't build a flow that depends on it; navigate explicitly instead.
  - Write test scripts' file paths with forward slashes (`__dirname + '/name.png'`), never backslash string concatenation — this environment's shell tooling silently collapses `\\` to `\` inside heredoc-written files, which quietly breaks Windows paths built from doubled backslashes without erroring loudly.
  - `chromium.launch()` from repeated Playwright runs can leak `chrome.exe` processes on Windows; if the web target starts throwing SQLite/storage errors that a fresh `expo start --web` restart doesn't fix, check for and kill stray `chrome.exe` processes before assuming it's a real app bug.

## RN / Expo Router gotchas hit this session (avoid re-discovering these)

- **`router.back()` is unreliable from a screen registered as a "hidden" flat `Tabs.Screen`** (`href: null`, e.g. `app/(tabs)/workout/create.tsx`) rather than nested in a per-tab `Stack` — since there's nothing to pop within that screen's own history, it falls back to the tab navigator's default (first-registered) tab instead of the screen that pushed it. Confirmed on web; likely affects native too since it's the same router logic. Use explicit `router.replace('/(tabs)/<tab>')` instead of `back()` from these screens.
- **A plain `useEffect(() => {...}, [])` only runs once, on mount** — a tab screen that's already mounted (React Navigation tab navigators keep inactive tabs mounted by default) does *not* re-run it just because the user switched back to that tab. Any screen whose data can go stale from another screen's action (creating a program, finishing a workout) needs `useFocusEffect` (from `@react-navigation/native`) instead, or it'll show stale data until the app fully remounts.
- **Avoid the RN `gap` style property in this codebase** — it produced two real, reproducible bugs on the actual Android device (not just web): an icon overlapping following text in a row, and a horizontal scroll row getting squeezed to ~10px tall (clipping all its content) by a `flex: 1` sibling below it. Use explicit `marginRight`/`marginBottom` on individual children instead. Related: when a fixed-height element sits in a flex column next to a `flex: 1` sibling, also give it `flexShrink: 0` — without it, the fixed-height one can silently get compressed well below its specified `height` instead of the flexible sibling absorbing the difference.

## Project-specific conventions (`.agents/rules/`)

These five always-on rule files define house style beyond generic best practice; read them for full detail before larger changes:

- `react-programming-guide.md` — feature-based architecture (as above); prefer generic/composable components over one-off screen-specific ones; JSDoc-style `@description`/`@param`/`@returns` comments on hooks/services/non-trivial functions (see the existing style in `db.ts`, `WorkoutService.ts`); no direct DB/API calls from components — always through a service.
- `workflow-and-git-guide.md` — Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`); branch naming `feature/*`, `bugfix/*`, `refactor/*`.
- `copywriting-and-microcopy-guide.md` — all user-facing text in natural pt-BR, "premium personal trainer" voice, no guilt-tripping copy for missed workouts/streaks.
- `psycologic-and-sale-rules.md` — UI/UX behavioral-psychology conventions specific to this app: one primary CTA per screen, celebration/haptic feedback on completions, streaks prominent on the dashboard, red reserved for destructive actions/urgency (never for "you failed a workout").
- `multi-agent-workflow.md` — how work here is meant to be driven autonomously across four roles (Gestor + `design-ui-specialist`/`dev-specialist`/`tester` subagents in `.claude/agents/`), how they hand work to each other, and the specific cases where interrupting the user is still warranted instead of batching through to a finished result.

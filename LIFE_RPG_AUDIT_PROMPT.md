# Life RPG — Full Codebase Audit Prompt

## Context

This is a cloned repo of "Life RPG" — a gamified self-improvement Android app built with Expo (React Native) + TypeScript, following a manhwa-ink visual style (thick panel borders, halftone textures, zero border-radius, no neon, Anton/Noto Serif/Space Mono fonts). It was last actively worked on a while ago and has just been freshly cloned from GitHub. Before any new feature work, do a full audit and produce a prioritized fix list. **Do not fix anything yet — just audit and report.**

---

## 1. Environment & Dependency Health

- Check `package.json` vs installed `node_modules` — flag version mismatches.
- Run through Expo SDK version: is it outdated? Check against latest stable Expo SDK and flag breaking changes if we were to upgrade.
- List all deprecated or abandoned packages (especially `react-native-android-widget`, notification libs, any Expo modules with known deprecations).
- Check `expo-notifications`, `expo-router`, and any native modules for compatibility with current Expo SDK.
- Verify `app.json` / `app.config.js` — package name, permissions, versionCode/versionName, icons, splash config all still valid.
- Check `eas.json` build profiles — are they current, do they reference valid credentials/config?
- Confirm the app actually installs and boots (`npx expo install --check`, `npx expo-doctor`) — report every warning/error verbatim.

## 2. Build & Run Sanity Check

- Attempt a clean install (`rm -rf node_modules`, fresh install) and report any install-time errors.
- Attempt to start the dev server / build — capture and categorize every error and warning (not just the first one).
- Check for Android-specific build issues: Gradle version mismatch, minSdkVersion/targetSdkVersion vs current Android requirements, any native module linking issues.
- Flag any environment variables or secrets expected via `.env` that are missing from the repo (should be in `.gitignore` but confirm a `.env.example` exists or document what's needed).

## 3. TypeScript & Code Quality

- Run `tsc --noEmit` and list every type error, grouped by file.
- Run ESLint (or set it up if missing) and list every warning/error.
- Search for leftover `console.log`, `debugger`, commented-out dead code blocks, and TODO/FIXME markers — compile into a single list with file:line references.
- Identify unused imports, unused components, unused files (dead code not referenced anywhere in the router).
- Check for `any` types used as escape hatches — list where stronger typing should be reintroduced.

## 4. Architecture & File Structure Review

- Map out the current Expo Router folder structure — flag any inconsistent routing patterns, orphaned route files, or duplicate logic across screens.
- Check state management approach (Context/Zustand/Redux/whatever was used) — is it consistent across features, or did earlier features use one pattern and later features another?
- Review how local storage/persistence is handled (AsyncStorage/SQLite/MMKV) — confirm data schema consistency across: onboarding data, quest data, XP/leveling data, cycle tracking data, hair care logs.
- Check for any hardcoded values that should be config (API endpoints, feature flags, etc.)

## 5. Feature-by-Feature Functional Audit

For each feature below, confirm it still works end-to-end on a fresh clone, and flag anything broken, half-implemented, or inconsistent with the rest of the app:

- **Onboarding flow** — all steps navigable, data actually persists after completion, gender-inclusive module branching works correctly.
- **Cycle tracking module** — data entry, calculations, and display all functional; check date/timezone handling for bugs.
- **Hair care photo logging** — camera/gallery permissions still valid on current Android versions, photo storage/retrieval working, no orphaned image files.
- **Daily quest randomization** — verify the randomization logic actually produces variety (not stuck in a loop or always the same set), quests are gender-module aware if applicable.
- **XP / leveling system** — XP calculations correct, level-up triggers fire correctly, no overflow/edge case bugs (e.g., level cap, negative XP).
- **Android widgets** (`react-native-android-widget`) — confirm widget still renders on current Android versions, data sync between app and widget isn't stale/broken, widget click-through works.
- **Local push notifications** (in-universe "system message" styled) — permissions flow for current Android notification requirements (Android 13+ runtime permission), scheduled notifications actually fire, notification channel setup is correct, deep-linking from notification tap works.

## 6. UI/UX & Design System Consistency

- Confirm the manhwa-ink design system is consistently applied: thick panel borders, halftone textures, zero border-radius everywhere (flag any stray rounded corners), no neon colors anywhere.
- Confirm fonts (Anton / Noto Serif / Space Mono) are loading correctly and applied consistently — flag any screens still using system default fonts.
- Check responsiveness across different Android screen sizes/densities — flag any layout breakage.
- Check dark/light mode handling if applicable — any FOUC-type issues similar to what came up in the Premex project.
- Flag any inconsistent spacing, padding, or component reuse — are there multiple one-off implementations of what should be a shared component (buttons, cards, panels)?

## 7. Performance

- Identify unnecessary re-renders (missing memoization where clearly needed, inline function/object props causing re-renders in lists).
- Check list rendering (FlatList/FlashList usage) for quest lists, logs, etc. — proper key usage, no unbounded re-renders.
- Check image handling — are photo logs stored/loaded efficiently, any missing compression/resizing before storage.
- Check app startup time — anything blocking the JS thread unnecessarily on boot (heavy synchronous storage reads, etc.)

## 8. Security & Data Integrity

- Confirm no API keys, tokens, or secrets are hardcoded in the repo.
- Confirm local data storage doesn't expose sensitive personal data (cycle tracking, photos) in plaintext where it shouldn't be.
- Check file permissions/scoping for photo storage — confirm photos aren't accidentally world-readable or backed up somewhere unintended.

## 9. Git & Repo Hygiene

- Check `.gitignore` completeness (node_modules, .env, build artifacts, `.expo/` etc. all excluded).
- Check for any accidentally committed build artifacts, `.env` files, or large binaries that shouldn't be in version control.
- Review commit history briefly for any half-finished feature branches that might contain relevant uncommitted context.

---

## Output Format

Produce a single report with:

1. **Critical (blocks basic functionality)** — must fix before anything else.
2. **High priority (broken features / bad UX)** — fix soon.
3. **Medium (code quality / tech debt)** — fix opportunistically.
4. **Low (nice-to-have / polish)** — backlog.

For every item: file path, brief description of the issue, and suggested fix approach (not the full fix — just the direction). Do not start implementing fixes until I review this report and prioritize.

# Life RPG — Fix Prompt (Post-Audit)

Based on the audit report already completed. Apply fixes in the exact stage order below. After each stage, run `tsc --noEmit` and `npx expo-doctor` and confirm clean before moving to the next stage. Do not combine stages into one commit — keep them separable in case something needs to be reverted.

**Do NOT touch 2.1 (cycle tracking) or 2.2 (Android widget) — those are separate feature-scoping decisions, not fixes. Skip them entirely in this pass.**

---

## Stage 1 — Dependency sync (Critical 1.1)

- Run `npx expo install --fix` to align all Expo packages (expo, expo-router, expo-notifications, expo-splash-screen, expo-constants, expo-image-picker, expo-linking, expo-web-browser, expo-blur, @expo/ui, react-native-screens) to SDK 56 expected versions.
- Re-run `npx expo-doctor` and confirm it passes with no warnings.
- Run `npm audit fix` (non-breaking fixes only, do not force) and re-check `npm audit` afterward — note whether the 3 high-severity vulns (brace-expansion, js-yaml, postcss) are resolved by the SDK bump's transitive dep updates.

## Stage 2 — Remove dead code (Medium 3.1, fixes Critical 1.2 as a side effect)

- Delete the entire `src/` directory (all files under `src/app/`, `src/components/`, `src/hooks/`, `src/constants/theme.ts`, `src/global.css`).
- Confirm `tsconfig.json`'s `@/*` path alias — since nothing in real app code uses it, either remove the alias entirely or leave it defined but unused (your call, note which you chose).
- Run `tsc --noEmit` and confirm the two errors from `animated-icon.web.tsx` and `theme.ts` are now gone (they should disappear since the files no longer exist).

## Stage 3 — Remove duplicate component (High 2.5)

- Delete `components/XPBar.tsx` (the root-level dead duplicate — confirm zero imports reference it before deleting).
- Confirm `components/ui/XPBar.tsx` remains the single source of truth, still correctly imported by `components/ui/StatusHeader.tsx`.

## Stage 4 — Notification tap deep-linking (High 2.3)

- In `app/_layout.tsx`, add a `Notifications.addNotificationResponseReceivedListener` (near the existing font-load/splash effect).
- On response, read `response.notification.request.content.data.reminderId` (or whatever data shape `lib/notifications/scheduleQuestReminders.ts` currently sets) and route via `expo-router`'s `router.push` to the relevant screen (dashboard or the specific quest/no-fap screen tied to that reminder).
- If the current scheduled notifications don't yet attach a `data` payload identifying what they're for, add that payload at schedule time so the listener has something to route on.
- Test: schedule a reminder, background the app, tap the notification, confirm it lands on the right screen (note in your commit message that this needs a physical device test since notification tap can't be verified via static analysis).

## Stage 5 — Photo file cleanup (High 2.4)

- In `lib/haircareEngine.ts`, before/during `upsertHairLogEntry`, if a photo for that date/entry already exists, delete the old file from `Paths.document/hairlog/` before saving the new one.
- Apply the same logic to `app/workout-progress.tsx`'s image save path.
- Also add cleanup on entry deletion (if a hair log or workout log entry is deleted, delete its associated photo file too) — check if this path exists already and is just missing the file delete, or needs to be added.

## Stage 6 — Small code quality fixes (Medium 3.2, 3.3)

- Add `full: 999` to `theme.radius` in `constants/theme.ts`.
- Replace all ~15 hardcoded `borderRadius: 999` literals across `components/ui/RankSeal.tsx`, `components/LaunchScreen.tsx`, `components/ui/BottomNav.tsx`, `components/QuestCard.tsx`, `components/RankBadge.tsx`, `components/ui/QuestRow.tsx`, `app/milestones.tsx`, `app/goals.tsx`, `app/onboarding.tsx`, `app/workout-progress.tsx`, `app/profile.tsx` with `theme.radius.full`.
- Run `eslint --fix` to auto-resolve the `Array<T>` → `T[]` warnings in `lib/growthEngine.ts` and `lib/storage.ts`.
- Remove the unused `PersonalGoal` import in `lib/questEngine.ts:42`.
- Decide on the unused `shuffle` function in `lib/questEngine.ts:156` — either wire it into quest selection for actual randomization variety (check if `pickRandom` alone is producing enough variety, per audit 2.3 concern... wait, that's a different 2.3, cross-reference the original "daily quest randomization" concern) or delete it if `pickRandom` is confirmed sufficient. Note which you chose and why.

## Stage 7 — Documentation (Medium 3.5, 3.6)

- Add a short README note: this app has no external API dependencies and requires no `.env` file.
- In `eas.json`, decide and document a `versionCode` strategy (manual bump vs `appVersionSource: "remote"` auto-increment) before the next store submission — implement whichever you pick.

## Stage 8 — Pre-release check (Medium 3.7)

- Run `npx expo prebuild --platform android --clean` once to generate the native `/android` folder.
- Confirm `targetSdkVersion` meets the current Google Play minimum requirement (verify current requirement — it changes yearly, don't assume a hardcoded number is still current).
- Report the actual Gradle version and any native module linking warnings that surface during prebuild.
- Do not commit the generated `/android` folder (confirm `.gitignore` still excludes it after prebuild).

---

## After all stages

Run `tsc --noEmit`, `eslint`, and `expo-doctor` one final time and confirm all three are clean. Give me a final summary: what changed per stage, anything that didn't go as planned, and anything that needs a physical device to verify (notification deep-linking especially).

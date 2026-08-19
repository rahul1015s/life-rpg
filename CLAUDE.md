# CLAUDE.md — Life RPG ("Chronicle")

This file governs how Claude Code should work on this project. Read this and
DESIGN.md before writing or changing any UI code.

## What this app is

Life RPG is a gamified self-improvement app — the user tracks real-life habits,
discipline, and stats the way a manhwa/RPG protagonist tracks their own growth.
The visual identity is called **"Chronicle."** Everything in the app should feel
like it belongs inside that world: understated, serious, a little cinematic —
not a cheerful productivity app.

## Design system

All visual decisions (color, type, spacing, corner radius, iconography, motion,
component patterns) live in `DESIGN.md`. Do not invent new tokens ad hoc —
propose an addition to DESIGN.md first if something is missing, then implement.

## Working conventions

- **Numbered prompt files**: feature work is specified in numbered `.md` files
  (e.g. `12-onboarding-splash-integration.md`). Implement exactly what's in the
  file. If something is ambiguous or missing, stop and ask rather than guessing.
- **Section-by-section review**: for any multi-file change, go one file (or one
  logical unit) at a time. Show a diff/plan and wait for approval before moving
  to the next file. Never do a single giant multi-file dump.
- **Zero new dependencies by default**: use what's already in `package.json`.
  If a task genuinely needs a new library, stop and ask before installing —
  explain why the existing stack can't do it.
- **Physical device over emulator**: this app is tested on a real Android
  device, not just an emulator. Flag anything that might behave differently on
  device (font load timing, image decode delay, gesture responsiveness, widget
  behavior).
- **Don't break existing flows**: onboarding has gender-inclusive branching
  logic already built — any onboarding change must be additive to that, never
  a replacement of its logic, unless explicitly asked.
- **Match existing code style**: file structure, naming, and patterns already
  in the codebase win over "better" alternatives unless asked to refactor.

## Stack notes

- React Native / Expo
- Fonts: Cinzel (display/headline), Space Mono (data/stats/system-log text),
  Manrope (body/UI text) — see DESIGN.md for usage rules
- Android release build via EAS, signed keystore already configured
- Android widget via `react-native-android-widget`
- SDK 57 upgrade deferred — do not silently bump SDK version; flag it instead

## Play Store readiness (current phase)

The app is in Phase 4 — Play Store readiness. Be conservative with changes
that affect app size, permissions, or data collection (hair care photo
logging, cycle tracking) since these all need to be reflected accurately in
the Play Console Data Safety form. Flag any new permission or data collection
point instead of adding it silently.

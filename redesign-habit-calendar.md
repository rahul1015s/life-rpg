# Prompt: Habit-Tracker Calendar Screens

## Context

Read `CLAUDE.md` and `DESIGN.md` first — especially the new **§7 "Calendar / habit-tracker
screens — scoped exception"**, which documents that these specific screens intentionally
deviate from the rest of the app's design system (rounded shapes, multi-hue accents). This
is deliberate, confirmed, and scoped only to the screens below — do not apply it anywhere
else, and do not "correct" it back to gold-only/sharp-corners.

Reference mockups were shared in chat (4 images): a master "Calendar" screen showing multiple
habits at once, and per-habit detail screens for "Workout" and "NoFap".

**The bottom navigation bar is out of scope — keep the existing Chronicle tab bar (§6)
exactly as-is on all of these screens.** Only the screen content changes.

## Goal

### 1. Per-habit detail calendar (template, reused for Workout, NoFap, and other trackers)

Build this as a reusable template/component parameterized per habit, not copy-pasted per
screen:

- Header: back chevron, habit name (bold, large), subtitle tagline, a circular icon button
  (top-right) showing the habit's streak-flame or relevant icon in its accent color.
- Month calendar: prev/next month arrows, month+year label, day-of-week row (Mon–Sun),
  circular date badges. Each date badge shows the day number; today gets a glow ring in the
  habit's accent color. Below each date, render whatever the reference shows for that habit
  type (e.g. NoFap = single dot per day; Workout = small dot grid if the habit has sub-metrics,
  otherwise a simpler single indicator — check what data is actually available per habit and
  don't invent metrics that don't exist).
- Stat row below the calendar: 2–3 stat tiles (e.g. Current Streak, Best Streak, or Total
  Days / Success Rate / Relapse Count depending on the habit) — pull from whatever tracking
  data already exists for that habit (`NoFapTracker`, workout logs, etc.). If a stat shown in
  the reference doesn't have a backing data source, stop and ask rather than fabricating it.
- Optional quote/motivation card — small, understated, only if the habit already has
  associated flavor text; don't invent new copy fields.
- Primary CTA button — full-pill, habit's accent color, e.g. "Log Workout" or "I Stayed
  Strong Today" — wired to the existing completion/logging action for that habit, not new
  logic.
- Weekly progress row (M–S) if the habit has a simple daily-boolean tracking model, matching
  the Workout reference.

### 2. Master/unified calendar

- Full month grid, same circular-date-badge structure, but each day shows a small multi-dot
  grid (one dot/square per tracked habit, colored by that habit's accent) so the user sees
  cross-habit activity at a glance.
- Below the grid: a per-habit weekly checklist table (habit icon + name as rows, M–S as
  columns, checkmark/circle per day) — matching the reference's bottom section.
- This may already have a home — check if `app/command.tsx`'s "Discipline Calendar" /
  "Unified Calendar" section (seen in earlier screenshots) is meant to become this screen,
  or if a new route is needed. Ask if unclear.

## Constraints

- Zero new dependencies — check what calendar/date-grid logic already exists in the app
  (there's clearly existing calendar rendering elsewhere, e.g. NoFap tracker, workout
  calendar, achievement history) and reuse/generalize it rather than writing a new grid
  algorithm from scratch if one already exists.
- Do not touch any tracking/logging data logic, streak calculation, or completion state —
  presentation and layout only, wired to existing actions.
- Icons: use whatever icon library is already in the project (Tabler, per earlier sections)
  for the multi-hue icons here — this scoped exception doesn't require new illustrated art.
- If a habit referenced in the reference images (e.g. "Deep Work", "Read", "Meditate",
  "Journal") doesn't have a corresponding tracked habit in the data model yet, list what
  exists vs. what's missing before building, rather than inventing fake habits.

## Output

Propose the shared per-habit template's component structure first (props, what varies per
habit) before writing screen code — confirm the approach, then implement the template, then
each concrete screen (Workout, NoFap) that uses it, then the master calendar. Show a diff for
each and wait for approval before continuing.

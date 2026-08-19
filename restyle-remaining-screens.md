# Prompt: Restyle Weekly Review, Milestones, Progress Analytics, Linked Goal System to Chronicle

## Context

Four screens still use the pre-Chronicle look — pure black background, grey
(`#2A2A2A`-ish) cards, indigo/blue (`#4B5A7A`) primary buttons — the same
"generic blue" theme that `app/onboarding.tsx` had before its restyle pass.
Every other screen in the app (Home, NoFap, Work, Chronicle command center,
Badges) is already on the Chronicle navy/gold theme, so these four are now
the visible inconsistency.

Read `CLAUDE.md` and `DESIGN.md` before writing any code.

## Screens in scope

Identify the actual files for these four (likely under `app/`) — based on
their content:

1. **Weekly Review** — "Wins, misses, lessons, next move" / Current Week
   Draft / Past Reviews
2. **Milestones / Vision** — "30-day, 90-day, and 1-year direction" / Add
   Milestone / no milestones state
3. **Progress Analytics** — "History Archive" — XP Tracking, Monthly Summary,
   Streak History, Improvement Grid, Daily History
4. **Linked Goal System** — "Personal Goals" — Create Goal / no goals state

## Goal

Bring all four to base Chronicle theme parity with the rest of the app —
this is a **base theme pass, not a full redesign** (Phase 2/3 will add
illustration and iconography later; don't build anything that phase would
have to tear out).

- Background: `chronicleColors.bgBase`
- Section headers/eyebrows ("WEEKLY REVIEW", "HISTORY ARCHIVE", "PERSONAL
  GOALS", "MILESTONES / VISION"): Space Mono, small, `textMuted` — matches
  the system-readout label pattern already used elsewhere (e.g. "STEP 1/3")
- Card containers: reuse `ChronicleCard` (accept its current 6px radius,
  consistent with the rest of the app per the earlier accepted flag)
- Headlines inside cards ("Wins, misses, lessons, next move", "30-day,
  90-day, and 1-year direction", etc.): Cinzel, `textPrimary` or `accentGold`
- Body/description text: Manrope, `textPrimary`/`textMuted`
- Data readouts (XP numbers, streak counts, "0/2", "0 active"): Space Mono,
  matching how stats are styled on Home/Progress screens already
- Primary buttons ("Edit This Review", "Add Milestone", "Create Goal"):
  replace `#4B5A7A` indigo with `ChronicleButton` (accentGold, matching every
  other primary action in the app)
- Empty states ("No milestones yet", "No goals yet", "No saved weekly
  reviews yet", "No monthly data yet", "No history yet"): keep the copy,
  restyle the container to `bgSurface`/`bgSurfaceRaised` with
  `borderSubtle`, text in `textMuted`
- "Improvement Grid" heatmap swatches: keep the grid structure, but replace
  the blue/red/yellow scale with a Chronicle-appropriate scale — muted
  `bgSurfaceRaised` (none) → `accentGoldMuted` (low) → `accentGold` (medium)
  → a brighter/warmer gold or white-gold highlight (high). Do not introduce
  a new hue family (no blue, no red) for this specific grid.
- Bottom nav bar on these screens: confirm it matches the Classic +
  active-underline pattern from DESIGN.md §6 — if it's already shared across
  the app, no change needed here; flag if these screens render their own nav.

## Constraints

- Zero new dependencies.
- Do not change any data logic, state, or what's calculated/displayed —
  visual layer only, same as the onboarding form restyle.
- Match existing code style/file structure.
- Reuse `ChronicleCard`, `ChronicleButton`, `ChronicleInput` and any other
  established Chronicle components rather than writing new one-off styles.

## Output

Go screen by screen (4 sections). For each, show a diff and wait for
approval before moving to the next.

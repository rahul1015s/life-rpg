# Prompt: Restyle Onboarding Profile Form to Chronicle

## Context

`app/onboarding.tsx` (the 3-step profile form: name/gender → date of birth → growth baseline)
still uses its original unstyled look — plain black background, default system font, generic
blue buttons, black pill inputs. It was deliberately left untouched during the welcome-carousel
work to protect its gender-branching logic. Now that `app/welcome.tsx` (the illustrated intro)
is polished and matches Chronicle, this form is a visible mismatch right after it — same app,
two completely different visual languages back to back.

Read `CLAUDE.md` and `DESIGN.md` before writing any code.

## Goal

Restyle `app/onboarding.tsx` (all 3 steps) to match the Chronicle design system, **visual layer
only** — do not change any state logic, validation, branching logic (especially the gender
selection that drives `PlayerProfile.gender`), or the data collected.

### Apply from DESIGN.md / theme/chronicle.ts:

- Background: `chronicleColors.bgBase`
- Card/step container: `chronicleColors.bgSurface`, with `chronicleColors.borderSubtle` hairline
  border if a border is used — corner radius `4px` max per DESIGN.md section 3 (no soft/pill
  radius on the card itself)
- Headlines ("Create your system profile", "When were you born?", "Set your growth baseline"):
  Cinzel, `chronicleColors.textPrimary` or `accentGold` — check DESIGN.md's type scale for
  section-title size (24/30)
- Body/description text: Manrope, `chronicleColors.textPrimary` or `textMuted` as appropriate
- Step indicator ("STEP 1 / 3"): Space Mono, small, `textMuted` — this is a system-readout-style
  label, matches the "Data / System" font role in DESIGN.md section 2
- Text inputs (Name, Date of Birth, Wake Time, Sleep Target): dark surface matching
  `bgSurface`/`bgSurfaceRaised`, hairline `borderSubtle` border, `4px` radius, `textPrimary` text
- Selectable pills (Male/Female, Body/Confidence/Coding/etc targets, Beginner/Normal/Serious,
  All-Rounder): replace the current default-blue selected-state with `accentGold` background +
  dark text when selected, `bgSurface` + `textMuted` border when unselected — do NOT keep the
  current blue. Keep them as pills/rounded here specifically, since these read as tags/chips,
  not structural cards (this is one of the few places DESIGN.md's "sharp corners" rule can flex,
  since chip-style selection controls are a different UI role than cards/buttons — use your
  judgment, but stay consistent across all pills in this form)
- Toggle (Hair Treatment Tracking): restyle track/thumb to use `accentGold` (on) /
  `bgSurfaceRaised` (off) instead of the current default
- Primary action buttons (Next / Initialize Profile): full-width, `accentGold` background,
  dark text (check contrast against gold — likely `bgBase` or near-black), `4px` radius, Manrope
  semibold — same button style as `ChronicleButton` if that component is reusable here; use it
  directly rather than re-styling a plain `Pressable` if it fits
- Secondary action (Back): outlined `accentGold` border, transparent background, matching what's
  already in the LaunchScreen/welcome button patterns if any exist

## Constraints

- Zero new dependencies.
- Do not touch `onboarding.tsx`'s state management, step transitions, validation (e.g. the
  age 13–100 range check), or what data gets saved to `PlayerProfile`.
- If `ChronicleButton` or other existing themed components already exist and fit a given
  element, reuse them instead of writing new styles from scratch.
- Match existing code style/file structure.

## Output

Go step-by-step: first shared/common styles (background, card, headline treatment used across
all 3 steps), then step 1, then step 2, then step 3. Show a diff for each and wait for approval
before continuing.

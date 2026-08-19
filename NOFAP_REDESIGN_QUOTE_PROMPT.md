# Life RPG — No-Fap Screen Redesign + Daily Discipline Quote

## Context

The current `app/no-fap.tsx` screen needs a full visual redesign. It should strictly follow the app's existing manhwa-ink design system (thick panel borders, halftone textures, zero border-radius via `theme.radius`, no neon colors, Anton/Noto Serif/Space Mono fonts) — the same system already applied consistently across the rest of the app (confirmed clean in the last audit). This screen currently feels flat/generic compared to the rest of the app and needs to match that visual bar.

Remember: this screen already branches copy by gender (`getDisciplineCopy` — "No Fap" for male, "Discipline / No Porn" for female). The redesign must preserve that branching logic, just give it a stronger visual treatment.

---

## Part 1 — Audit current screen before redesigning

Before writing new UI code:

- Read `app/no-fap.tsx` fully and list every UI section currently on the screen (streak counter, relapse button, stats, motivational copy, whatever else exists).
- Check which shared components it already reuses (`components/ui/*`) vs one-off styles defined locally in this file.
- Note where it currently diverges from the design system (flat cards, missing borders, wrong fonts, generic spacing) — this becomes the fix list for Part 2.

## Part 2 — Redesign the screen

Rebuild the visual hierarchy using the existing shared components wherever possible (don't create new one-off styled components if `components/ui/` already has an equivalent — reuse `RankSeal`, `QuestCard`/`QuestRow` patterns, `StatusHeader`, etc. where they fit conceptually).

Suggested structure (adapt based on what's actually meaningful for this screen, don't force-fit):

- **Hero/streak section** — the current streak count should be the visual focal point, manhwa-ink panel treatment (thick border, halftone texture background), bold Anton numerals.
- **Daily quote card** (see Part 3) — placed prominently, likely just below or beside the streak hero.
- **Progress/milestone section** — if there's a "days until next rank/milestone" concept already elsewhere in the app (check `lib/mensHealthEngine.ts` and `RankBadge`/`RankSeal` components), surface it here consistently with how it's shown elsewhere.
- **Action button** (relapse/reset, or whatever the core interaction is) — should feel weighty/deliberate given what it represents, not a throwaway button. Use the app's primary button treatment from `components/ui/`.
- **Supporting stats** — whatever secondary data currently exists (streak history, longest streak, etc.) — use `QuestRow`-style rows or the equivalent list pattern already used elsewhere in the app for consistency.

Keep gender-based copy branching intact — do not restructure that logic, only restyle the container it lives in.

## Part 3 — Daily discipline quote system

Build a quote system with these behaviors:

- **One quote per day, not per screen-load** — the same quote should show all day regardless of how many times the screen is opened, then change the next day. Use a deterministic selection (e.g., day-of-year modulo pool size), not random-on-render, so it doesn't feel jarring on repeat visits.
- **Local quote pool, no external API** — this app has no external API dependency (confirmed in audit) and shouldn't start needing one for this. Store the quote pool as a local constant array (e.g., `constants/disciplineQuotes.ts`).
- **Gender-aware if relevant** — decide whether quotes need separate male/female pools or whether a shared discipline-themed pool works for both (given the existing copy branches by gender elsewhere, check if a shared tone works or if separate framing is needed — your call, but keep it consistent with how `getDisciplineCopy` already handles this split).
- **Pool size** — write at least 60 original quotes (so roughly 2 months before repeats) in a tone that fits the app: direct, discipline/recovery-focused, no cheesy generic "believe in yourself" filler — should feel like it belongs in the same universe as the rest of the app's copy (check existing copy tone in `constants/mensHealth.ts` and `getDisciplineCopy` for voice reference).
- **Visual treatment** — quote card should follow the same panel style as everything else (thick border, no radius), not a floating text with no container.

## Part 4 — Verify

- Confirm `tsc --noEmit` and `eslint` stay clean after changes.
- Confirm the screen still respects both gender branches (test switching gender in onboarding/profile settings and confirm the correct copy variant shows alongside the new visual design).
- Confirm the quote actually changes date-to-date (can be tested by temporarily forcing a different day-of-year value, then reverting the test change).
- Report back with a summary of what changed and any design decisions you had to make where this prompt left something open-ended (e.g., gender-specific quote pools vs shared).

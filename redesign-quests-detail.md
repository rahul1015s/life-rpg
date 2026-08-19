# Prompt: Redesign Quests List + Quest Detail Screens

## Context

Reference mockup shows two screens: a Quests list (Daily/Weekly/Challenges tabs) and a Quest
Detail screen (large circular icon, XP reward, progress, mark-complete). Read `CLAUDE.md` and
`DESIGN.md` (§7 especially) before writing any code.

By this point, `quest-*.webp` icons should already be wired into `QuestCategoryIcon` from the
dashboard pass — reuse that component here rather than re-implementing category icon logic.

## Goal

### Quests list screen

1. Header: back chevron, "QUESTS" title (Cinzel + accentGold), small calendar icon (right).
2. Tab row: Daily / Weekly / Challenges — active tab gets the accentGold underline pattern
   from DESIGN.md §6 (reuse whatever tab component already exists in the app, if any).
3. Date label ("Today, 18 May" style) — Space Mono, textMuted, matches other date readouts
   established in the Weekly Review restyle.
4. Quest list rows: reuse `ChronicleQuestCard` with `showCategoryIcon` on (already built in
   the dashboard pass), title + subtitle + XP + `WaxSeal` completion state — this should be
   near-identical to the dashboard's quest rows, just in a dedicated list rather than a
   "today only" preview.
5. "+ Add Custom Quest" button — full-width `ChronicleButton`, accentGold, matching every
   other primary action in the app.

### Quest Detail screen

1. Header: back chevron, "QUEST DETAIL" title (Cinzel + accentGold).
2. Large circular badge at top-center — use the quest's matching `quest-*.webp` category icon
   at a larger size (80–96px) inside a thin gold ring, matching the ornamental circle style in
   the reference (radiating sparkle motif is already baked into the icon art, don't add more
   decoration around it).
3. Quest title (Cinzel, large) + description (Manrope, textMuted).
4. Data rows (XP Reward, Progress, Mark as Complete, History): label (Manrope, textMuted) +
   value (Space Mono, textPrimary/accentGold) pairs, each in its own row with a hairline
   `borderSubtle` divider — not full cards, a simple stacked list.
5. Progress bar under "Progress" row if the quest has a numeric target — reuse
   `ChronicleProgressBar` (already at 4px radius from the dashboard pass).
6. "Mark as Complete" — reuse whatever completion interaction pattern already exists
   (`WaxSeal` / `handleCompleteQuest`), do not invent a new completion mechanism.
7. Footer quote block (the reference shows an italic motivational line, e.g.
   "Distractions are the enemies of progress. — The System") — Manrope italic, textMuted,
   in a subtle `bgSurface` card. If quests don't currently carry a quote/flavor-text field,
   stop and ask whether to add one or omit this element for quests that lack it.

## Constraints

- Zero new dependencies.
- Do not touch quest data logic, completion logic, XP calculation, or navigation between
  these two screens — identify the actual existing files first and treat this as a
  presentation-layer pass, same as every prior restyle.
- Reuse `ChronicleCard`, `ChronicleButton`, `ChronicleQuestCard`, `ChronicleProgressBar`,
  `QuestCategoryIcon`, `WaxSeal` — do not create parallel one-off versions of anything that
  already exists.
- If quest categories, tabs (Daily/Weekly/Challenges), or a quote/flavor-text field don't
  already exist in the data model matching what the reference implies, stop and ask rather
  than inventing new data shape.

## Output

Go screen by screen: Quests list first (header, tabs, list, add-button), then Quest Detail
(header, icon, title/description, data rows, footer quote). Show a diff for each subsection
and wait for approval before continuing.

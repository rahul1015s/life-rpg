# Prompt: Redesign Dashboard/Home Screen

## Context

The reference mockup (shared in chat, "Life RPG" dashboard) shows the target layout. Read
`CLAUDE.md` and `DESIGN.md` (especially the new §7 "Illustrated component system") before
writing any code.

New assets are in place at:

```
assets/images/avatar/avatar-bust.webp
assets/images/icons/quest-{fitness,coding,social,discipline,study}.webp
assets/images/emblem/level-seal.webp
assets/images/decorative/streak-ring.webp
```

## Goal

Redesign the Home/Dashboard screen to match the reference layout:

1. **Header**: hamburger/menu icon (left) opening the side drawer, "LIFE RPG" wordmark in
   Cinzel + accentGold, notification bell icon (right).
2. **Identity card**: `avatar-bust.webp` in a circular gold-ring frame (left), name +
   class/title (e.g. "Seeker") in Manrope, a small "LEVEL n" badge. To the right, keep this
   area light — the reference shows a large full-body silhouette bleeding off-canvas on the
   right edge; treat that as optional atmosphere, not required if it complicates layout —
   flag if you'd rather skip it for this pass.
3. **XP bar**: "XP 1,250 / 2,000" label + horizontal progress bar, `accentGold` fill on
   `bgSurfaceRaised` track, `4px` radius per DESIGN.md §3.
4. **Stat row** (4 stats: Quests Done, Current Streak, Chronicle Score, XP Gained): small
   icon + number + label, Space Mono for the numbers (data readouts per DESIGN.md §2).
5. **Today's Quests** section: section header ("TODAY'S QUESTS" — Space Mono, textMuted,
   matches the eyebrow pattern) with a "View All" link (accentGold, Manrope). List rows,
   each with:
   - The matching `icons/quest-*.webp` category icon (map by quest category — ask if the
     category taxonomy isn't already in the data model)
   - Title (Manrope semibold) + subtitle (Manrope, textMuted)
   - XP value (Space Mono, accentGold)
   - A checkbox/circle completion indicator (reuse whatever pattern already exists for quest
     completion, if any — don't invent a new one)

## Constraints

- Zero new dependencies.
- Do not touch quest data logic, XP calculation, or completion state — this is presentation
  only, same as every prior restyle pass.
- Reuse `ChronicleCard`, `ChronicleButton`, and existing typography/spacing tokens.
- Match existing code style/file structure — identify the actual dashboard file(s) first.
- If quest categories in the data model don't map 1:1 to the 5 icon assets (fitness, coding,
  social, discipline, study), stop and ask for the mapping rather than guessing.

## Output

Go section by section: header, identity card + XP bar, stat row, quest list. Show a diff for
each and wait for approval before continuing.

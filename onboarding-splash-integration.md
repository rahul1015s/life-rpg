# Prompt: Onboarding Screens + Splash Screen — Chronicle Asset Integration

## Context

Life RPG uses the "Chronicle" design system (obsidian navy, warm gold, Cinzel/Space Mono/Manrope
fonts, manhwa-ink aesthetic). New illustrated background assets have been generated and added to
the project at:

```
assets/images/onboarding/onboarding-01-begin.webp
assets/images/onboarding/onboarding-02-stats.webp
assets/images/onboarding/onboarding-03-hardmode.webp
assets/images/onboarding/onboarding-04-rewards.webp
assets/images/splash/splash-sigil.webp
```

Each onboarding image has a dark, empty negative-space region in the bottom third — that's
where headline + body text should sit. Do not crop or reposition the images; design them
around that existing composition.

Before writing any code, read AGENTS.md / CLAUDE.md / DESIGN.md in this repo to confirm current
design tokens (colors, spacing scale, font family names as registered in the project) and the
existing onboarding flow structure (there's already gender-inclusive branching logic in
onboarding — do not remove or break that).

## Goal

1. Replace/update the onboarding flow screens to use the 4 new webp images as full-bleed
   backgrounds, one per screen, in this exact order with this exact copy (do not alter the
   wording — it's final):
   - **Screen 1** — `onboarding-01-begin.webp`
     - Headline: "Begin the Chronicle"
     - Body: "Every day writes a page. Start tracking yours."

   - **Screen 2** — `onboarding-02-stats.webp`
     - Headline: "Track Your Stats"
     - Body: "Discipline, habits, growth — logged as stats, not guilt."

   - **Screen 3** — `onboarding-03-hardmode.webp`
     - Headline: "Face Hard Mode"
     - Body: "Skip a quest, take the debuff. The System doesn't forgive — but it's fair."

   - **Screen 4** — `onboarding-04-rewards.webp`
     - Headline: "Claim Your Rewards"
     - Body: "Complete quests. Level up. Watch the Chronicle grow with you."

2. Text overlay: headline in Cinzel (bold, gold), body in Manrope (regular, off-white/bone),
   positioned in the bottom-third negative space of each image. Respect safe-area insets.
3. Navigation: swipeable between screens, dot pagination indicator (gold active dot, muted
   inactive), Skip button (top-right) and Next/Get Started button (bottom), consistent with
   whatever navigation library is already used in the project (check existing onboarding code
   before introducing a new one).
4. Preserve the existing gender-inclusive onboarding branching — this asset/text layer is
   additive to that flow, not a replacement of its logic.
5. Splash screen: configure `app.json` (or `app.config.js`) to use
   `assets/images/splash/splash-sigil.webp` as the splash image, background color matching
   Chronicle's obsidian navy token, correctly configured for both Android adaptive splash and
   Expo's splash screen API (resizeMode: contain, no stretching/cropping the sigil).
6. Do NOT introduce new npm dependencies for this — use what's already in package.json unless
   something is genuinely missing (e.g. a carousel/pager lib), in which case stop and ask before
   installing.

## Constraints

- Zero new dependencies unless explicitly approved.
- Match existing code style and file structure in the onboarding module.
- Physical-device rendering matters more than emulator — flag anything that might behave
  differently on a real Android device (e.g. font loading timing, image decode delay).
- Show me a diff/plan for each file before writing it, section by section — do not do a single
  giant multi-file dump.

## Output

Go file by file: first the splash config, then each onboarding screen (or the shared
onboarding component + per-screen data if it's already data-driven). Pause after each for
review before continuing to the next.

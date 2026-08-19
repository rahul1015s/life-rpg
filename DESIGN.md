# DESIGN.md — Chronicle Design System

Life RPG's visual identity. Every screen should look like it belongs in the
same world: a quiet, cinematic, ink-on-parchment fantasy system — not a bright
gamified productivity app.

## 1. Color

**Source of truth: `theme/chronicle.ts`.** This table must always match what's shipping in
code — if they ever disagree, the code wins and this table is stale until corrected. Token
names below are `chronicleColors` export names, not invented aliases — DESIGN.md's job is to
describe intent/usage, not to rename what the code already calls things.

| Token (`chronicleColors.*`) | Hex       | Use                                                                                                                |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `bgBase`                    | `#12141C` | Obsidian navy — base background, all screens                                                                       |
| `bgSurface`                 | `#1C2030` | Cards, sheets, tab bar — first elevation step (subtle background-color change, no shadow)                          |
| `bgSurfaceRaised`           | `#242A3D` | Second elevation step — e.g. a card raised above another card. Use sparingly; most surfaces only need `bgSurface`. |
| `accentGold`                | `#E8B34D` | Primary accent — active states, CTAs, headline highlights, icons in focus                                          |
| `accentGoldMuted`           | `#927339` | Inactive/secondary gold — disabled states, muted icons, inactive nav indicators                                    |
| `textPrimary`               | `#EDE7DB` | Body text / bone white                                                                                             |
| `textMuted`                 | `#9A96A8` | Captions, timestamps, secondary labels                                                                             |
| `accentEmber`               | `#D64545` | Hard Mode penalties, relapse/destructive actions — desaturated red, not neon                                       |
| `accentJade`                | `#4FAE8B` | Quest completion, "clean"/positive state — muted sage-jade, not neon green                                         |
| `borderSubtle`              | `#33384A` | Hairline borders — card outlines, tab bar top border, dividers                                                     |

No neon, no glassmorphism, no gradients as a crutch. If a gradient is used
(e.g. splash background glow), it must be a tight navy→black falloff, never a
multi-color gradient.

## 2. Typography

| Role               | Font              | Use                                                                                                        |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Display / Headline | **Cinzel** (bold) | Screen titles, onboarding headlines, level-up moments                                                      |
| Data / System      | **Space Mono**    | Stats, numbers, quest logs, "System Log" notifications — anything that should feel like a game HUD readout |
| Body / UI          | **Manrope**       | Body copy, buttons, form labels, everyday UI text                                                          |

Type scale (base 16px, 1.25 ratio):

- Display: 32 / 40 (headline), 24 / 30 (section title)
- Body: 16 / 24 (default), 14 / 20 (secondary/caption)
- Data: 14 / 20 mono, letter-spacing +0.5px for stat readouts

Cinzel is used sparingly — never for body paragraphs, only short headline-length
strings. If a heading needs more than ~6 words, drop to Manrope bold instead.

## 3. Spacing & corner radius

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 (px), no arbitrary values.
- **Corner radius: sharp, not soft.** Buttons, cards, and inputs use `4px`
  max — this is intentional and matches the ink/manhwa aesthetic (a fully
  rounded pill or `16px+` card reads as generic SaaS, not Chronicle). Full
  square corners (`0px`) are acceptable and often preferred for system/data
  elements (stat cards, quest logs). Reserve any visible rounding for touch
  targets that need it for usability (nav bar icons' hit area, not their
  visual shape).

## 4. Iconography & motion

- Icons: thin-line, monochrome (gold or bone), never filled/glyph-heavy —
  matches the ink linework of the illustrated assets.
- Motion: minimal and purposeful. Level-up/quest-complete moments can have a
  brief gold particle/glow flourish (matches the onboarding illustration
  style). Everyday navigation transitions should be fast and understated —
  no bouncy/playful easing.

## 5. Illustrated assets

Full-bleed illustrated backgrounds (onboarding, splash) follow a consistent
character: a lone hooded figure, thin gold ink linework on obsidian navy,
manhwa ink-wash shading. See `assets/images/onboarding/` and
`assets/images/splash/`. New illustrations must match this same character
description and palette — do not introduce a different color grade or art
style without updating this doc first.

## 6. Navigation

**Pattern: Classic bottom tab bar + active-text/underline indicator.**

- 4–5 items max, icon + label, always visible (not a floating/collapsing rail).
- Inactive state: `chronicleColors.accentGoldMuted` icon + `chronicleColors.textMuted` label.
- Active state: `chronicleColors.accentGold` icon + `chronicleColors.textPrimary` label, plus a
  thin 2px gold underline beneath the active item (a "rune mark," not a pill
  or filled background).
- No circular/diamond floating CTA button in the tab bar — this app has no
  single dominant "add" action that deserves that treatment.
- No glassmorphism/blur background on the tab bar — solid `chronicleColors.bgSurface`
  with a `chronicleColors.borderSubtle` top hairline border, square top corners
  or `4px` max, matching section 3.
- Spec reference (spacing/sizing only, not visual style): standard mobile
  navbar guideline — icon 24px, ~74px per tab column, label 12px, 2px active
  indicator thickness.

## 7. Calendar / habit-tracker screens — scoped exception

**This section documents an intentional, scoped deviation from §§1–4.** It applies ONLY to
calendar and individual habit-tracker detail screens (e.g. the Workout tracker, the NoFap
tracker, and the master/unified habit calendar). It does NOT apply to Dashboard, Quests,
Achievements, Rewards, Profile, or any other screen — those stay on the standard Chronicle
system exactly as specified elsewhere in this document. The bottom navigation bar is
explicitly out of scope for this exception too — it stays the existing Chronicle tab bar
(§6) on every screen, including these.

Rationale: these screens intentionally borrow a different, deliberately chosen reference
style — rounded shapes and a multi-hue per-habit accent palette — rather than Chronicle's
sharp-corner, single-gold-hue system. This is a product decision, not an oversight; do not
"fix" it back to gold-only or sharp corners.

### What's different here

- **Corner radius**: full circles/pills allowed (date badges, CTA buttons, icon containers)
  — §3's 4px-max rule does not apply within this scope.
- **Color**: each habit type gets its own accent hue instead of gold-only:
  - Workout — amber/gold, approx `#F5A93F` (close to `accentGold`, can reuse it)
  - Deep Work / focus habits — purple, approx `#8B5CF6`
  - Read / learning habits — teal, approx `#22D3C7`
  - Meditate / mindfulness habits — purple, approx `#A78BFA`
  - Journal / reflection habits — orange, approx `#F97316`
  - NoFap / discipline-specific trackers — amber/gold (same as Workout), consistent with the
    reference screens shown for that tracker
  - These are approximate — pick close, readable values; exact hex isn't critical as long as
    each habit type is visually distinct and consistent across its own screens.
- **Background**: still dark navy, close to `bgBase`/`bgSurface` — this part stays aligned
  with the rest of the app so these screens don't feel like a different app entirely.
- **Typography**: body/UI text can use a rounded sans (existing `Manrope` is fine for this —
  don't add a new font family/dependency just for this pocket) rather than reaching for
  Cinzel on headings here; keep headings simple and bold rather than display-serif.
- **Calendar grid**: circular date badges, each with a small dot/square mini-grid beneath
  showing per-habit completion for that day (as in the reference), today's date gets a glow
  ring in its habit's accent color.
- **Streak stat rows, quote/motivation cards, and primary CTA buttons**: full-pill shape,
  habit's accent color as the fill/border, per the reference screens.

If a new habit-tracker screen is added later, match this section's style, not §§1–4.

## 8. Illustrated component system (avatar, icons, badges)

A second asset layer beyond onboarding/splash: character portraits, category icons,
achievement badges, reward icons, and decorative emblems. All generated to match the
established character (lone hooded figure, thin gold ink linework, obsidian navy).
Files live under `assets/images/{avatar,hero,icons,badges,rewards,emblem,decorative}/`.

- **Avatar frame**: circular portrait (`avatar-bust.webp`), wrapped in a thin `accentGold`
  ring border (2px), no drop shadow — glow via a soft radial gradient behind the circle if
  used on a dark hero panel, not via native shadow.
- **Category icons** (`icons/quest-*.webp`): pre-rendered circular gold-ink badges, already
  self-contained (no additional frame needed). Use at 40–48px in list rows, larger (64px+)
  in quest detail headers.
- **Achievement badges** (`badges/badge-*.webp`): circular, already framed with their own
  ring border and dark fill — render at consistent size per grid, don't recolor or add
  another border around them.
- **Reward icons** (`rewards/reward-*.webp`): same treatment as category icons, used in the
  Rewards store list.
- **Level seal** (`emblem/level-seal.webp`): the ornate diamond sigil, used large (120px+)
  on the Level/Progress screen as a level-rank emblem, and small as a level-up indicator
  elsewhere.
- **Streak ring** (`decorative/streak-ring.webp`): a decorative flame ring — used as a
  background layer behind the streak-day number, not as a functional progress ring (it's
  static art, not data-driven arc fill).
- **Hero full-body art** (`hero/hero-fullbody-*.webp`): full-bleed illustration for the
  Profile screen side panel and the navigation drawer background — always paired with a
  `bgBase`-toward-transparent scrim so overlaid text/nav items stay legible, same pattern as
  LaunchScreen section 2.

None of these assets are tinted or recolored at runtime — they ship pre-colored in gold ink
and are placed as-is. Do not apply `tintColor` unless a specific state (e.g. locked/greyed
achievement) requires a `Grayscale`/opacity treatment.

## 9. What to avoid

- Rounded pill navigation, floating glass rails, animated expanding tabs —
  all read as generic fintech/SaaS, not Chronicle.
- Any bright/saturated accent color outside the palette above.
- Drop shadows for elevation — use a subtle background-color step
  (`bg.primary` → `bg.elevated`) instead, consistent with prior projects'
  "no box-shadow, elevation via surface change" rule.

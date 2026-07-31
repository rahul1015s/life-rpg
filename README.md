# Life RPG

Life RPG is a self-improvement app built with Expo, React Native, and Expo Router. It turns discipline, habits, recovery, and personal growth into an RPG-style progression loop with quests, XP, stats, streaks, milestones, and unlocks.

## Core idea

The app treats real-life consistency like game progression:

- complete daily quests
- earn XP and level up
- improve core stats like discipline, focus, stamina, confidence, and strength
- track streak-based systems like NoFap and workouts
- unlock achievements, titles, and theme-style rewards
- recover from missed days using punishment and recovery prompts

## Main features

### Dashboard command center

The dashboard is the home base of the app. It now includes:

- persistent bottom navigation across the main app
- quick access to NoFap, workout progress, calendar, and achievements
- quest streak and NoFap streak at the top
- daily main quests and bonus quests
- punishment preview when important quests are left incomplete
- boss battle progression for weekly, 30-day, and 90-day discipline milestones
- reward inventory previews for unlockable titles and themes
- avatar evolution summary based on your strongest stats
- shared calendar-based NoFap preview
- fast entry points to goals, milestones, reviews, achievements, history, and insights

### Daily quest system

- generates daily quests based on your profile and goals
- supports main quests and bonus quests
- tracks completion history and streaks
- rewards XP and stat gains on completion
- includes custom quest support

### Leveling and progression

- XP-based leveling system
- rank progression
- stat growth across strength, stamina, focus, discipline, charisma, confidence, creativity, appearance, communication, and style
- achievement unlock rewards
- goal-completion rewards

### NoFap and discipline tracking

- daily NoFap and NoPorn logging
- current and best streak tracking
- calendar view for streak consistency
- quick "mark clean" action directly from the dashboard
- relapse-aware tracking that feeds recovery features
- dedicated NoFap consistency calendar
- under-18 simplified discipline view using DOB-based gating

### Workout progress

- log strength, cardio, mobility, and sports sessions
- choose morning, evening, or both for session timing
- view a workout calendar with completed days marked in green
- track duration, sets, reps, weight, effort, and notes
- attach workout progress photos
- local image saving
- workout summaries on dashboard and workout screen

### Habit and discipline calendar

- monthly habit consistency calendar
- shared calendar-based NoFap board
- quest activity intensity view
- active-day and strong-day summaries

### Boss battles, punishment, and rewards

- weekly milestone boss battle
- 30-day NoFap boss battle
- 90-day long-form discipline boss battle
- punishment preview when quests are missed
- recovery/atonement suggestions
- inventory-style unlock previews for titles and themes
- avatar evolution messaging based on build direction

### Goals and milestones

- long-term personal goals
- progress percent tracking
- goal rewards
- milestone planning for 30-day, 90-day, and 365-day arcs
- active and completed milestone states

### Achievements

- quest milestones
- streak milestones
- XP milestones
- category milestones
- level milestones
- men’s health milestones

### Insights and recovery systems

- smart quest suggestions
- recovery suggestions after weak days
- weekly review support
- dopamine-control, sleep-recovery, and related self-regulation screens already included in the app

### Hair care tracking

- optional minoxidil / hair care tracking
- morning and night application logging
- local progress photo capture
- hair consistency streaks

### Notifications and widgets

- local quest reminder support through `expo-notifications`
- reminder flow styled in-app as quest scroll / quest log prompts
- DOB-aware reminder settings with per-reminder time selection

Important note:

- Android home-screen widget work is intentionally deferred until a real prebuild/dev-client widget workflow is introduced
- Expo can schedule reminders, but it does not fully block all phone notifications from JavaScript alone

## Screens currently in the app

- onboarding
- dashboard
- achievements
- goals
- custom quests
- history
- profile
- haircare
- milestones
- insights
- weekly review
- habit calendar
- no fap
- workout progress
- sleep recovery
- dopamine control
- settings

## Data stored locally

The app uses AsyncStorage and local device files for:

- profile
- progress
- daily quests
- history
- completion log
- achievements
- goals
- custom quests
- men’s health state and logs
- milestones
- dopamine logs
- sleep entries
- workout entries
- hair logs and locally saved images

## Tech stack

- Expo SDK 56
- Expo Router
- React Native
- TypeScript
- AsyncStorage
- Expo Image Picker
- Expo File System
- Expo Notifications
- React Native Calendars
- React Native Community DateTimePicker
- React Native Reanimated

## Getting started

This app has no external API dependencies and requires no `.env` file — everything is stored
locally via AsyncStorage and the device filesystem (see "Data stored locally" above).

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npm start
```

3. Run on a platform

```bash
npm run android
npm run ios
npm run web
```

## Development notes

- routing is file-based through the `app/` directory
- business logic is organized under `lib/`
- UI components are split into reusable `components/` building blocks
- notification support was added using Expo v56-compatible packages and local scheduling

## Roadmap ideas

These ideas fit the project direction but are not fully implemented yet:

- guild / party sharing with friends
- leaderboard and social streak comparison
- richer cosmetic theme switching tied to unlocks
- more advanced avatar evolution visuals and cutscenes

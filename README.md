# Life RPG

Life RPG is a mobile self-improvement app built with Expo and React Native. It turns daily habits into a small role-playing system with quests, XP, levels, ranks, stats, achievements, goals, and personal progress tracking.

## What this app does

The app gives you a daily structure for building better habits. Each day, it generates a set of quests based on your goals, experience level, and chosen focus areas. Completing quests earns XP and improves your stats, which helps you level up and unlock achievements.

It also supports:

- personal goal tracking
- custom quest creation
- hair care and minoxidil tracking
- history and analytics
- local persistence so progress stays on the device

## Screens

### Onboarding
- create a player profile
- choose a main goal such as body, confidence, coding, study, career, writing, or all-rounder
- choose beginner, normal, or serious experience level
- set wake time and sleep target
- enable hair treatment tracking and add a start date

### Dashboard
- shows the active profile and level/rank information
- displays current streak and longest streak
- shows XP bar and next level progress
- presents daily main quests and bonus quests
- links to history, achievements, profile, goals, custom quests, and hair care
- opens level-up, achievement, and goal-completion modals after progress

### Goals
- create personal goals with categories and target dates
- assign bonus XP to completed goals
- link goals to relevant quests
- track progress percent and complete goals when all linked quests are done
- view active versus completed goals

### Custom Quests
- create your own quests with title, description, category, difficulty, XP, timing, and notes
- choose affected stats
- mark quests active or inactive
- reuse them in the daily quest rotation

### Achievements
- view a catalog of unlockable achievements
- track progress toward each achievement
- see unlock status and reward details

### History and analytics
- review daily quest completion history
- see monthly summaries
- view XP tracking across today, week, month, and all time
- inspect streak progress and best-performing days
- view hair-log timeline when hair tracking is enabled

### Profile
- shows the player name, rank, level, and total XP
- summarizes unlocked achievements
- shows active and completed goals
- lists recent achievement unlocks
- displays custom quest count

### Hair care tracker
- available when minoxidil or hair treatment tracking is enabled
- shows a 30-day consistency grid
- tracks morning and night dose status
- logs progress photos from the camera
- stores photos locally and shows them in the photo log

## Core features

### Daily quest system
- generates 5 main quests and 3 bonus quests each day
- uses a built-in quest catalog plus custom quests
- avoids repeating the same quest too often by tracking recent rotations
- balances categories around the player's selected main goal
- respects one-time quests so they only appear until completed
- supports hair care quests when minoxidil tracking is enabled

### Progression loop
- quest completion grants XP
- XP increases level and fills the XP bar
- levels change the rank name
- completing quests also updates stats such as strength, stamina, focus, discipline, charisma, confidence, creativity, appearance, communication, and style
- streaks and long-term progress are stored and displayed

### Achievement system
- unlocks achievements for first quests, streak milestones, XP milestones, category milestones, level milestones, and men’s health goals
- rewards extra XP and stat boosts when unlocked
- shows progress bars and unlock state throughout the app

### Goal and reward system
- create goals tied to specific quests
- track progress based on linked quest completion
- award bonus XP when a goal is completed
- surface completed goals in the dashboard and profile views

### Customization and flexibility
- create custom quests for your own routine
- choose categories and difficulty levels
- adjust repeat type between daily, weekly, and one-time
- enable or disable quests without deleting them

### Data and persistence
- stores profile, progress, quests, history, achievements, goals, custom quests, hair logs, and men’s health logs locally
- uses AsyncStorage for reliable local persistence

## Small but useful details

- pull-to-refresh works on several screens
- loading states appear while data is being loaded
- modals show level-ups, achievement unlocks, and goal completion rewards
- quest detail modals provide extra context for each task
- the UI uses a stylized game-like presentation with cards, badges, and progress bars
- back navigation is built into each detail screen
- the app supports both mobile and web targets through Expo

## Tech stack

- Expo Router
- React Native
- TypeScript
- AsyncStorage
- Expo Image Picker
- Expo File System
- React Native Reanimated
- Zustand-style app state flow through local storage helpers

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

3. Open the app in Expo Go, an emulator, or a browser preview.

## Development notes

- main app entry is routed through the app folder
- screens are organized by purpose such as dashboard, goals, achievements, history, profile, and hair care
- the app logic is split into reusable modules under the lib folder for quests, achievements, goals, analytics, storage, and hair care

## Project idea

Life RPG is designed as a habit-building game where routine becomes visible, rewarding, and motivating. It combines journaling, progress tracking, and gamified discipline into one app experience.

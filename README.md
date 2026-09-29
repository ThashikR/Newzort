# Vartify

**Your personal newspaper + AI news analyst.** Vartify groups coverage of the same event from multiple publishers, summarises the facts they share, explains why it matters to *you*, and always links back to the original reporting.

> **Status: Phase 1 (demo data).** Every screen works end-to-end on bundled demo stories. Demo publishers are fictional and all links point to `example.com` — nothing pretends to be real reporting.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (same Wi-Fi). Press `w` to open it in a browser.

## What's inside

| Screen | What it does |
|---|---|
| Onboarding | Name → interests → priorities → summary style → briefing length |
| Home | Greeting, briefing entry, **Must Know**, **For You**, **Quick Read**, **Explore** |
| Briefing | Fits stories into 5/10/15/30 minutes, grouped by your priorities, with progress |
| Explore | Search stories, topics, organisations, people, countries; browse topics |
| Story | What happened, key points, why it matters, background, what's next, confidence, every source |
| Ask AI | Answers from your feed only, split into **Facts / Analysis / Uncertainty** |
| Saved | Saved stories with date, category, source and remove |
| Profile | Interests, priorities, briefing, style, notifications (opt-in), sources, privacy, reset |

## Project structure

```
src/
  app/            Screens (Expo Router). (tabs)/ = bottom tabs; story/[id], ask, onboarding
  components/     UI primitives (ui/), story cards & sources (story/), assistant answer view
  features/       Business logic: personalization, briefing, search, assistant, notifications
  services/       Service interfaces + mock / http / storage implementations (index.ts picks one)
  state/          React context stores: user profile (persisted) and news feed
  types/          Domain model: StoryCluster, Article, NewsSource, UserProfile, …
  data/mock/      Demo stories and fictional demo publishers
  constants/      Theme (colours, type, spacing) and topic list
  config/         Environment (EXPO_PUBLIC_* only)
server/           Backend-ready pipeline types, reference clustering, AI-output validator
docs/             ARCHITECTURE.md
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the data flow, ranking formula, API contract and security rules.

## Keeping the C: drive light

- `.npmrc` sends npm's download cache to `F:/dev-cache/npm`.
- `metro.config.js` keeps Metro's build cache in `.metro-cache/` inside this project. Delete that folder any time to free space.

## Checks

```bash
npx tsc --noEmit
npx expo lint
```

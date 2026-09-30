# Newzort — overview

*News. Sorted for you.*

## What Newzort is

**Short description (≤ 80 characters, for app stores)**
> Your personal AI newspaper: today's news, grouped, summarised and sourced.

**Full description**
> Newzort reads today's news from trusted publishers and turns it into a short
> briefing about what matters to you.
>
> Instead of showing ten versions of the same headline, Newzort recognises when
> different publishers are covering the same event and combines them into one
> story. AI then writes a clear summary, the key points, and why it matters.
> Every point is checked against the original articles, and the sources are
> always one tap away.
>
> • **Must Know, For You and Quick Reads**, ranked by your interests and priorities
> • **Daily Briefing** that fits 5, 10, 15 or 30 minutes, with Prev/Next navigation and progress
> • **Every story shows its sources**, with links to the original reporting (Newzort never copies full articles)
> • **Ask AI** answers questions using only today's stories, separating Facts, Analysis and Uncertainty
> • **Search** by topic, company, person or country
> • **Save stories** for later, including offline
> • **Learns from you** (More like this / Not interested) and you stay in control
> • **Light and dark mode**, with no account needed. Your preferences stay on your device.
>
> Newzort is built on a simple promise: help you **understand** the news, not just consume more of it.
> No clickbait, no invented facts, no hidden sources.

---

## The system at a glance

```
                ┌──────────────────────── CLOUD (runs without your PC) ────────────────────────┐
                │                                                                             │
 16 publisher   │  GitHub Actions  (every 30 min)                        GitHub Pages          │
 RSS feeds ─────┼─► server/build-feed.ts                                  feed.json            │
                │     fetch → clean → group → rank → AI summaries ──────► sources.json ────────┼──┐
                │                                 │                      meta.json            │  │
                │                     Gemini / Groq (GitHub secrets)                          │  │
                │                                                                             │  │
                │  Cloudflare Worker "newzort-ask"  ◄── reads feed.json ──────────────────────┼──┤
                │     POST /ask → Gemini/Groq (Worker secrets) + Durable Object rate limit   │  │
                │                                                                             │  │
                │  Expo (EAS)  Build → APK     Update → over-the-air JS updates               │  │
                └─────────────────────────────────────────────────────────────────────────────┘  │
                                      │ APK / updates                   │ feed      ▲ questions │
                                      ▼                                 ▼           │           │
                               ┌──────────────────── Newzort app (phone) ───────────┴───────────┘
                               │  ranking · briefing · search · saved · offline cache (on device)
                               └─────────────────────────────────────────────────────────────────
```

---

## 1. News pipeline (every 30 minutes, GitHub Actions)

File: `.github/workflows/update-feed.yml` → `server/build-feed.ts`

| Step | What happens | Code |
|---|---|---|
| 1. Ingest | Fetch 16 RSS feeds in parallel; one broken feed never stops the others | `server/pipeline/ingest.ts`, `server/sources.ts` |
| 2. Clean | Strip HTML and publisher boilerplate, shorten excerpts, normalise URLs, drop duplicates, keep ~36 h | `ingest.ts` |
| 3. Group | Same event from different publishers → one story (IDF-weighted word similarity, tuned on real feeds) | `server/pipeline/build-stories.ts` |
| 4. Categorise and rank | Topic rules, India detection, importance from coverage breadth, source quality and recency | `build-stories.ts` |
| 5. AI analysis | Up to 16 new stories per run, 4 per request, sent to Gemini (Groq as fallback); models discovered automatically | `server/pipeline/ai-analyze.ts` |
| 6. Fact check | Every key point must cite real article ids; uncited points are dropped, weak answers rejected | `server/pipeline/validate-analysis.ts` |
| 7. Reuse | Unchanged stories reuse earlier AI results (saves free quota); a prompt change triggers a redo | `ai-analyze.ts` (`PROMPT_VERSION`) |
| 8. Publish | `feed.json`, `sources.json`, `meta.json` uploaded to GitHub Pages | workflow |

Stories are either `analysisMode: 'ai'` (full summary) or `'extractive'` (headline-only: the publisher's excerpt,
credited, plus other publishers' headlines). The app never shows invented analysis.

Live feed: https://thashikr.github.io/Newzort/feed.json · build report: `/meta.json`

## 2. App runtime flow

```
Launch
 ├─ Load profile from device (AsyncStorage)      no profile? → Onboarding (5 steps)
 ├─ Show cached feed instantly (offline copy)
 ├─ Download fresh feed.json in the background   offline? → "You're offline" + cached news
 ├─ Rank every story for this user:
 │     35% interest match · 25% importance · 15% freshness · 10% source quality · 15% your likes/hides
 ├─ Split: Must Know · For You · Quick Read · Explore      (hidden stories removed)
 └─ Build the Daily Briefing for 5/10/15/30 minutes
Return to the app after 10+ min → refresh automatically
Updater checks for a new app version → "A new version is ready · Restart"
```

## 3. Ask AI flow

```
Question (+ current story) → Cloudflare Worker /ask
  1. Rate limit per device: 6/min, 60/day (Durable Object)
  2. Read today's feed.json; pick up to 8 relevant stories (+ the story being viewed)
  3. Gemini (Flash-Lite, then Flash; Groq fallback): answer ONLY from those stories, JSON
  4. Validate: facts must cite a real story id; ids stripped from text; lengths capped
  5. Return Facts / Analysis / Uncertainty / related stories
App: shows the answer; if the Worker is unreachable → on-device fallback answer
```

## 4. Development workflow

```
Edit code in VS Code
  → test live on your phone with Expo Go   (npx expo start)
  → check:  npx tsc --noEmit   ·   npx expo lint   ·   (server) npm run typecheck
  → git add -A → git commit -m "…" → git push          (GitHub = backup + triggers the robot)
  → ship:
      JS-only change  → npx eas-cli@latest update --channel preview --environment preview --message "…"
      native change   → bump "version" in app.json → npx eas-cli@latest build -p android --profile preview
```

## 5. Tools, services and plugins

**App (Expo / React Native)**

| Tool | Used for |
|---|---|
| Expo SDK 57, React Native 0.86, React 19, TypeScript | The app itself |
| Expo Router (Stack, JS tabs, protected routes, typed routes) | Navigation; onboarding gate |
| React Compiler | Automatic performance optimisation |
| react-native-reanimated | Card and screen animations |
| @react-native-async-storage/async-storage | Profile, saved stories, offline feed cache |
| expo-updates | Over-the-air updates and the Restart prompt |
| expo-web-browser | Opening publishers' original articles |
| expo-splash-screen, expo-status-bar, expo-constants | Splash (light/dark), status bar, app version |
| @expo/vector-icons (Ionicons) | Icons |
| react-native-safe-area-context | Notches and system bars |
| ESLint (eslint-config-expo), tsc | Code quality |
| Metro bundler | Bundling; cache kept on F: (`.metro-cache/`) |

**Backend and cloud (all free tiers)**

| Service | Role | Secrets |
|---|---|---|
| GitHub (repo ThashikR/Newzort) | Code, history, backup | — |
| GitHub Actions | Runs the news pipeline every 30 min | `GEMINI_API_KEY`, `GROQ_API_KEY` |
| GitHub Pages | Hosts `feed.json` | — |
| Google Gemini API | Story summaries, Ask AI answers | in GitHub + Cloudflare |
| Groq API | Backup AI provider | in GitHub + Cloudflare |
| Cloudflare Workers + Durable Objects | Ask AI API and exact rate limiting | Worker secrets |
| Expo EAS Build | Builds the APK in the cloud; stores the signing key | Expo account |
| Expo EAS Update | Sends JS updates to installed apps (`preview` channel) | Expo account |
| Firebase (project `vartify-7edf1`) | Created for future accounts/sync, not used yet | — |

**Server tools:** Node 22, tsx, fast-xml-parser, TypeScript, Wrangler (Cloudflare CLI), Python + Pillow (brand assets).

**News sources:** The Hindu, The Indian Express (blocked from GitHub's servers), Mint, BBC News, Al Jazeera,
The Guardian, TechCrunch, The Verge, Ars Technica, BleepingComputer, The Hacker News, ScienceDaily, NASA.

## 6. Where data and secrets live

| What | Where | Who can see it |
|---|---|---|
| Your interests, likes, saved stories, reading history | On your phone only | Only you |
| News feed | GitHub Pages (public) | Everyone |
| AI keys | GitHub secrets + Cloudflare Worker secrets | Nobody (not even in the app or repo) |
| App signing key | Expo (EAS credentials) | Your Expo account |

## 7. Repository map

```
src/            the app: app/ (screens) · components/ · features/ · services/ · state/ · types/ · constants/ · config/
server/         news pipeline: sources, ingest, grouping, AI analysis, validator, local server, tests
worker/         Cloudflare Worker: Ask AI API + rate limiter
assets/         brand master logo + generated icons/splash
scripts/        make-brand-assets.py
docs/           OVERVIEW.md (this file), ARCHITECTURE.md
.github/        workflows/update-feed.yml
```

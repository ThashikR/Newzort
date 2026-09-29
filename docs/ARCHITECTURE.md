# Vartify architecture

## Layers

```
Screens (src/app)            ← what the user sees; no data fetching logic
  ↓ uses
Components + Features        ← UI pieces, and pure business logic (ranking, briefing, search)
  ↓ uses
State (src/state)            ← UserProvider (persisted profile) + NewsProvider (feed)
  ↓ uses
Services (src/services)      ← interfaces only; index.ts picks mock or http
  ↓
Types (src/types)            ← the contract shared with the backend (server/)
```

UI code never imports a concrete implementation (`mock/*`, `http/*`). Swapping demo data for the real backend is a config change:

```
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_USE_MOCK_DATA=false
```

## News pipeline (backend, Phase 6–8)

```
NEWS SOURCES      RSS / news APIs / licensed feeds           server/pipeline/types.ts → RawArticle
ARTICLE INGESTION store metadata + link; full text transient
ARTICLE CLEANING  canonical URL, language, content hash        → CleanArticle
DUPLICATE DETECT  identical content hash = syndicated copy
STORY CLUSTERING  same event across publishers                 server/pipeline/clustering.ts
AI ANALYSIS       LLM returns strict JSON per cluster          → LlmClusterAnalysis
FACT EXTRACTION   every key point cites article ids            server/pipeline/validate-analysis.ts
SUMMARY GENERATION validated StorySummary                      → StoryCluster
PERSONALIZATION   per-user ranking                             src/features/personalization
USER FEED         /v1/feed
```

**Grounding rule:** the validator drops any key point that doesn't cite at least one article in its cluster, and rejects the analysis if fewer than 3 supported points remain. The app never renders free-form model text.

## Personalization (v1, rule-based)

`src/features/personalization/score.ts`

```
relevance = 0.35 · interest match      (priority: high 1.0, medium 0.65, low 0.35)
          + 0.25 · importance          (editorial/AI, 0–100)
          + 0.15 · freshness           (half-life 18 h)
          + 0.10 · source quality      (reliability × breadth of sources)
          + 0.15 · behaviour           (likes pull topics up, "not interested" pushes down)
```

It's exposed through `PersonalizationService`, so a learned model can replace it without UI changes.
Home sections (`sections.ts`): **Must Know** = importance ≥ 65, ranked by importance + relevance + source quality; **For You** = interest matches; **Quick Read** = short items; **Explore** = everything else.

## API contract (for the backend)

| Method | Path | Returns |
|---|---|---|
| GET | `/v1/feed` | `StoryCluster[]` |
| GET | `/v1/stories/:id` | `StoryCluster` (404 if missing) |
| GET | `/v1/search?q=&scope=` | `SearchResult[]` |
| GET | `/v1/sources` | `NewsSource[]` |
| POST | `/v1/assistant/ask` | `AssistantAnswer`; body `{ question, focusClusterId?, storyIds, interests }` |

The assistant receives story **ids**, not text, and re-reads stories server-side, so answers stay grounded in stored source data.

## Security

- Only `EXPO_PUBLIC_*` values reach the app, and they are public. See `.env.example`.
- LLM keys, news API keys and database credentials live only in `server/.env` (template: `server/.env.example`).
- Both `.env` files are git-ignored.

## Notifications

`src/features/notifications/notification-planner.ts` decides what would be sent: opt-in, at most 3 a day, only for important stories. Delivery (`expo-notifications` + push) plugs in later; it needs a development build, not Expo Go.

## Roadmap

1. ✅ UI with demo data   2. ✅ Navigation and state   3. ✅ Onboarding and personalization
4. ✅ Story detail and sources   5. ✅ Service abstraction   6. Backend integration
7. Real news sources   8. LLM analysis   9. Auth and database   10. Tests, performance, production build

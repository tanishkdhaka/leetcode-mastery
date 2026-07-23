# LeetCode Mastery

A local-first, FSRS-powered spaced repetition app for mastering LeetCode problems. Built with Next.js 15, TypeScript, Tailwind CSS, and Dexie.js.

## Features

- **FSRS-4.5 Algorithm** — Real spaced repetition scheduling based on stability, difficulty, and retrievability
- **Pareto Problem Tracker** — Import curated problem sets, track progress per problem
- **Pattern Mastery** — Radar charts and stats per algorithmic pattern (Two Pointers, DFS, Sliding Window, etc.)
- **Forgetting Curve Visualization** — See exactly when your memory will decay
- **Mistake Analysis** — Tag mistakes ("didn't recognize pattern", "forgot algorithm", etc.) to find weak spots
- **Activity Heatmap** — GitHub-style review tracking
- **Streak Counter** — Daily study streak motivation
- **100% Offline** — All data stays in your browser via IndexedDB
- **Export/Import** — JSON backup for peace of mind

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Dexie.js (IndexedDB wrapper) |
| Charts | Recharts |
| Search | Fuse.js |
| Algorithm | FSRS-4.5 (Free Spaced Repetition Scheduler) |

## Quick Start

```bash
# 1. Clone and install
cd leetcode-mastery
npm install

# 2. Install Tailwind animate plugin
npm install tailwindcss-animate

# 3. Start dev server
npm run dev
```

Open http://localhost:3000

## First Use

1. Go to **Problems** in the sidebar
2. Click **Import JSON**
3. Select your problem set (e.g., `problems.json`)
4. Click any problem card → **Start Review Session**
5. Solve it on LeetCode, come back, rate yourself
6. FSRS automatically schedules your next review

## FSRS Review Ratings

| Rating | Meaning | Effect |
|--------|---------|--------|
| **Again** | Completely forgot | Stability drops, back to day 1 |
| **Hard** | Struggled but got it | Small stability gain |
| **Good** | Comfortable solve | Standard stability gain (~90% retention target) |
| **Easy** | Instant recognition | Large stability gain + easy bonus |

## Data Persistence

All data lives in your browser's IndexedDB. It survives:
- Browser restarts
- Dev server restarts
- Page refreshes

**It does NOT survive:**
- Clearing browser data / cookies
- Opening via `file://` protocol (use `npm run dev` or `npx serve`)

**Backup regularly:** Settings → Export Database → save the JSON file.

## Project Structure

```
app/
  page.tsx                    # Dashboard with stats, heatmap, upcoming reviews
  problems/page.tsx           # Problem library with filters, search, import
  problem/[id]/page.tsx       # Individual problem + FSRS review form
  patterns/page.tsx           # Pattern mastery radar + per-pattern stats
  forgetting-curve/page.tsx   # Retention decay visualization
  settings/page.tsx           # Export/import/backup

components/
  ui/                         # Button, Card, Badge, Progress, Slider
  layout/                     # Navbar, Layout shell
  dashboard/                  # StatCard, Heatmap, Timeline, Activity
  problems/                   # ProblemCard, ProblemFilters

hooks/
  useProblems.ts              # Problem CRUD + review submission
  useReviews.ts               # Today's queue + upcoming reviews
  useStats.ts                 # Dashboard statistics aggregation

lib/
  types.ts                    # TypeScript interfaces
  fsrs.ts                     # FSRS-4.5 algorithm implementation
  db.ts                       # Dexie.js IndexedDB layer
  utils.ts                    # Formatting, colors, helpers
```

## FSRS Algorithm Details

The app implements **FSRS-4.5** with the official parameter set:

```
R(t, S) = (1 + t / 9S)^-1        # Forgetting curve
S' = f(S, D, R, rating)           # Stability update
D' = f(D, R, rating)              # Difficulty update
I = S × 9 × (1/0.9 - 1) ≈ S       # Interval at 90% retention target
```

- **Stability (S):** Days until retention drops to ~90%
- **Difficulty (D):** 1–10 scale, personal to each card
- **Retrievability (R):** Current probability of successful recall

## Customization

### Change mastery threshold

In `hooks/useProblems.ts`, adjust the status logic:

```ts
// Default: reps >= 3 && stability > 21
// More lenient:
if (fsrsResult.reps >= 2 && fsrsResult.stability > 7) {
  newStatus = "mastered"
}
```

### Change target retention

In `lib/fsrs.ts`, modify `DEFAULT_PARAMS.requestRetention`:

```ts
requestRetention: 0.85  // 85% = more frequent reviews
requestRetention: 0.95  // 95% = less frequent, but more lapses
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `tailwindcss-animate` not found | `npm install tailwindcss-animate` |
| Data lost on restart | Don't open via `file://`. Use `npm run dev` or serve over HTTP |
| Import button not working | Use a modern browser (Chrome, Firefox, Edge). Safari has stricter file picker rules |
| Hydration error `<a> in <a>` | Make sure `ProblemCard.tsx` uses `router.push()` not `<Link>` for card wrapper |
| Retention graph flat at 100% | Fixed — curve now starts from actual elapsed days since last review |

## License

MIT

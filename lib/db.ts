/**
 * IndexedDB Database Layer using Dexie
 * Local-first architecture with offline support
 */

import Dexie, { type Table } from "dexie";
import { Problem, ReviewLogEntry, DailyStats, ParetoProblem } from "./types";
import { initializeCard } from "./fsrs";

export interface ProblemRecord extends Problem {}
export interface ReviewLogRecord extends ReviewLogEntry {
  problemId: string;
}
export interface DailyStatsRecord extends DailyStats {}
export interface SettingsRecord {
  id: string;
  value: any;
}

class LeetCodeDB extends Dexie {
  problems!: Table<ProblemRecord, string>;
  reviewLogs!: Table<ReviewLogRecord, string>;
  dailyStats!: Table<DailyStatsRecord, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("LeetCodeMasteryDB");

    this.version(1).stores({
      problems: "id, status, pattern, difficulty, nextReview, *companyTags",
      reviewLogs: "id, problemId, date, [problemId+date]",
      dailyStats: "date",
      settings: "id",
    });
  }
}

export const db = new LeetCodeDB();

/**
 * Initialize database with default settings
 */
export async function initDB() {
  const initialized = await db.settings.get("initialized");
  if (!initialized) {
    await db.settings.add({ id: "initialized", value: true });
    await db.settings.add({ id: "streak", value: 0 });
    await db.settings.add({ id: "lastStudyDate", value: null });
  }
}

/**
 * Import Pareto problems from JSON
 */
export async function importParetoProblems(problems: ParetoProblem[]) {
  const now = new Date();
  const records: ProblemRecord[] = problems.map((p) => {
    const card = initializeCard();
    return {
      ...p,
      notes: p.notes ?? "",
      status: "not-started",
      ...card,
      createdAt: now,
      updatedAt: now,
      totalAttempts: 0,
      successfulAttempts: 0,
      averageSolveTime: 0,
      totalSolveTime: 0,
      editorialUsed: false,
      confidence: 0,
      mistakeHistory: [],
      reviewHistory: [],
    };
  });

  await db.problems.bulkPut(records);
  return records.length;
}

/**
 * Get today's review queue
 * Sorted by urgency (most urgent first)
 */
export async function getTodayReviews(): Promise<ProblemRecord[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Get all problems that are due today or overdue
  const allProblems = await db.problems
    .where("status")
    .anyOf(["learning", "review", "need-practice"])
    .toArray();

  const dueProblems = allProblems.filter((p) => {
    if (!p.nextReview) return true; // New learning items
    return p.nextReview <= endOfDay;
  });

  // Sort by urgency
  dueProblems.sort((a, b) => {
    const urgencyA = calculateUrgencyScore(a);
    const urgencyB = calculateUrgencyScore(b);
    return urgencyB - urgencyA;
  });

  return dueProblems;
}

function calculateUrgencyScore(problem: ProblemRecord): number {
  if (!problem.nextReview) return 1000;
  const now = new Date();
  const daysOverdue = Math.max(
    0,
    (now.getTime() - problem.nextReview.getTime()) / (1000 * 60 * 60 * 24),
  );
  // Recalculate retrievability from elapsed days since last review
  const elapsedDays = problem.lastReview
    ? (now.getTime() - problem.lastReview.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const retrievability =
    problem.stability > 0
      ? Math.pow(1 + elapsedDays / (9 * problem.stability), -1)
      : 0;
  const forgettingProb = 1 - retrievability;
  return (
    daysOverdue * 3 +
    forgettingProb * 5 +
    (1 / (1 + problem.stability / 10)) * 2
  );
}
/**
 * Get upcoming reviews for the next N days
 */
export async function getUpcomingReviews(
  days: number = 7,
): Promise<{ date: string; count: number; problems: ProblemRecord[] }[]> {
  const result: { date: string; count: number; problems: ProblemRecord[] }[] =
    [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const problems = await db.problems
      .filter((p) => {
        if (!p.nextReview) return false;
        return p.nextReview >= startOfDay && p.nextReview < endOfDay;
      })
      .toArray();

    result.push({
      date: startOfDay.toISOString().split("T")[0],
      count: problems.length,
      problems,
    });
  }

  return result;
}

/**
 * Get review heatmap data (last 365 days)
 */
export async function getHeatmapData(): Promise<
  { date: string; count: number }[]
> {
  const now = new Date();
  const logs = await db.reviewLogs
    .where("date")
    .above(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000))
    .toArray();

  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const date = new Date(log.date).toISOString().split("T")[0];
    counts.set(date, (counts.get(date) || 0) + 1);
  });

  // Fill in all dates
  const result: { date: string; count: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    result.push({ date: dateStr, count: counts.get(dateStr) || 0 });
  }

  return result;
}

/**
 * Export entire database as JSON
 */
export async function exportDatabase(): Promise<string> {
  const data = {
    problems: await db.problems.toArray(),
    reviewLogs: await db.reviewLogs.toArray(),
    dailyStats: await db.dailyStats.toArray(),
    settings: await db.settings.toArray(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Restore database from JSON
 */
export async function restoreDatabase(json: string) {
  const data = JSON.parse(json);
  await db.problems.clear();
  await db.reviewLogs.clear();
  await db.dailyStats.clear();
  await db.settings.clear();

  if (data.problems) await db.problems.bulkAdd(data.problems);
  if (data.reviewLogs) await db.reviewLogs.bulkAdd(data.reviewLogs);
  if (data.dailyStats) await db.dailyStats.bulkAdd(data.dailyStats);
  if (data.settings) await db.settings.bulkAdd(data.settings);
}

/**
 * Get streak information
 */
export async function getStreak(): Promise<{
  current: number;
  lastStudyDate: string | null;
}> {
  const streak = await db.settings.get("streak");
  const lastDate = await db.settings.get("lastStudyDate");
  return {
    current: streak?.value || 0,
    lastStudyDate: lastDate?.value || null,
  };
}

/**
 * Update streak
 */
export async function updateStreak() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = await db.settings.get("lastStudyDate");
  const currentStreak = await db.settings.get("streak");

  if (!lastDate?.value) {
    await db.settings.put({ id: "streak", value: 1 });
    await db.settings.put({ id: "lastStudyDate", value: today });
    return 1;
  }

  const last = new Date(lastDate.value);
  const now = new Date(today);
  const diffDays = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return currentStreak?.value || 0;
  } else if (diffDays === 1) {
    const newStreak = (currentStreak?.value || 0) + 1;
    await db.settings.put({ id: "streak", value: newStreak });
    await db.settings.put({ id: "lastStudyDate", value: today });
    return newStreak;
  } else {
    await db.settings.put({ id: "streak", value: 1 });
    await db.settings.put({ id: "lastStudyDate", value: today });
    return 1;
  }
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { db, getStreak, getHeatmapData } from "@/lib/db";
import { PatternStats, MistakeType } from "@/lib/types";
import { ProblemRecord } from "@/lib/db";
import { calculateRetrievability } from "@/lib/fsrs";

export interface DashboardData {
  todayReviews: number;
  newProblemsRemaining: number;
  currentStreak: number;
  masteredProblems: number;
  learningProblems: number;
  forgottenProblems: number;
  averageRetention: number;
  averageSolveTime: number;
  patternAccuracy: number;
  heatmapData: { date: string; count: number }[];
  upcomingReviews: { date: string; count: number }[];
  recentActivity: any[];
  patternStats: PatternStats[];
  mistakeStats: Record<MistakeType, number>;
  weeklyProgress: { week: string; solved: number; reviewed: number }[];
}

export function useStats() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const problems = await db.problems.toArray();
    const logs = await db.reviewLogs.toArray();
    const streakData = await getStreak();

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Today's reviews
    const todayReviews = problems.filter((p) => {
      if (!p.nextReview)
        return p.status === "learning" || p.status === "not-started";
      return p.nextReview <= endOfDay && p.status !== "mastered";
    }).length;

    // New problems remaining
    const newProblemsRemaining = problems.filter(
      (p) => p.status === "not-started",
    ).length;

    // Status counts
    const masteredProblems = problems.filter(
      (p) => p.status === "mastered",
    ).length;
    const learningProblems = problems.filter(
      (p) => p.status === "learning",
    ).length;
    const forgottenProblems = problems.filter(
      (p) => p.status === "need-practice",
    ).length;

    // Average retention
    const activeProblems = problems.filter(
      (p) => p.status !== "not-started" && p.stability > 0,
    );
    const averageRetention =
      activeProblems.length > 0
        ? activeProblems.reduce((sum, p) => {
            const elapsed = p.lastReview
              ? (now.getTime() - p.lastReview.getTime()) / (1000 * 60 * 60 * 24)
              : 0;
            return sum + calculateRetrievability(elapsed, p.stability);
          }, 0) / activeProblems.length
        : 0;

    // Average solve time
    const attemptedProblems = problems.filter((p) => p.totalAttempts > 0);
    const averageSolveTime =
      attemptedProblems.length > 0
        ? attemptedProblems.reduce((sum, p) => sum + p.averageSolveTime, 0) /
          attemptedProblems.length
        : 0;

    // Pattern accuracy
    const patternMap = new Map<string, { correct: number; total: number }>();
    logs.forEach((log) => {
      const problem = problems.find((p) => p.id === log.problemId);
      if (!problem) return;
      const existing = patternMap.get(problem.pattern) || {
        correct: 0,
        total: 0,
      };
      existing.total++;
      if (log.rating > 1) existing.correct++;
      patternMap.set(problem.pattern, existing);
    });
    const patternAccuracy =
      patternMap.size > 0
        ? Array.from(patternMap.values()).reduce(
            (sum, p) => sum + p.correct / p.total,
            0,
          ) / patternMap.size
        : 0;

    // Pattern stats
    const patternStats: PatternStats[] = Array.from(
      new Set(problems.map((p) => p.pattern)),
    ).map((pattern) => {
      const patternProblems = problems.filter((p) => p.pattern === pattern);
      const patternLogs = logs.filter((l) => {
        const p = problems.find((pr) => pr.id === l.problemId);
        return p?.pattern === pattern;
      });

      const mastered = patternProblems.filter(
        (p) => p.status === "mastered",
      ).length;
      const learning = patternProblems.filter(
        (p) => p.status === "learning" || p.status === "review",
      ).length;

      const avgRetention =
        patternProblems.filter((p) => p.stability > 0).length > 0
          ? patternProblems
              .filter((p) => p.stability > 0)
              .reduce((sum, p) => {
                const elapsed = p.lastReview
                  ? (now.getTime() - p.lastReview.getTime()) /
                    (1000 * 60 * 60 * 24)
                  : 0;
                return sum + calculateRetrievability(elapsed, p.stability);
              }, 0) / patternProblems.filter((p) => p.stability > 0).length
          : 0;

      const avgConfidence =
        patternProblems.filter((p) => p.confidence > 0).length > 0
          ? patternProblems
              .filter((p) => p.confidence > 0)
              .reduce((sum, p) => sum + p.confidence, 0) /
            patternProblems.filter((p) => p.confidence > 0).length
          : 0;

      const accuracy =
        patternLogs.length > 0
          ? patternLogs.filter((l) => l.rating > 1).length / patternLogs.length
          : 0;

      const weakest = patternProblems
        .filter((p) => p.status !== "mastered")
        .sort((a, b) => a.stability - b.stability)
        .slice(0, 3)
        .map((p) => p.id);

      const nextReview =
        patternProblems
          .filter((p) => p.nextReview && p.status !== "mastered")
          .sort(
            (a, b) =>
              (a.nextReview?.getTime() || 0) - (b.nextReview?.getTime() || 0),
          )[0]?.nextReview || null;

      return {
        pattern,
        totalProblems: patternProblems.length,
        mastered,
        learning,
        averageRetention: avgRetention,
        averageConfidence: avgConfidence,
        weakestProblems: weakest,
        nextReview,
        accuracy,
      };
    });

    // Mistake stats
    const mistakeStats: Record<MistakeType, number> = {
      "didnt-recognize-pattern": 0,
      "forgot-algorithm": 0,
      "coding-bug": 0,
      "edge-case": 0,
      "time-complexity": 0,
      optimization: 0,
      syntax: 0,
      panic: 0,
      other: 0,
    };
    logs.forEach((log) => {
      log.mistakes?.forEach((m) => {
        mistakeStats[m] = (mistakeStats[m] || 0) + 1;
      });
    });

    // Weekly progress (last 8 weeks)
    const weeklyProgress: { week: string; solved: number; reviewed: number }[] =
      [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekLogs = logs.filter(
        (l) => l.date >= weekStart && l.date < weekEnd,
      );
      weeklyProgress.push({
        week: `W${8 - i}`,
        solved: weekLogs.filter((l) => l.rating > 1).length,
        reviewed: weekLogs.length,
      });
    }

    // Recent activity
    const recentActivity = logs
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)
      .map((log) => {
        const problem = problems.find((p) => p.id === log.problemId);
        return { ...log, problemTitle: problem?.title || "Unknown" };
      });

    // Upcoming reviews
    const upcomingReviews: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfDay.getTime() + i * 24 * 60 * 60 * 1000);
      const end = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const count = problems.filter((p) => {
        if (!p.nextReview || p.status === "mastered") return false;
        return p.nextReview >= date && p.nextReview < end;
      }).length;
      upcomingReviews.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    // Heatmap
    const heatmapData = await getHeatmapData();

    setStats({
      todayReviews,
      newProblemsRemaining,
      currentStreak: streakData.current,
      masteredProblems,
      learningProblems,
      forgottenProblems,
      averageRetention,
      averageSolveTime,
      patternAccuracy,
      heatmapData,
      upcomingReviews,
      recentActivity,
      patternStats,
      mistakeStats,
      weeklyProgress,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}

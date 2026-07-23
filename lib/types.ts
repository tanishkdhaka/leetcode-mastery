/**
 * Core TypeScript types for LeetCode Mastery
 * Strict typing ensures data integrity across the entire application
 */

export type Difficulty = "Easy" | "Medium" | "Hard"
export type ProblemStatus = "not-started" | "learning" | "review" | "mastered" | "need-practice"
export type FSRSRating = 1 | 2 | 3 | 4 | 5

export interface Problem {
  id: string
  title: string
  difficulty: Difficulty
  leetcodeUrl: string
  topic: string
  pattern: string
  companyTags: string[]
  frequency: number
  notes: string
  status: ProblemStatus
  // FSRS state
  fsrsDifficulty: number   // FSRS difficulty parameter (0-10)
  stability: number
  retrievability: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  lastReview: Date | null
  nextReview: Date | null
  createdAt: Date
  updatedAt: Date
  totalAttempts: number
  successfulAttempts: number
  averageSolveTime: number
  totalSolveTime: number
  editorialUsed: boolean
  confidence: number
  mistakeHistory: MistakeEntry[]
  reviewHistory: ReviewLogEntry[]
}

export interface MistakeEntry {
  id: string
  date: Date
  types: MistakeType[]
  notes: string
}

export type MistakeType =
  | "didnt-recognize-pattern"
  | "forgot-algorithm"
  | "coding-bug"
  | "edge-case"
  | "time-complexity"
  | "optimization"
  | "syntax"
  | "panic"
  | "other"

export const MISTAKE_LABELS: Record<MistakeType, string> = {
  "didnt-recognize-pattern": "Didn't recognize pattern",
  "forgot-algorithm": "Forgot algorithm",
  "coding-bug": "Coding bug",
  "edge-case": "Missed edge case",
  "time-complexity": "Time complexity issue",
  "optimization": "Optimization needed",
  "syntax": "Syntax error",
  "panic": "Panicked / blanked",
  "other": "Other",
}

export interface ReviewLogEntry {
  id: string
  date: Date
  rating: FSRSRating
  elapsedDays: number
  scheduledDays: number
  state: "new" | "learning" | "review" | "relearning"
  timeTaken: number
  confidence: number
  editorialUsed: boolean
  mistakes: MistakeType[]
}

export interface PatternStats {
  pattern: string
  totalProblems: number
  mastered: number
  learning: number
  averageRetention: number
  averageConfidence: number
  weakestProblems: string[]
  nextReview: Date | null
  accuracy: number
}

export interface DailyStats {
  date: string
  reviewsCompleted: number
  newProblems: number
  averageRating: number
  totalTime: number
  mistakes: Record<MistakeType, number>
}

export interface DashboardStats {
  todayReviews: number
  newProblemsRemaining: number
  currentStreak: number
  masteredProblems: number
  learningProblems: number
  forgottenProblems: number
  averageRetention: number
  averageSolveTime: number
  patternAccuracy: number
  heatmapData: { date: string; count: number }[]
  upcomingReviews: { date: string; count: number }[]
  recentActivity: ReviewLogEntry[]
}

export interface ParetoProblem {
  id: string
  title: string
  difficulty: Difficulty
  leetcodeUrl: string
  topic: string
  pattern: string
  companyTags: string[]
  frequency: number
  notes?: string
}
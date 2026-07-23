"use client"

import { useState, useEffect, useCallback } from "react"
import { db, type ProblemRecord } from "@/lib/db"
import { processReview, calculateCompletion } from "@/lib/fsrs"
import { FSRSRating, MistakeType } from "@/lib/types"
import { updateStreak } from "@/lib/db"

export function useProblems() {
  const [problems, setProblems] = useState<ProblemRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await db.problems.toArray()
    setProblems(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getProblem = useCallback(async (id: string) => {
    return db.problems.get(id)
  }, [])

  const updateProblem = useCallback(async (id: string, updates: Partial<ProblemRecord>) => {
    await db.problems.update(id, { ...updates, updatedAt: new Date() })
    await refresh()
  }, [refresh])

  return { problems, loading, refresh, getProblem, updateProblem }
}

export function useProblem(id: string) {
  const [problem, setProblem] = useState<ProblemRecord | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.problems.get(id).then((p) => {
      setProblem(p)
      setLoading(false)
    })
  }, [id])

  const submitReview = useCallback(async (
    rating: FSRSRating,
    timeTaken: number,
    confidence: number,
    editorialUsed: boolean,
    mistakes: MistakeType[],
    notes: string
  ) => {
    if (!problem) return

    const now = new Date()
    const elapsedDays = problem.lastReview
      ? Math.floor((now.getTime() - problem.lastReview.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const fsrsResult = processReview(
      problem.fsrsDifficulty,
      problem.stability,
      problem.reps,
      problem.lapses,
      elapsedDays,
      rating
    )

    let newStatus = problem.status
    if (rating === 1) {
      newStatus = "need-practice"
    } else if (fsrsResult.reps >= 3 && fsrsResult.stability > 21) {
      newStatus = "mastered"
    } else if (fsrsResult.reps > 0) {
      newStatus = "review"
    } else {
      newStatus = "learning"
    }

    const reviewEntry = {
      id: crypto.randomUUID(),
      problemId: problem.id,
      date: now,
      rating,
      elapsedDays,
      scheduledDays: fsrsResult.scheduledDays,
      state: (fsrsResult.reps === 0 ? "relearning" : fsrsResult.reps < 3 ? "learning" : "review") as "relearning" | "learning" | "review",
      timeTaken,
      confidence,
      editorialUsed,
      mistakes,
    }

    const mistakeEntry = mistakes.length > 0 ? {
      id: crypto.randomUUID(),
      date: now,
      types: mistakes,
      notes,
    } : null

    const updatedMistakes = mistakeEntry
      ? [...problem.mistakeHistory, mistakeEntry]
      : problem.mistakeHistory

    const newTotalAttempts = problem.totalAttempts + 1
    const newSuccessfulAttempts = rating > 1 ? problem.successfulAttempts + 1 : problem.successfulAttempts
    const newTotalSolveTime = problem.totalSolveTime + timeTaken
    const newAverageSolveTime = newTotalSolveTime / newTotalAttempts

    await db.problems.update(problem.id, {
      ...fsrsResult,
      status: newStatus,
      totalAttempts: newTotalAttempts,
      successfulAttempts: newSuccessfulAttempts,
      totalSolveTime: newTotalSolveTime,
      averageSolveTime: newAverageSolveTime,
      editorialUsed: problem.editorialUsed || editorialUsed,
      confidence,
      mistakeHistory: updatedMistakes,
      reviewHistory: [...problem.reviewHistory, reviewEntry],
      updatedAt: now,
    })

    await db.reviewLogs.add(reviewEntry)
    await updateStreak()

    const updated = await db.problems.get(problem.id)
    setProblem(updated)
  }, [problem])

  return { problem, loading, submitReview }
}
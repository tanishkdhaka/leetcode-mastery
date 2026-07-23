/**
 * FSRS (Free Spaced Repetition Scheduler) v4.5 Implementation
 */

import { FSRSRating } from "./types"

const DEFAULT_PARAMS = {
  w: [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
    1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29,
    2.61, 0.0, 0.0, 0.0,
  ] as const,
  requestRetention: 0.9,
  maximumInterval: 36500,
  easyBonus: 1.3,
  hardInterval: 1.2,
}

function normalizeRating(rating: number): 1 | 2 | 3 | 4 {
  if (rating <= 1) return 1
  if (rating === 2) return 2
  if (rating === 3) return 3
  return 4
}

export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0
  return Math.pow(1 + elapsedDays / (9 * stability), -1)
}

export function generateForgettingCurve(
  stability: number,
  elapsedDays: number = 0,
  maxDays: number = 30
): { day: number; retention: number }[] {
  const data: { day: number; retention: number }[] = []
  for (let day = 0; day <= maxDays; day++) {
    data.push({
      day: elapsedDays + day,
      retention: calculateRetrievability(elapsedDays + day, stability),
    })
  }
  return data
}

export function calculateInterval(
  stability: number,
  requestRetention: number = DEFAULT_PARAMS.requestRetention
): number {
  const interval = stability * 9 * (1 / requestRetention - 1)
  return Math.min(Math.max(1, Math.round(interval)), DEFAULT_PARAMS.maximumInterval)
}

export function initializeCard() {
  return {
    fsrsDifficulty: 0,
    stability: 0,
    retrievability: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: null as Date | null,
    nextReview: null as Date | null,
  }
}

export function processReview(
  fsrsDifficulty: number,
  stability: number,
  reps: number,
  lapses: number,
  elapsedDays: number,
  rating: FSRSRating
) {
  const w = DEFAULT_PARAMS.w
  const normalizedRating = normalizeRating(rating)

  const isNew = reps === 0
  const retrievability = calculateRetrievability(elapsedDays, stability)

  let newFsrsDifficulty: number

  if (isNew) {
    newFsrsDifficulty = w[4] - Math.exp(w[5] * (normalizedRating - 1)) + 1
  } else {
    const deltaD = -w[6] * (normalizedRating - 3)
    newFsrsDifficulty = fsrsDifficulty + deltaD * (10 - fsrsDifficulty) / 9
  }

  newFsrsDifficulty = Math.min(10, Math.max(1, newFsrsDifficulty))

  let newStability: number

  if (isNew) {
    newStability = w[8] * Math.exp(w[9] * (normalizedRating - 1))
  } else if (normalizedRating === 1) {
    newStability = w[11] * Math.pow(newFsrsDifficulty, -w[12]) *
                   (Math.pow(stability + 1, w[13]) - 1) *
                   Math.exp(w[14] * (1 - retrievability))
    newStability = Math.max(0.1, newStability)
  } else {
    const hardPenalty = normalizedRating === 2 ? w[15] : 1
    const easyBonus = normalizedRating === 4 ? w[16] : 1

    newStability = stability * (1 +
      Math.exp(w[15]) * (11 - newFsrsDifficulty) * Math.pow(stability, -w[16]) *
      (Math.exp(w[17] * (1 - retrievability)) - 1)) *
      hardPenalty * easyBonus
  }

  let newReps = reps
  let newLapses = lapses

  if (normalizedRating === 1) {
    newLapses += 1
    newReps = 0
  } else {
    newReps += 1
  }

  const nextInterval = calculateInterval(newStability)
  const now = new Date()
  const nextReview = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000)
  const newRetrievability = calculateRetrievability(nextInterval, newStability)

  return {
    fsrsDifficulty: newFsrsDifficulty,
    stability: newStability,
    retrievability: newRetrievability,
    elapsedDays: 0,
    scheduledDays: nextInterval,
    reps: newReps,
    lapses: newLapses,
    lastReview: now,
    nextReview,
  }
}

export function calculateUrgency(
  nextReview: Date | null,
  stability: number,
  retrievability: number
): number {
  if (!nextReview) return Infinity
  const now = new Date()
  const daysOverdue = Math.max(0,
    (now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24)
  )
  const forgettingProb = 1 - retrievability
  const stabilityWeight = 1 / (1 + stability / 10)
  return daysOverdue * 3 + forgettingProb * 2 + stabilityWeight * 1
}

export function getFSRSState(reps: number, lapses: number): string {
  if (reps === 0) return "New"
  if (reps < 3) return "Learning"
  if (lapses > 0 && reps < 3) return "Relearning"
  return "Review"
}

export function calculateCompletion(
  reps: number,
  stability: number,
  confidence: number
): number {
  const repsScore = Math.min(reps / 5, 1) * 40
  const stabilityScore = Math.min(stability / 30, 1) * 35
  const confidenceScore = (confidence / 5) * 25
  return Math.round(repsScore + stabilityScore + confidenceScore)
}
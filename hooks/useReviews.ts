"use client"

import { useState, useEffect, useCallback } from "react"
import { db, type ProblemRecord, getTodayReviews, getUpcomingReviews, getHeatmapData } from "@/lib/db"

export function useReviews() {
  const [todayQueue, setTodayQueue] = useState<ProblemRecord[]>([])
  const [upcoming, setUpcoming] = useState<{ date: string; count: number; problems: ProblemRecord[] }[]>([])
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [queue, up, heat] = await Promise.all([
      getTodayReviews(),
      getUpcomingReviews(7),
      getHeatmapData(),
    ])
    setTodayQueue(queue)
    setUpcoming(up)
    setHeatmap(heat)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { todayQueue, upcoming, heatmap, loading, refresh }
}

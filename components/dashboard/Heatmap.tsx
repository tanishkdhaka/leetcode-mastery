"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HeatmapProps {
  data: { date: string; count: number }[]
}

export function Heatmap({ data }: HeatmapProps) {
  // Group by week
  const weeks: { date: string; count: number }[][] = []
  let currentWeek: { date: string; count: number }[] = []

  data.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const getIntensity = (count: number) => {
    if (count === 0) return "heatmap-0"
    if (count <= 2) return "heatmap-1"
    if (count <= 4) return "heatmap-2"
    if (count <= 6) return "heatmap-3"
    return "heatmap-4"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-colors",
                    getIntensity(day.count)
                  )}
                  title={`${day.date}: ${day.count} reviews`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm heatmap-0" />
            <div className="w-3 h-3 rounded-sm heatmap-1" />
            <div className="w-3 h-3 rounded-sm heatmap-2" />
            <div className="w-3 h-3 rounded-sm heatmap-3" />
            <div className="w-3 h-3 rounded-sm heatmap-4" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}

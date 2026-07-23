"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatRelativeDate } from "@/lib/utils"

interface UpcomingTimelineProps {
  data: { date: string; count: number }[]
  todayReviews: number
}

export function UpcomingTimeline({ data, todayReviews }: UpcomingTimelineProps) {
  const maxCount = Math.max(...data.map((d) => d.count), todayReviews, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Today</span>
            <span className="text-muted-foreground">{todayReviews} due</span>
          </div>
          <Progress value={(todayReviews / maxCount) * 100} />
        </div>
        {data.slice(1).map((day) => (
          <div key={day.date} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatRelativeDate(new Date(day.date))}
              </span>
              <span className="text-muted-foreground">{day.count} due</span>
            </div>
            <Progress value={(day.count / maxCount) * 100} className="bg-muted/50" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

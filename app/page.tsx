"use client"

import { StatCard } from "@/components/dashboard/StatCard"
import { Heatmap } from "@/components/dashboard/Heatmap"
import { UpcomingTimeline } from "@/components/dashboard/UpcomingTimeline"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { useStats } from "@/hooks/useStats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Trophy, 
  Brain, 
  Target, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Flame,
  Zap
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { stats, loading } = useStats()

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const totalProblems = stats.masteredProblems + stats.learningProblems + stats.forgottenProblems + stats.newProblemsRemaining
  const masteryRate = totalProblems > 0 ? Math.round((stats.masteredProblems / totalProblems) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your LeetCode mastery progress</p>
        </div>
        <Link href="/problems">
          <Button className="gap-2">
            <Zap className="w-4 h-4" />
            Start Review
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Reviews"
          value={stats.todayReviews}
          icon={Calendar}
          subtitle="Problems due for review"
        />
        <StatCard
          title="Current Streak"
          value={stats.currentStreak}
          icon={Flame}
          subtitle="Days in a row"
          trend="up"
          trendValue={`+${stats.currentStreak > 0 ? 1 : 0}`}
        />
        <StatCard
          title="Mastered"
          value={stats.masteredProblems}
          icon={Trophy}
          subtitle={`${masteryRate}% of total`}
          trend="up"
        />
        <StatCard
          title="Avg Retention"
          value={`${(stats.averageRetention * 100).toFixed(1)}%`}
          icon={Brain}
          subtitle="Based on FSRS model"
        />
        <StatCard
          title="Learning"
          value={stats.learningProblems}
          icon={Target}
          subtitle="Active problems"
        />
        <StatCard
          title="Need Practice"
          value={stats.forgottenProblems}
          icon={AlertTriangle}
          subtitle="Failed recently"
          trend="down"
        />
        <StatCard
          title="Avg Solve Time"
          value={`${stats.averageSolveTime.toFixed(0)}m`}
          icon={Clock}
          subtitle="Per problem"
        />
        <StatCard
          title="Pattern Accuracy"
          value={`${(stats.patternAccuracy * 100).toFixed(1)}%`}
          icon={TrendingUp}
          subtitle="Across all patterns"
        />
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mastery Progress</span>
              <span className="font-medium">{stats.masteredProblems} / {totalProblems}</span>
            </div>
            <Progress value={masteryRate} className="h-3" />
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div>
                <div className="font-semibold text-emerald-500">{stats.masteredProblems}</div>
                <div className="text-muted-foreground">Mastered</div>
              </div>
              <div>
                <div className="font-semibold text-sky-500">{stats.learningProblems}</div>
                <div className="text-muted-foreground">Learning</div>
              </div>
              <div>
                <div className="font-semibold text-rose-500">{stats.forgottenProblems}</div>
                <div className="text-muted-foreground">Forgotten</div>
              </div>
              <div>
                <div className="font-semibold text-slate-500">{stats.newProblemsRemaining}</div>
                <div className="text-muted-foreground">New</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Heatmap data={stats.heatmapData} />
        </div>
        <UpcomingTimeline data={stats.upcomingReviews} todayReviews={stats.todayReviews} />
      </div>

      <RecentActivity activities={stats.recentActivity} />

      {/* Pattern Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pattern Mastery Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.patternStats.map((pattern) => (
              <div key={pattern.pattern} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{pattern.pattern}</span>
                  <span className="text-xs text-muted-foreground">
                    {pattern.mastered}/{pattern.totalProblems}
                  </span>
                </div>
                <Progress 
                  value={pattern.totalProblems > 0 ? (pattern.mastered / pattern.totalProblems) * 100 : 0} 
                  className="h-2"
                />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Accuracy: {(pattern.accuracy * 100).toFixed(0)}%</span>
                  <span>Retention: {(pattern.averageRetention * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

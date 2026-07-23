"use client"

import { useStats } from "@/hooks/useStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts"
import { Target, Brain, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function PatternsPage() {
  const { stats, loading } = useStats()

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  const radarData = stats.patternStats.map(p => ({
    pattern: p.pattern,
    accuracy: Math.round(p.accuracy * 100),
    retention: Math.round(p.averageRetention * 100),
    completion: p.totalProblems > 0 ? Math.round((p.mastered / p.totalProblems) * 100) : 0,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pattern Mastery</h1>
        <p className="text-muted-foreground mt-1">Analyze your algorithmic pattern strengths</p>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pattern Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="pattern" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Radar name="Retention" dataKey="retention" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.patternStats.map((pattern) => (
          <Card key={pattern.pattern}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{pattern.pattern}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {pattern.totalProblems} problems
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-emerald-500">
                      {pattern.mastered} mastered
                    </Badge>
                  </div>
                </div>
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mastery Progress</span>
                  <span className="font-medium">
                    {pattern.totalProblems > 0 ? Math.round((pattern.mastered / pattern.totalProblems) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={pattern.totalProblems > 0 ? (pattern.mastered / pattern.totalProblems) * 100 : 0} 
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-sm font-semibold">{(pattern.accuracy * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-sky-500">
                    <Brain className="w-3 h-3" />
                    <span className="text-sm font-semibold">{(pattern.averageRetention * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Retention</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-sm font-semibold">{pattern.weakestProblems.length}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Weak Spots</div>
                </div>
              </div>

              {pattern.weakestProblems.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Weakest problems to review:</p>
                  <div className="flex flex-wrap gap-1">
                    {pattern.weakestProblems.map(id => (
                      <Link key={id} href={`/problem/${id}`}>
                        <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary/10">
                          Problem
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

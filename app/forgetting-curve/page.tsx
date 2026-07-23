"use client";

import { useState, useMemo } from "react";
import { useProblems } from "@/hooks/useProblems";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { generateForgettingCurve } from "@/lib/fsrs";
import { Brain, Layers } from "lucide-react";
import Link from "next/link";
import { cn, getStatusColor } from "@/lib/utils";

export default function ForgettingCurvePage() {
  const { problems, loading } = useProblems();
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);

  const patterns = useMemo(
    () => [...new Set(problems.map((p) => p.pattern))].sort(),
    [problems],
  );

  const filteredProblems = useMemo(() => {
    if (selectedPatterns.length === 0)
      return problems.filter((p) => p.status !== "not-started");
    return problems.filter(
      (p) => selectedPatterns.includes(p.pattern) && p.status !== "not-started",
    );
  }, [problems, selectedPatterns]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, i) => i);
    return days.map((day) => {
      const point: any = { day };
      filteredProblems.slice(0, 5).forEach((problem, idx) => {
        const probElapsed = problem.lastReview
          ? Math.floor(
              (new Date().getTime() - problem.lastReview.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const curve = generateForgettingCurve(
          problem.stability || 1,
          probElapsed,
          30,
        );
        point[`p${idx}`] = curve[day]?.retention;
        point[`name${idx}`] = problem.title;
        point[`status${idx}`] = problem.status;
      });
      const avgRetention =
        filteredProblems.length > 0
          ? filteredProblems.reduce((sum, p) => {
              const pElapsed = p.lastReview
                ? Math.floor(
                    (new Date().getTime() - p.lastReview.getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : 0;
              const r =
                generateForgettingCurve(p.stability || 1, pElapsed, 30)[day]
                  ?.retention || 0;
              return sum + r;
            }, 0) / filteredProblems.length
          : 0;
      point.average = avgRetention;
      return point;
    });
  }, [filteredProblems]);

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forgetting Curve</h1>
        <p className="text-muted-foreground mt-1">
          Visualize memory retention over time
        </p>
      </div>

      {/* Pattern Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">
          Filter by pattern:
        </span>
        <button
          onClick={() => setSelectedPatterns([])}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
            selectedPatterns.length === 0
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-accent",
          )}
        >
          All
        </button>
        {patterns.map((pattern) => (
          <button
            key={pattern}
            onClick={() =>
              setSelectedPatterns((prev) =>
                prev.includes(pattern)
                  ? prev.filter((p) => p !== pattern)
                  : [...prev, pattern],
              )
            }
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
              selectedPatterns.includes(pattern)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent",
            )}
          >
            {pattern}
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Retention Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{
                    value: "Days",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${(value * 100).toFixed(1)}%`,
                    "Retention",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#64748b"
                  strokeWidth={3}
                  dot={false}
                  name="Average"
                  strokeDasharray="5 5"
                />
                {filteredProblems.slice(0, 5).map((_, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={`p${idx}`}
                    stroke={colors[idx]}
                    strokeWidth={2}
                    dot={false}
                    name={
                      filteredProblems[idx]?.title.slice(0, 20) ||
                      `Problem ${idx + 1}`
                    }
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Problem List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProblems.slice(0, 12).map((problem) => {
          const probElapsed = problem.lastReview
            ? Math.floor(
                (new Date().getTime() - problem.lastReview.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 0;
          const curve = generateForgettingCurve(
            problem.stability || 1,
            probElapsed,
            30,
          );
          const currentRetention = curve[0]?.retention || 0;
          return (
            <Link key={problem.id} href={`/problem/${problem.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm truncate">
                      {problem.title}
                    </h3>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        getStatusColor(problem.status),
                      )}
                    >
                      {problem.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Current Retention
                      </span>
                      <span className="font-medium">
                        {(currentRetention * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          currentRetention > 0.7
                            ? "bg-emerald-500"
                            : currentRetention > 0.4
                              ? "bg-amber-500"
                              : "bg-rose-500",
                        )}
                        style={{ width: `${currentRetention * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>S: {problem.stability.toFixed(1)}d</span>
                    <span>
                      Next:{" "}
                      {problem.nextReview
                        ? new Date(problem.nextReview).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

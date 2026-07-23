"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProblem } from "@/hooks/useProblems";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  getDifficultyColor,
  getStatusColor,
  getStatusLabel,
  formatDate,
  formatDuration,
  cn,
} from "@/lib/utils";
import { MISTAKE_LABELS, MistakeType } from "@/lib/types";
import { generateForgettingCurve } from "@/lib/fsrs";
import {
  ExternalLink,
  Clock,
  Brain,
  TrendingDown,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  Timer,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProblemPage() {
  const params = useParams();
  const { problem, loading, submitReview } = useProblem(params.id as string);
  const [rating, setRating] = useState<number>(3);
  const [timeTaken, setTimeTaken] = useState<number>(15);
  const [confidence, setConfidence] = useState<number>(3);
  const [editorialUsed, setEditorialUsed] = useState(false);
  const [selectedMistakes, setSelectedMistakes] = useState<MistakeType[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (loading || !problem) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const now = new Date();
  const elapsedDays = problem.lastReview
    ? Math.floor(
        (now.getTime() - problem.lastReview.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;
  const forgettingCurve = generateForgettingCurve(
    problem.stability || 1,
    elapsedDays,
    30,
  );
  const completion =
    problem.totalAttempts > 0
      ? Math.min(
          100,
          Math.round((problem.reps / 5) * 60 + (problem.stability / 30) * 40),
        )
      : 0;

  const handleSubmitReview = async () => {
    await submitReview(
      rating as 1 | 2 | 3 | 4 | 5,
      timeTaken,
      confidence,
      editorialUsed,
      selectedMistakes,
      reviewNotes,
    );
    setShowReviewForm(false);
    setSelectedMistakes([]);
    setReviewNotes("");
  };

  const toggleMistake = (mistake: MistakeType) => {
    setSelectedMistakes((prev) =>
      prev.includes(mistake)
        ? prev.filter((m) => m !== mistake)
        : [...prev, mistake],
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/problems"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Problems
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={cn(getDifficultyColor(problem.difficulty))}>
              {problem.difficulty}
            </Badge>
            <Badge className={cn(getStatusColor(problem.status))}>
              {getStatusLabel(problem.status)}
            </Badge>
            <Badge variant="secondary">{problem.pattern}</Badge>
            <Badge variant="secondary">{problem.topic}</Badge>
          </div>
        </div>
        <a
          href={problem.leetcodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open LeetCode
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{problem.reps}</div>
            <div className="text-xs text-muted-foreground">Repetitions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 text-rose-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{problem.lapses}</div>
            <div className="text-xs text-muted-foreground">Lapses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-sky-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {formatDuration(problem.averageSolveTime)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{completion}%</div>
            <div className="text-xs text-muted-foreground">Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* FSRS State */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">FSRS State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Stability</div>
              <div className="font-semibold">
                {problem.stability.toFixed(2)} days
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Difficulty</div>
              <div className="font-semibold">
                {problem.fsrsDifficulty.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">
                Retrievability
              </div>
              <div className="font-semibold">
                {(problem.retrievability * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Next Review</div>
              <div className="font-semibold">
                {formatRelativeDate(problem.nextReview)}
              </div>
            </div>
          </div>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      {/* Forgetting Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forgetting Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forgettingCurve}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
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
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Review History */}
      {problem.reviewHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {problem.reviewHistory
                .slice(-5)
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {entry.rating > 1 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {entry.rating === 1
                            ? "Again"
                            : entry.rating === 2
                              ? "Hard"
                              : entry.rating === 3
                                ? "Good"
                                : "Easy"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.timeTaken}m · {entry.scheduledDays}d interval
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mistake History */}
      {problem.mistakeHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mistake Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {problem.mistakeHistory
                .slice(-5)
                .reverse()
                .map((entry) => (
                  <div key={entry.id} className="flex flex-wrap gap-2">
                    {entry.types.map((type) => (
                      <Badge
                        key={type}
                        variant="destructive"
                        className="text-[10px]"
                      >
                        {MISTAKE_LABELS[type]}
                      </Badge>
                    ))}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes & Recognition Cues</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={problem.notes}
            readOnly
            className="w-full h-32 p-3 rounded-lg border bg-muted/30 text-sm resize-none focus:outline-none"
            placeholder="No notes yet..."
          />
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Submit Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showReviewForm ? (
            <Button onClick={() => setShowReviewForm(true)} className="w-full">
              Start Review Session
            </Button>
          ) : (
            <>
              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">How did it go?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      value: 1,
                      label: "Again",
                      color: "bg-rose-500 hover:bg-rose-600",
                    },
                    {
                      value: 2,
                      label: "Hard",
                      color: "bg-orange-500 hover:bg-orange-600",
                    },
                    {
                      value: 3,
                      label: "Good",
                      color: "bg-sky-500 hover:bg-sky-600",
                    },
                    {
                      value: 4,
                      label: "Easy",
                      color: "bg-emerald-500 hover:bg-emerald-600",
                    },
                  ].map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => setRating(btn.value)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-white font-medium text-sm transition-all",
                        btn.color,
                        rating === btn.value
                          ? "ring-2 ring-offset-2 ring-primary scale-105"
                          : "opacity-80",
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Taken */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Time Taken (minutes)
                </label>
                <Slider
                  value={timeTaken}
                  min={1}
                  max={120}
                  onChange={setTimeTaken}
                />
              </div>

              {/* Confidence */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Confidence (1-5)
                </label>
                <Slider
                  value={confidence}
                  min={1}
                  max={5}
                  onChange={setConfidence}
                />
              </div>

              {/* Editorial */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editorial"
                  checked={editorialUsed}
                  onChange={(e) => setEditorialUsed(e.target.checked)}
                  className="w-4 h-4 rounded border"
                />
                <label
                  htmlFor="editorial"
                  className="text-sm flex items-center gap-1"
                >
                  <BookOpen className="w-4 h-4" />
                  Used editorial / hints
                </label>
              </div>

              {/* Mistakes */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Mistakes Made (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MISTAKE_LABELS) as MistakeType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => toggleMistake(type)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                          selectedMistakes.includes(type)
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "bg-background hover:bg-accent border-input",
                        )}
                      >
                        {MISTAKE_LABELS[type]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full h-24 p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="What did you learn? What pattern did you miss?"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} className="flex-1">
                  Submit Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return "Not scheduled";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

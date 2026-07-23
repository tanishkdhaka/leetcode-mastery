"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getDifficultyColor,
  getStatusColor,
  getStatusLabel,
  formatRelativeDate,
  cn,
} from "@/lib/utils";
import { ProblemRecord } from "@/lib/db";
import { ExternalLink, Brain, AlertTriangle, Clock } from "lucide-react";

interface ProblemCardProps {
  problem: ProblemRecord;
}

export function ProblemCard({ problem }: ProblemCardProps) {
  const router = useRouter();

  const completion =
    problem.totalAttempts > 0
      ? Math.min(
          100,
          Math.round((problem.reps / 5) * 60 + (problem.stability / 30) * 40),
        )
      : 0;

  const handleCardClick = () => {
    router.push(`/problem/${problem.id}`);
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(problem.leetcodeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      onClick={handleCardClick}
      className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border/50 hover:border-primary/20"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {problem.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  getDifficultyColor(problem.difficulty),
                )}
              >
                {problem.difficulty}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  getStatusColor(problem.status),
                )}
              >
                {getStatusLabel(problem.status)}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleExternalClick}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            title="Open on LeetCode"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px]">
            {problem.pattern}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {problem.topic}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            {problem.reps} reps
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {problem.lapses} lapses
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(problem.nextReview)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Mastery</span>
            <span className="font-medium">{completion}%</span>
          </div>
          <Progress value={completion} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>S: {problem.stability.toFixed(1)}d</span>
          <span>R: {(problem.retrievability * 100).toFixed(1)}%</span>
          <span>D: {(problem.fsrsDifficulty ?? 0).toFixed(1)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

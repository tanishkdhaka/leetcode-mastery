"use client";

import { useState, useMemo } from "react";
import { useProblems } from "@/hooks/useProblems";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { ProblemFilters } from "@/components/problems/ProblemFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { importParetoProblems } from "@/lib/db";
import { ListChecks, Upload, BookOpen } from "lucide-react";
import Fuse from "fuse.js";

export default function ProblemsPage() {
  const { problems, loading, refresh } = useProblems();
  const [filters, setFilters] = useState({
    search: "",
    difficulty: "",
    status: "",
    pattern: "",
    topic: "",
    company: "",
  });

  // Extract unique values for filters
  const patterns = useMemo(
    () => [...new Set(problems.map((p) => p.pattern))].sort(),
    [problems],
  );
  const topics = useMemo(
    () => [...new Set(problems.map((p) => p.topic))].sort(),
    [problems],
  );
  const companies = useMemo(
    () => [...new Set(problems.flatMap((p) => p.companyTags))].sort(),
    [problems],
  );

  // Filter and search
  const filteredProblems = useMemo(() => {
    let result = problems;

    if (filters.difficulty)
      result = result.filter((p) => p.difficulty === filters.difficulty);
    if (filters.status)
      result = result.filter((p) => p.status === filters.status);
    if (filters.pattern)
      result = result.filter((p) => p.pattern === filters.pattern);
    if (filters.topic) result = result.filter((p) => p.topic === filters.topic);
    if (filters.company)
      result = result.filter((p) => p.companyTags.includes(filters.company));

    if (filters.search) {
      const fuse = new Fuse(result, {
        keys: ["title", "pattern", "topic", "companyTags"],
        threshold: 0.4,
      });
      result = fuse.search(filters.search).map((r) => r.item);
    }

    return result;
  }, [problems, filters]);

  // Stats
  const stats = useMemo(() => {
    const total = problems.length;
    const mastered = problems.filter((p) => p.status === "mastered").length;
    const learning = problems.filter(
      (p) => p.status === "learning" || p.status === "review",
    ).length;
    const notStarted = problems.filter(
      (p) => p.status === "not-started",
    ).length;
    return { total, mastered, learning, notStarted };
  }, [problems]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await importParetoProblems(data.problems || data);
    await refresh();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pareto Problems</h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} problems in your collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            <Button asChild variant="outline" className="gap-2 flex items-center justify-center">
              <span>
                <Upload className="w-4 h-4" />
                Import JSON
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">
                {stats.mastered}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mastered</div>
              <Progress
                value={
                  stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0
                }
                className="h-1.5 mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-500">
                {stats.learning}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Learning</div>
              <Progress
                value={
                  stats.total > 0 ? (stats.learning / stats.total) * 100 : 0
                }
                className="h-1.5 mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-500">
                {stats.notStarted}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Not Started
              </div>
              <Progress
                value={
                  stats.total > 0 ? (stats.notStarted / stats.total) * 100 : 0
                }
                className="h-1.5 mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <ProblemFilters
        filters={filters}
        onChange={setFilters}
        patterns={patterns}
        topics={topics}
        companies={companies}
      />

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ListChecks className="w-4 h-4" />
        <span>{filteredProblems.length} problems</span>
      </div>

      {/* Problem Grid */}
      {filteredProblems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No problems found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your filters or import problems
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}
    </div>
  );
}

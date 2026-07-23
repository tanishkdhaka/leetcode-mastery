"use client"

import { cn } from "@/lib/utils"
import { Search, SlidersHorizontal } from "lucide-react"

interface FilterState {
  search: string
  difficulty: string
  status: string
  pattern: string
  topic: string
  company: string
}

interface ProblemFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  patterns: string[]
  topics: string[]
  companies: string[]
}

export function ProblemFilters({ filters, onChange, patterns, topics, companies }: ProblemFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search problems, patterns, companies..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          value={filters.difficulty}
          onChange={(v) => updateFilter("difficulty", v)}
          options={["All", "Easy", "Medium", "Hard"]}
          label="Difficulty"
        />
        <FilterSelect
          value={filters.status}
          onChange={(v) => updateFilter("status", v)}
          options={["All", "not-started", "learning", "review", "mastered", "need-practice"]}
          optionLabels={{ "not-started": "Not Started", "learning": "Learning", "review": "Review", "mastered": "Mastered", "need-practice": "Need Practice" }}
          label="Status"
        />
        <FilterSelect
          value={filters.pattern}
          onChange={(v) => updateFilter("pattern", v)}
          options={["All", ...patterns]}
          label="Pattern"
        />
        <FilterSelect
          value={filters.topic}
          onChange={(v) => updateFilter("topic", v)}
          options={["All", ...topics]}
          label="Topic"
        />
      </div>
    </div>
  )
}

function FilterSelect({ 
  value, 
  onChange, 
  options, 
  optionLabels = {},
  label 
}: { 
  value: string
  onChange: (value: string) => void
  options: string[]
  optionLabels?: Record<string, string>
  label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-md border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt === "All" ? "" : opt}>
          {optionLabels[opt] || opt}
        </option>
      ))}
    </select>
  )
}

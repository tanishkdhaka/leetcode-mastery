import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | null): string {
  if (!date) return "Not scheduled"
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}

export function formatRelativeDate(date: Date | null): string {
  if (!date) return "Not scheduled"
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `${days}d`
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`
  if (minutes < 60) return `${Math.round(minutes)}m`
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    case "Medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20"
    case "Hard": return "text-rose-500 bg-rose-500/10 border-rose-500/20"
    default: return "text-slate-500 bg-slate-500/10 border-slate-500/20"
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "mastered": return "text-emerald-500 bg-emerald-500/10"
    case "learning": return "text-sky-500 bg-sky-500/10"
    case "review": return "text-violet-500 bg-violet-500/10"
    case "need-practice": return "text-rose-500 bg-rose-500/10"
    default: return "text-slate-500 bg-slate-500/10"
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "not-started": return "Not Started"
    case "learning": return "Learning"
    case "review": return "In Review"
    case "mastered": return "Mastered"
    case "need-practice": return "Need Practice"
    default: return status
  }
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

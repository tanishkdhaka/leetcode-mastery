"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  className?: string
}

export function Slider({ value, min = 1, max = 5, step = 1, onChange, className }: SliderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <span className="text-sm font-medium w-6 text-center">{value}</span>
    </div>
  )
}

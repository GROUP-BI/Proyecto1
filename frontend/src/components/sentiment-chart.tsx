"use client"

import { useMemo } from "react"

interface SentimentChartProps {
  sentimentScore: number // Range from -1 (negative) to 1 (positive)
}

export function SentimentChart({ sentimentScore }: SentimentChartProps) {
  // Normalize score to 0-100 range for display
  const normalizedScore = useMemo(() => {
    return Math.round((sentimentScore + 1) * 50)
  }, [sentimentScore])

  // Determine color based on sentiment
  const getColor = useMemo(() => {
    if (normalizedScore < 40) return "bg-red-500"
    if (normalizedScore < 60) return "bg-amber-500"
    return "bg-green-500"
  }, [normalizedScore])

  // Get label based on sentiment
  const getLabel = useMemo(() => {
    if (normalizedScore < 30) return "Very Negative"
    if (normalizedScore < 45) return "Negative"
    if (normalizedScore < 55) return "Neutral"
    if (normalizedScore < 70) return "Positive"
    return "Very Positive"
  }, [normalizedScore])

  return (
    <div className="space-y-2">
      <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor} rounded-full transition-all duration-500`}
          style={{ width: `${normalizedScore}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Negative</span>
        <span className="font-medium">{getLabel}</span>
        <span>Positive</span>
      </div>
    </div>
  )
}


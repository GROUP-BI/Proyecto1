"use client"

import { useMemo } from "react"

interface KeywordHighlighterProps {
  text: string
  keywords: string[]
}

export function KeywordHighlighter({ text, keywords }: KeywordHighlighterProps) {
  const highlightedText = useMemo(() => {
    if (!keywords || keywords.length === 0) return text

    // Create a regex pattern that matches any of the keywords (case insensitive)
    const pattern = new RegExp(`(${keywords.join("|")})`, "gi")

    // Split the text by the pattern and map the parts
    const parts = text.split(pattern)

    return parts.map((part, index) => {
      // Check if this part matches any keyword (case insensitive)
      const isKeyword = keywords.some((keyword) => part.toLowerCase() === keyword.toLowerCase())

      return isKeyword ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    })
  }, [text, keywords])

  return <div className="text-sm whitespace-pre-line">{highlightedText}</div>
}


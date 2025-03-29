export type AnalysisResult = {
  id: string
  timestamp: string
  text: string
  prediction: "FAKE" | "REAL"
  probability: number
  keywords: string[]
  sentimentScore: number // Range from -1 (negative) to 1 (positive)
  emotionalTone: {
    anger: number
    fear: number
    joy: number
    sadness: number
    surprise: number
  }
  sourceCredibility: number // 0-1 scale
  factualConsistency: number // 0-1 scale
}


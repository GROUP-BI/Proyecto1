"use client"

import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"

// Interfaz simple si quieres recibir un array de resultados
interface AnalysisResult {
  id: string
  text: string
  prediction: "FAKE" | "REAL"
  probability: number
  keywords: string[]
}

interface InsightsViewProps {
  // Si en un futuro guardas un historial real, lo pasas por props
  historyData?: AnalysisResult[]
}

export function InsightsView({ historyData = [] }: InsightsViewProps) {
  // Si no hay datos, mostramos un placeholder
  if (historyData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-slate-500">No insights available. Please analyze some news first.</p>
        </CardContent>
      </Card>
    )
  }

  // Calcular métricas simples
  const totalAnalyses = historyData.length
  const fakeCount = historyData.filter((item) => item.prediction === "FAKE").length
  const realCount = totalAnalyses - fakeCount
  const fakePercentage = (fakeCount / totalAnalyses) * 100
  const averageConfidence = historyData.reduce((acc, item) => acc + item.probability, 0) / totalAnalyses

  // Palabras clave más comunes
  const keywordCounts = new Map<string, number>()
  historyData.forEach((item) => {
    item.keywords.forEach((kw) => {
      keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1)
    })
  })
  const topKeywords = Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Analysis Insights</h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">News Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{totalAnalyses}</p>
                  <p className="text-sm text-slate-500">Total analyses</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-green-600">{realCount}</p>
                    <p className="text-xs text-slate-500">Real</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">{fakeCount}</p>
                    <p className="text-xs text-slate-500">Fake</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Real News</span>
                  <span>{Math.round(100 - fakePercentage)}%</span>
                </div>
                <Progress value={100 - fakePercentage} className="h-2 bg-red-100" />

                <div className="flex justify-between text-xs">
                  <span>Fake News</span>
                  <span>{Math.round(fakePercentage)}%</span>
                </div>
                <Progress value={fakePercentage} className="h-2 bg-green-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">Average Confidence</p>
              <p className="text-2xl font-bold">{Math.round(averageConfidence * 100)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(([kw, count]) => (
                <Badge key={kw} variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  {kw} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { mockAnalysisHistory } from "../lib/mock-data"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"

export function InsightsView() {
  // Calculate insights from mock history data
  const totalAnalyses = mockAnalysisHistory.length
  const fakeNewsCount = mockAnalysisHistory.filter((item) => item.prediction === "FAKE").length
  const realNewsCount = totalAnalyses - fakeNewsCount
  const fakeNewsPercentage = (fakeNewsCount / totalAnalyses) * 100

  // Get top keywords
  const keywordCounts = new Map<string, number>()
  mockAnalysisHistory.forEach((item) => {
    item.keywords.forEach((keyword) => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
    })
  })

  const topKeywords = Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Get keywords more common in fake news
  const fakeNewsKeywords = new Map<string, number>()
  const realNewsKeywords = new Map<string, number>()

  mockAnalysisHistory.forEach((item) => {
    item.keywords.forEach((keyword) => {
      if (item.prediction === "FAKE") {
        fakeNewsKeywords.set(keyword, (fakeNewsKeywords.get(keyword) || 0) + 1)
      } else {
        realNewsKeywords.set(keyword, (realNewsKeywords.get(keyword) || 0) + 1)
      }
    })
  })

  const fakeNewsIndicators = Array.from(fakeNewsKeywords.entries())
    .filter(([keyword]) => {
      const fakeCount = fakeNewsKeywords.get(keyword) || 0
      const realCount = realNewsKeywords.get(keyword) || 0
      return fakeCount > realCount && fakeCount >= 2
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map((entry) => entry[0])

  // Calculate average sentiment
  const avgSentiment = mockAnalysisHistory.reduce((acc, item) => acc + item.sentimentScore, 0) / totalAnalyses
  const normalizedSentiment = Math.round((avgSentiment + 1) * 50) // Convert from -1,1 to 0,100

  // Calculate average emotional tone
  const avgEmotionalTone = {
    anger: 0,
    fear: 0,
    joy: 0,
    sadness: 0,
    surprise: 0,
  }

  mockAnalysisHistory.forEach((item) => {
    avgEmotionalTone.anger += item.emotionalTone.anger
    avgEmotionalTone.fear += item.emotionalTone.fear
    avgEmotionalTone.joy += item.emotionalTone.joy
    avgEmotionalTone.sadness += item.emotionalTone.sadness
    avgEmotionalTone.surprise += item.emotionalTone.surprise
  })

  Object.keys(avgEmotionalTone).forEach((key) => {
    avgEmotionalTone[key as keyof typeof avgEmotionalTone] /= totalAnalyses
  })

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
                    <p className="text-xl font-bold text-green-600">{realNewsCount}</p>
                    <p className="text-xs text-slate-500">Real</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">{fakeNewsCount}</p>
                    <p className="text-xs text-slate-500">Fake</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Real News</span>
                  <span>{Math.round(100 - fakeNewsPercentage)}%</span>
                </div>
                <Progress value={100 - fakeNewsPercentage} className="h-2 bg-red-100" />

                <div className="flex justify-between text-xs">
                  <span>Fake News</span>
                  <span>{Math.round(fakeNewsPercentage)}%</span>
                </div>
                <Progress value={fakeNewsPercentage} className="h-2 bg-green-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm">Overall Sentiment</p>
                <Badge
                  variant={normalizedSentiment > 60 ? "default" : normalizedSentiment < 40 ? "destructive" : "outline"}
                >
                  {normalizedSentiment > 60 ? "Positive" : normalizedSentiment < 40 ? "Negative" : "Neutral"}
                </Badge>
              </div>

              <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    normalizedSentiment > 60 ? "bg-green-500" : normalizedSentiment < 40 ? "bg-red-500" : "bg-amber-500"
                  } rounded-full`}
                  style={{ width: `${normalizedSentiment}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>

              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Emotional Tone</p>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(avgEmotionalTone).map(([emotion, value]) => (
                    <div key={emotion} className="text-center">
                      <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-md relative">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-md"
                          style={{ height: `${value * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1 capitalize">{emotion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fake News Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Keywords more commonly found in fake news articles:</p>

              <div className="flex flex-wrap gap-2">
                {fakeNewsIndicators.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  These keywords are statistically more likely to appear in content classified as fake news. Be cautious
                  when encountering articles with multiple indicators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {topKeywords.slice(0, 5).map(([keyword, count], index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-center">
                    <p className="text-lg font-bold">{keyword}</p>
                    <p className="text-xs text-slate-500">{count} occurrences</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {topKeywords.slice(5, 10).map(([keyword, count], index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-center">
                    <p className="text-lg font-bold">{keyword}</p>
                    <p className="text-xs text-slate-500">{count} occurrences</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertTriangle, Download, FileText, Loader2, Upload, X } from "lucide-react"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Textarea } from "./ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { mockNewsArticles } from "../lib/mock-data"
import type { AnalysisResult } from "../lib/types"

export function BatchAnalyzer() {
  const [batchTexts, setBatchTexts] = useState<string[]>([])
  const [textInput, setTextInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("input")

  const addTextToBatch = () => {
    if (!textInput.trim()) return
    setBatchTexts([...batchTexts, textInput])
    setTextInput("")
  }

  const removeTextFromBatch = (index: number) => {
    const newBatch = [...batchTexts]
    newBatch.splice(index, 1)
    setBatchTexts(newBatch)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        // Try to parse as JSON first
        try {
          const jsonData = JSON.parse(content)
          if (Array.isArray(jsonData)) {
            // If it's an array of strings
            if (typeof jsonData[0] === "string") {
              setBatchTexts(jsonData)
            }
            // If it's an array of objects with a text property
            else if (jsonData[0] && typeof jsonData[0].text === "string") {
              setBatchTexts(jsonData.map((item) => item.text))
            }
          } else if (jsonData.texts && Array.isArray(jsonData.texts)) {
            setBatchTexts(jsonData.texts)
          }
        } catch {
          // Not JSON, treat as CSV or plain text
          const lines = content.split(/\r?\n/).filter((line) => line.trim())
          setBatchTexts(lines)
        }
      } catch (err) {
        setError("Failed to parse file. Please check the format.")
        console.error(err)
      }
    }
    reader.readAsText(file)
  }

  const loadSampleBatch = () => {
    setBatchTexts(mockNewsArticles.map((article) => article.text))
  }

  const analyzeBatch = async () => {
    if (batchTexts.length === 0) {
      setError("Please add at least one text to the batch")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setProgress(0)
    setResults([])

    try {
      const batchResults: AnalysisResult[] = []

      for (let i = 0; i < batchTexts.length; i++) {
        // In a real application, this would be an API call to your backend
        // const response = await fetch('/api/analyze', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ text: batchTexts[i] }),
        // })
        // const data = await response.json()

        // Simulating API response for demonstration
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Generate a mock result based on the text content
        const text = batchTexts[i]
        const isFake =
          text.toLowerCase().includes("shocking") ||
          text.toLowerCase().includes("secret") ||
          text.toLowerCase().includes("conspiracy") ||
          Math.random() > 0.6

        const mockResult: AnalysisResult = {
          id: `analysis-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          text: text.length > 100 ? `${text.substring(0, 100)}...` : text,
          prediction: isFake ? "FAKE" : "REAL",
          probability: isFake ? 0.7 + Math.random() * 0.25 : 0.65 + Math.random() * 0.3,
          keywords: extractKeywords(text),
          sentimentScore: Math.random() * 2 - 1, // Range from -1 to 1
          emotionalTone: {
            anger: Math.random() * 0.5,
            fear: isFake ? Math.random() * 0.7 : Math.random() * 0.3,
            joy: Math.random() * 0.4,
            sadness: Math.random() * 0.3,
            surprise: isFake ? Math.random() * 0.8 : Math.random() * 0.4,
          },
          sourceCredibility: isFake ? Math.random() * 0.4 : 0.6 + Math.random() * 0.4,
          factualConsistency: isFake ? Math.random() * 0.5 : 0.7 + Math.random() * 0.3,
        }

        batchResults.push(mockResult)
        setProgress(Math.round(((i + 1) / batchTexts.length) * 100))
      }

      setResults(batchResults)
      setActiveTab("results")
    } catch (err) {
      setError("Failed to analyze the batch. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
      setProgress(100)
    }
  }

  const extractKeywords = (text: string): string[] => {
    // This is a simplified keyword extraction for demonstration
    const words = text.toLowerCase().split(/\s+/)
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "about",
      "as",
      "of",
    ])

    // Filter out common words and get unique words
    const uniqueWords = [
      ...new Set(words.filter((word) => word.length > 3 && !commonWords.has(word) && /^[a-z]+$/.test(word))),
    ]

    // Select a random subset of words as "keywords"
    return uniqueWords.sort(() => Math.random() - 0.5).slice(0, Math.min(5, uniqueWords.length))
  }

  const exportResults = () => {
    if (results.length === 0) return

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `batch-analysis-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const getBatchSummary = () => {
    if (results.length === 0) return null

    const fakeCount = results.filter((r) => r.prediction === "FAKE").length
    const realCount = results.length - fakeCount
    const fakePercentage = (fakeCount / results.length) * 100

    return {
      total: results.length,
      fakeCount,
      realCount,
      fakePercentage,
      averageConfidence: results.reduce((acc, r) => acc + r.probability, 0) / results.length,
      commonKeywords: getCommonKeywords(),
    }
  }

  const getCommonKeywords = () => {
    if (results.length === 0) return []

    // Count keyword occurrences across all results
    const keywordCounts = new Map<string, number>()

    results.forEach((result) => {
      result.keywords.forEach((keyword) => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
      })
    })

    // Sort by frequency and return top 5
    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0])
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="input">Input Batch</TabsTrigger>
          <TabsTrigger value="results" disabled={results.length === 0}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add News Articles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Paste a news article here..."
                    className="min-h-[150px]"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <Button onClick={addTextToBatch} disabled={!textInput.trim()} className="mt-2 w-full">
                    Add to Batch
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Upload File</h4>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Upload a text file with one article per line, or a JSON file with an array of texts
                    </p>
                    <input
                      type="file"
                      id="batch-file-upload"
                      accept=".txt,.json,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("batch-file-upload")?.click()}
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                </div>

                <Button variant="outline" onClick={loadSampleBatch} className="w-full">
                  Load Sample Batch
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch Queue ({batchTexts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {batchTexts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No articles added to batch yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {batchTexts.map((text, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <div className="flex-1 text-sm truncate">
                          {text.length > 60 ? `${text.substring(0, 60)}...` : text}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeTextFromBatch(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <Button onClick={analyzeBatch} disabled={isAnalyzing || batchTexts.length === 0} className="w-full">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing... {progress}%
                      </>
                    ) : (
                      `Analyze Batch (${batchTexts.length})`
                    )}
                  </Button>

                  {isAnalyzing && <Progress value={progress} className="h-2 mt-2" />}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          {results.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Batch Analysis Results</h3>
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Summary Statistics</h4>

                      {getBatchSummary() && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Total Articles</p>
                              <p className="text-2xl font-bold">{getBatchSummary()?.total}</p>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Avg. Confidence</p>
                              <p className="text-2xl font-bold">
                                {Math.round(getBatchSummary()?.averageConfidence! * 100)}%
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Real News</span>
                              <span>
                                {getBatchSummary()?.realCount} articles (
                                {Math.round(100 - getBatchSummary()?.fakePercentage!)}%)
                              </span>
                            </div>
                            <Progress
                              value={100 - getBatchSummary()?.fakePercentage!}
                              className="h-2 bg-red-100 dark:bg-red-900/20"
                            />

                            <div className="flex justify-between text-xs">
                              <span>Fake News</span>
                              <span>
                                {getBatchSummary()?.fakeCount} articles (
                                {Math.round(getBatchSummary()?.fakePercentage!)}%)
                              </span>
                            </div>
                            <Progress
                              value={getBatchSummary()?.fakePercentage!}
                              className="h-2 bg-green-100 dark:bg-green-900/20"
                            />
                          </div>

                          <div>
                            <h5 className="text-xs font-medium mb-2">Common Keywords</h5>
                            <div className="flex flex-wrap gap-2">
                              {getBatchSummary()?.commonKeywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-4">Distribution</h4>
                      <div className="h-[200px] bg-slate-100 dark:bg-slate-800 rounded-md flex items-end p-4 gap-1">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const threshold = i / 10
                          const nextThreshold = (i + 1) / 10
                          const count = results.filter(
                            (r) => r.probability >= threshold && r.probability < nextThreshold,
                          ).length
                          const height = count > 0 ? (count / results.length) * 100 : 0

                          return (
                            <div
                              key={i}
                              className="flex-1 bg-blue-500 rounded-t-sm relative group"
                              style={{ height: `${Math.max(height * 2, 4)}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                                {count} articles ({Math.round(height)}%)
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs mt-2 px-4">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                      <p className="text-xs text-center mt-1 text-slate-500">Confidence Distribution</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Text</TableHead>
                      <TableHead className="w-[100px]">Prediction</TableHead>
                      <TableHead className="w-[100px]">Confidence</TableHead>
                      <TableHead>Keywords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={result.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{result.text}</TableCell>
                        <TableCell>
                          <Badge variant={result.prediction === "FAKE" ? "destructive" : "default"}>
                            {result.prediction}
                          </Badge>
                        </TableCell>
                        <TableCell>{Math.round(result.probability * 100)}%</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {result.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {result.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}


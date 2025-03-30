"use client"

import { AlertTriangle, Download, FileText, Loader2, Upload, X } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Textarea } from "./ui/textarea"

// Tipo simplificado de resultado de análisis (ya sin sentiment, emotionalTone, etc.)
interface AnalysisResult {
  id: string
  text: string
  prediction: "FAKE" | "REAL"
  probability: number
  keywords: string[]
}

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
        // Procesar el archivo como texto plano (cada línea un artículo) o JSON
        const lines = content.split(/\r?\n/).filter((line) => line.trim())
        setBatchTexts((prev) => [...prev, ...lines])
      } catch (err) {
        setError("Failed to parse file. Please check the format.")
        console.error(err)
      }
    }
    reader.readAsText(file)
  }

  const loadSampleBatch = () => {
    // Ejemplo: añade manualmente 2 textos de prueba
    setBatchTexts([
      "Breaking news: Government announces new policy to tackle inflation...",
      "Shocking secret meeting reveals global conspiracy about microchips..."
    ])
  }

  // Lógica principal para llamar a la API
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
      // Construimos la lista de ítems
      const newsItems = batchTexts.map((text, idx) => ({
        id: `batch-item-${idx}`,
        title: "",     // No tenemos título, puedes dejarlo vacío
        text: text
      }))

      // Llamada real a tu endpoint /api/v1/predict
      setProgress(30)
      const response = await fetch("/api/v1/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news_items: newsItems })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setProgress(70)

      // data.predictions es un array de objetos con { id, prediction, probability, keywords }
      const batchResults: AnalysisResult[] = data.predictions.map((pred: any) => {
        const originalText = batchTexts.find((t, i) => `batch-item-${i}` === pred.id) || ""
        return {
          id: pred.id,
          text: originalText,
          prediction: pred.prediction,
          probability: pred.probability,
          keywords: pred.keywords || []
        }
      })

      setResults(batchResults)
      setActiveTab("results")
      setProgress(100)

    } catch (err) {
      setError("Failed to analyze the batch. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Cálculo de métricas simples (fake vs real, etc.)
  const getBatchSummary = () => {
    if (results.length === 0) return null
    const fakeCount = results.filter((r) => r.prediction === "FAKE").length
    const realCount = results.length - fakeCount
    const fakePercentage = (fakeCount / results.length) * 100
    const averageConfidence = results.reduce((acc, r) => acc + r.probability, 0) / results.length

    // Contar keywords
    const keywordCounts = new Map<string, number>()
    results.forEach((res) => {
      res.keywords.forEach((kw) => {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1)
      })
    })
    const commonKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k)

    return {
      total: results.length,
      fakeCount,
      realCount,
      fakePercentage,
      averageConfidence,
      commonKeywords
    }
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

        {/* TAB 1: INPUT */}
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

                <Button variant="secondary" onClick={loadSampleBatch} className="w-full">
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
                      <div key={index} className="flex items-start gap-2 p-2 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-md">
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

        {/* TAB 2: RESULTS */}
        <TabsContent value="results">
          {results.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Batch Analysis Results</h3>
                {/* Ejemplo de exportar resultados */}
                <Button variant="outline" size="sm" onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2))
                  const downloadAnchorNode = document.createElement("a")
                  downloadAnchorNode.setAttribute("href", dataStr)
                  downloadAnchorNode.setAttribute("download", `batch-analysis-${new Date().toISOString().slice(0, 10)}.json`)
                  document.body.appendChild(downloadAnchorNode)
                  downloadAnchorNode.click()
                  downloadAnchorNode.remove()
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>

              {/* Resumen */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Summary Statistics</h4>
                      {getBatchSummary() && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[hsl(var(--card))] p-3 rounded-md text-center">
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Articles</p>
                              <p className="text-2xl font-bold">{getBatchSummary()?.total}</p>
                            </div>
                            <div className="bg-[hsl(var(--card))] p-3 rounded-md text-center">
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg. Confidence</p>
                              <p className="text-2xl font-bold">
                                {Math.round(getBatchSummary()!.averageConfidence * 100)}%
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Real News</span>
                              <span>
                                {getBatchSummary()!.realCount} articles (
                                {Math.round(100 - getBatchSummary()!.fakePercentage)}%)
                              </span>
                            </div>
                            <Progress
                              value={100 - getBatchSummary()!.fakePercentage}
                              className="h-2 bg-[hsl(var(--accent))]"
                            />

                            <div className="flex justify-between text-xs">
                              <span>Fake News</span>
                              <span>
                                {getBatchSummary()!.fakeCount} articles ({Math.round(getBatchSummary()!.fakePercentage)}%)
                              </span>
                            </div>
                            <Progress
                              value={getBatchSummary()!.fakePercentage}
                              className="h-2 bg-[hsl(var(--accent))]"
                            />
                          </div>

                          <div>
                            <h5 className="text-xs font-medium mb-2">Common Keywords</h5>
                            <div className="flex flex-wrap gap-2">
                              {getBatchSummary()!.commonKeywords.map((keyword, index) => (
                                <Badge key={index} variant="outline" className="bg-[hsl(var(--highlight-bg))] text-[hsl(var(--highlight-text))]">
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
                      <div className="h-[200px] bg-[hsl(var(--card))] rounded-md flex items-end p-4 gap-1">
                        {/* Distribución de la probabilidad en rangos de 0.1 */}
                        {Array.from({ length: 10 }).map((_, i) => {
                          const threshold = i / 10
                          const nextThreshold = (i + 1) / 10
                          const count = results.filter(
                            (r) => r.probability >= threshold && r.probability < nextThreshold
                          ).length
                          const height = count > 0 ? (count / results.length) * 100 : 0

                          return (
                            <div
                              key={i}
                              className="flex-1 bg-[hsl(var(--primary))] rounded-t-sm relative group"
                              style={{ height: `${Math.max(height * 2, 4)}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
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

              {/* Tabla de resultados */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Text</TableHead>
                      <TableHead className="w-[100px]">Prediction</TableHead>
                      <TableHead className="w-[100px]">Confidence</TableHead>
                      <TableHead className="w-[120px]">Keywords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((res, index) => (
                      <TableRow key={res.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {res.text.length > 60 ? `${res.text.substring(0, 60)}...` : res.text}
                        </TableCell>
                        <TableCell>
                          <Badge variant={res.prediction === "FAKE" ? "destructive" : "default"}>
                            {res.prediction}
                          </Badge>
                        </TableCell>
                        <TableCell>{Math.round(res.probability * 100)}%</TableCell>
                        <TableCell className="text-xs">
                          {res.keywords.join(", ")}
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

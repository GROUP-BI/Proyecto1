"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { AlertTriangle, CheckCircle, Search, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { mockAnalysisHistory } from "../lib/mock-data"
import type { AnalysisResult } from "../lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"

export function HistoryView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [history, setHistory] = useState<AnalysisResult[]>(mockAnalysisHistory)
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)

  const filteredHistory = history.filter(
    (item) =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your analysis history?")) {
      setHistory([])
    }
  }

  const deleteHistoryItem = (id: string) => {
    setHistory(history.filter((item) => item.id !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Analysis History</h3>
        <Button variant="outline" size="sm" onClick={clearHistory} disabled={history.length === 0}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search history..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">No history found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
              Your analysis history will appear here once you start analyzing news articles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead>Text</TableHead>
                <TableHead className="w-[100px]">Result</TableHead>
                <TableHead className="w-[100px]">Confidence</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">{formatDate(item.timestamp)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{item.text}</TableCell>
                  <TableCell>
                    <Badge variant={item.prediction === "FAKE" ? "destructive" : "default"}>{item.prediction}</Badge>
                  </TableCell>
                  <TableCell>{Math.round(item.probability * 100)}%</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedResult(item)}>
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Analysis Details</DialogTitle>
                            <DialogDescription>Analyzed on {formatDate(item.timestamp)}</DialogDescription>
                          </DialogHeader>

                          {selectedResult && (
                            <div className="mt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {selectedResult.prediction === "FAKE" ? (
                                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                  ) : (
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                  )}
                                  <h3 className="text-xl font-semibold">
                                    {selectedResult.prediction === "FAKE"
                                      ? "Potentially Fake News"
                                      : "Likely Authentic News"}
                                  </h3>
                                </div>
                                <Badge variant={selectedResult.prediction === "FAKE" ? "destructive" : "default"}>
                                  {selectedResult.prediction}
                                </Badge>
                              </div>

                              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                                <h4 className="text-sm font-medium mb-2">Original Text</h4>
                                <p className="text-sm whitespace-pre-line">{selectedResult.text}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Confidence</h4>
                                  <p className="text-lg font-bold">{Math.round(selectedResult.probability * 100)}%</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Source Credibility</h4>
                                  <p className="text-lg font-bold">
                                    {Math.round(selectedResult.sourceCredibility * 100)}%
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium mb-2">Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedResult.keywords.map((keyword, index) => (
                                    <Badge key={index} variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button variant="ghost" size="sm" onClick={() => deleteHistoryItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}


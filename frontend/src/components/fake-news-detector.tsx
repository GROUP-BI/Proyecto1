"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { NewsAnalyzer } from "./news-analyzer"
import { BatchAnalyzer } from "./batch-analyzer"
import { ModelTrainer } from "./model-trainer"
import { ThemeToggle } from "./theme-toggle"
import { HistoryView } from "./history-view"
import { InsightsView } from "./insights-view"
import { BarChart3, FileText, History, Layers, Settings, Zap } from "lucide-react"

export function FakeNewsDetector() {
  const [activeTab, setActiveTab] = useState("analyze")

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Zap className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Political News Analysis Platform
          </h2>
        </div>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="analyze" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="analyze" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Single</span> Analysis
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Batch</span> Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="train" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Model</span> Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <NewsAnalyzer />
        </TabsContent>

        <TabsContent value="batch">
          <BatchAnalyzer />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsView />
        </TabsContent>

        <TabsContent value="history">
          <HistoryView />
        </TabsContent>

        <TabsContent value="train">
          <ModelTrainer />
        </TabsContent>
      </Tabs>
    </div>
  )
}


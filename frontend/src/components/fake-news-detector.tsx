'use client';

import {
  BarChart3,
  FileText,
  History,
  Layers,
  Settings,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { BatchAnalyzer } from './batch-analyzer';
import { HistoryView } from './history-view';
import { InsightsView } from './insights-view';
import { ModelTrainer } from './model-trainer';
import { NewsAnalyzer } from './news-analyzer';
import { ThemeToggle } from './theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function FakeNewsDetector() {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div className="bg-[hsl(var(--card))] text-card-foreground rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Zap className="h-6 w-6 text-primary mr-2" />
          <h2 className="text-2xl font-semibold">
            Political News Analysis Platform
          </h2>
        </div>
        <ThemeToggle />
      </div>

      <Tabs
        defaultValue="analyze"
        value={activeTab}
        onValueChange={setActiveTab}
      >
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
  );
}

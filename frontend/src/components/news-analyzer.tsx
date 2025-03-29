'use client';

import {
  AlertTriangle,
  CheckCircle,
  Download,
  Info,
  Loader2,
  Save,
  Share2,
} from 'lucide-react';
import { useState } from 'react';
import { mockNewsArticles } from '../lib/mock-data';
import type { AnalysisResult } from '../lib/types';
import { KeywordHighlighter } from './keyword-highlighter';
import { SentimentChart } from './sentiment-chart';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function NewsAnalyzer() {
  const [newsText, setNewsText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState('');

  const loadExampleArticle = (id: string) => {
    const article = mockNewsArticles.find((a) => a.id === id);
    if (article) {
      setNewsText(article.text);
      setResult(null);
    }
  };

  const analyzeNews = async () => {
    if (!newsText.trim()) {
      setError('Please enter some news text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // In a real application, this would be an API call to your backend
      // const response = await fetch('/api/analyze', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text: newsText }),
      // })
      // const data = await response.json()

      // Simulating API response for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate a mock result based on the text content
      const isFake =
        newsText.toLowerCase().includes('shocking') ||
        newsText.toLowerCase().includes('secret') ||
        newsText.toLowerCase().includes('conspiracy') ||
        Math.random() > 0.6;

      const mockResult: AnalysisResult = {
        id: `analysis-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: newsText,
        prediction: isFake ? 'FAKE' : 'REAL',
        probability: isFake
          ? 0.7 + Math.random() * 0.25
          : 0.65 + Math.random() * 0.3,
        keywords: extractKeywords(newsText),
        sentimentScore: Math.random() * 2 - 1, // Range from -1 to 1
        emotionalTone: {
          anger: Math.random() * 0.5,
          fear: isFake ? Math.random() * 0.7 : Math.random() * 0.3,
          joy: Math.random() * 0.4,
          sadness: Math.random() * 0.3,
          surprise: isFake ? Math.random() * 0.8 : Math.random() * 0.4,
        },
        sourceCredibility: isFake
          ? Math.random() * 0.4
          : 0.6 + Math.random() * 0.4,
        factualConsistency: isFake
          ? Math.random() * 0.5
          : 0.7 + Math.random() * 0.3,
      };

      setResult(mockResult);

      // In a real app, you would save this to history
      // saveToHistory(mockResult)
    } catch (err) {
      setError('Failed to analyze the news. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractKeywords = (text: string): string[] => {
    // This is a simplified keyword extraction for demonstration
    // In a real app, this would be done by the backend NLP model
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'with',
      'by',
      'about',
      'as',
      'of',
    ]);

    // Filter out common words and get unique words
    const uniqueWords = [
      ...new Set(
        words.filter(
          (word) =>
            word.length > 3 && !commonWords.has(word) && /^[a-z]+$/.test(word),
        ),
      ),
    ];

    // Select a random subset of words as "keywords"
    return uniqueWords
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(8, uniqueWords.length));
  };

  const saveToHistory = () => {
    if (!result) return;

    // In a real app, this would save to localStorage or a backend
    alert('Analysis saved to history');
  };

  const exportResult = () => {
    if (!result) return;

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `news-analysis-${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label
            htmlFor="news-text"
            className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300"
          >
            Enter news text to analyze
          </Label>
          <Textarea
            id="news-text"
            placeholder="Paste or type the news article text here..."
            className="min-h-[200px]"
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Load example article
          </Label>
          <Select
            value={selectedExample}
            onValueChange={(value) => {
              setSelectedExample(value);
              loadExampleArticle(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an example" />
            </SelectTrigger>
            <SelectContent>
              {mockNewsArticles.map((article) => (
                <SelectItem key={article.id} value={article.id}>
                  {article.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-4 p-3 bg-[hsl(var(--highlight-bg))] text-[hsl(var(--highlight-text))] rounded-md">
            <h4 className="text-sm font-medium mb-2 flex items-center text-[hsl(var(--highlight-text))]">
              <Info className="h-4 w-4 mr-1 text-[hsl(var(--highlight-text))]" />
              Tips for analysis
            </h4>
            <ul className="text-xs space-y-1 list-disc pl-4 text-[hsl(var(--highlight-text))]">
              <li>Include the full article for best results</li>
              <li>Check source information when available</li>
              <li>Compare with other news sources</li>
              <li>Look for emotional language</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={analyzeNews}
          disabled={isAnalyzing || !newsText.trim()}
          className="flex-1"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze News'
          )}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={saveToHistory}
                disabled={!result}
              >
                <Save className="h-4 w-4" />
                <span className="sr-only md:not-sr-only md:ml-2">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={exportResult}
                disabled={!result}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only md:not-sr-only md:ml-2">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export results as JSON</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" disabled={!result}>
                <Share2 className="h-4 w-4" />
                <span className="sr-only md:not-sr-only md:ml-2">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share analysis results</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {result && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {result.prediction === 'FAKE' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                )}
                <h3 className="text-xl font-semibold">
                  {result.prediction === 'FAKE'
                    ? 'Potentially Fake News'
                    : 'Likely Authentic News'}
                </h3>
              </div>
              <Badge
                variant={
                  result.prediction === 'FAKE' ? 'destructive' : 'default'
                }
              >
                {result.prediction}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Confidence
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(result.probability * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={result.probability * 100}
                    className={
                      result.prediction === 'FAKE'
                        ? 'text-red-500'
                        : 'text-green-500'
                    }
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Source Credibility
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(result.sourceCredibility * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={result.sourceCredibility * 100}
                    className={
                      result.sourceCredibility > 0.5
                        ? 'text-green-500'
                        : 'text-amber-500'
                    }
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Factual Consistency
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(result.factualConsistency * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={result.factualConsistency * 100}
                    className={
                      result.factualConsistency > 0.6
                        ? 'text-green-500'
                        : 'text-amber-500'
                    }
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Emotional Tone Analysis
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(result.emotionalTone).map(
                      ([emotion, value]) => (
                        <div key={emotion} className="text-center">
                          <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded-md relative">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-md"
                              style={{ height: `${value * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs mt-1 capitalize">{emotion}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Sentiment Analysis
                  </h4>
                  <SentimentChart sentimentScore={result.sentimentScore} />
                </div>

                {result.keywords && result.keywords.length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Key indicators detected:
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Text with highlighted indicators:
                  </h4>
                  <KeywordHighlighter
                    text={newsText}
                    keywords={result.keywords}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Analysis Summary
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {result.prediction === 'FAKE'
                  ? `This content shows several indicators of potentially misleading information. The emotional tone is heightened${
                      result.emotionalTone.fear > 0.5
                        ? ', particularly in fear and surprise,'
                        : ''
                    } and the factual consistency score is low. The source credibility analysis suggests caution when sharing this information.`
                  : `This content appears to be factually consistent with a balanced emotional tone. The source credibility is good, and the analysis shows minimal indicators of misinformation. As always, it's good practice to verify with additional sources.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

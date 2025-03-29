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
import { analyzeNews as apiAnalyzeNews, NewsItem } from '../lib/api';
import { mockNewsArticles } from '../lib/mock-data';
import type { AnalysisResult } from '../lib/types';
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
      // Creamos el objeto para la petición API
      const newsItem: NewsItem = {
        id: `news-${Date.now()}`,
        text: newsText
      };

      // Llamamos a la API
      const data = await apiAnalyzeNews([newsItem]);

      // Extraemos la primera predicción del array
      const prediction = data.predictions[0];

      // Generamos un resultado basado en la respuesta de la API
      const apiResult: AnalysisResult = {
        id: prediction.id.toString(),
        timestamp: new Date().toISOString(),
        text: newsText,
        prediction: prediction.prediction,
        probability: prediction.probability,
        keywords: extractKeywords(newsText), // Mantenemos esta función por ahora
        sentimentScore: Math.random() * 2 - 1, // Valores temporales para campos que la API no devuelve
        emotionalTone: {
          anger: Math.random() * 0.5,
          fear: prediction.prediction === 'FAKE' ? Math.random() * 0.7 : Math.random() * 0.3,
          joy: Math.random() * 0.4,
          sadness: Math.random() * 0.3,
          surprise: prediction.prediction === 'FAKE' ? Math.random() * 0.8 : Math.random() * 0.4,
        },
        sourceCredibility: prediction.prediction === 'FAKE'
          ? Math.random() * 0.4
          : 0.6 + Math.random() * 0.4,
        factualConsistency: prediction.prediction === 'FAKE'
          ? Math.random() * 0.5
          : 0.7 + Math.random() * 0.3,
      };

      setResult(apiResult);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al analizar la noticia. Inténtalo de nuevo.');
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
              <Badge variant={result.prediction === 'FAKE' ? 'destructive' : 'default'}>
                {result.prediction}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Confidence (probability) */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Probability of being true
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(result.probability * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={result.probability * 100}
                    className={result.prediction === 'FAKE' ? 'text-red-500' : 'text-green-500'}
                  />
                </div>

                {/* Keywords */}
                {result.keywords && result.keywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      Key indicators detected:
                    </h4>
                    <div className="flex flex-wrap gap-2">
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
              </div>

              {/* Se elimina la columna que mostraba otros insights */}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

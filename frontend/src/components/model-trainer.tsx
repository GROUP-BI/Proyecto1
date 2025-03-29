"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Loader2, AlertTriangle, Upload, FileText, CheckCircle, Info } from "lucide-react"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Input } from "./ui/input"
import { Switch } from "./ui/switch"

type TrainingMethod = "incremental" | "full" | "transfer"
type TrainingResult = {
  success: boolean
  metrics: {
    precision: number
    recall: number
    f1Score: number
    accuracy: number
  }
  modelVersion: string
  trainingTime: number
}

export function ModelTrainer() {
  const [trainingMethod, setTrainingMethod] = useState<TrainingMethod>("incremental")
  const [trainingData, setTrainingData] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [result, setResult] = useState<TrainingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [advancedOptions, setAdvancedOptions] = useState(false)
  const [epochs, setEpochs] = useState("10")
  const [learningRate, setLearningRate] = useState("0.001")
  const [batchSize, setBatchSize] = useState("32")
  const [validationSplit, setValidationSplit] = useState("0.2")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const simulateTraining = async () => {
    setIsTraining(true)
    setTrainingProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setTrainingProgress(i)
      }

      // Mock result - in production this would come from your API
      setResult({
        success: true,
        metrics: {
          precision: 0.85 + Math.random() * 0.1,
          recall: 0.82 + Math.random() * 0.1,
          f1Score: 0.83 + Math.random() * 0.1,
          accuracy: 0.88 + Math.random() * 0.1,
        },
        modelVersion: `v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        trainingTime: Math.floor(Math.random() * 120) + 60, // 60-180 seconds
      })
    } catch (err) {
      setError("Failed to train the model. Please try again.")
      console.error(err)
    } finally {
      setIsTraining(false)
    }
  }

  const trainModel = async () => {
    if (!file && !trainingData.trim()) {
      setError("Please provide training data either by file upload or text input")
      return
    }

    simulateTraining()

    // In a real application, this would be an API call to your backend
    // const formData = new FormData()
    // if (file) formData.append('file', file)
    // if (trainingData) formData.append('textData', trainingData)
    // formData.append('method', trainingMethod)
    // formData.append('epochs', epochs)
    // formData.append('learningRate', learningRate)
    // formData.append('batchSize', batchSize)
    // formData.append('validationSplit', validationSplit)

    // const response = await fetch('/api/retrain', {
    //   method: 'POST',
    //   body: formData,
    // })
    // const result = await response.json()
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Expert Feature</AlertTitle>
        <AlertDescription>
          Model retraining is intended for data scientists and ML engineers. Incorrect training data may negatively
          impact model performance.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Retraining Method</h3>

          <RadioGroup
            value={trainingMethod}
            onValueChange={(value) => setTrainingMethod(value as TrainingMethod)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="incremental" id="incremental" />
              <div className="grid gap-1.5">
                <Label htmlFor="incremental" className="font-medium">
                  Incremental Training
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Updates the existing model with new data while preserving previous knowledge. Best for regular updates
                  with small datasets.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="full" id="full" />
              <div className="grid gap-1.5">
                <Label htmlFor="full" className="font-medium">
                  Full Retraining
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Rebuilds the model from scratch using all available data. Best when significant changes in data
                  patterns are expected.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="transfer" id="transfer" />
              <div className="grid gap-1.5">
                <Label htmlFor="transfer" className="font-medium">
                  Transfer Learning
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Fine-tunes the model on domain-specific data while leveraging pre-trained weights. Best for
                  specialized use cases with limited training data.
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="advanced-options" checked={advancedOptions} onCheckedChange={setAdvancedOptions} />
            <Label htmlFor="advanced-options">Show advanced options</Label>
          </div>

          {advancedOptions && (
            <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-md">
              <div className="space-y-2">
                <Label htmlFor="epochs">Epochs</Label>
                <Input
                  id="epochs"
                  type="number"
                  min="1"
                  max="100"
                  value={epochs}
                  onChange={(e) => setEpochs(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learning-rate">Learning Rate</Label>
                <Input
                  id="learning-rate"
                  type="number"
                  min="0.0001"
                  max="0.1"
                  step="0.0001"
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-size">Batch Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  min="1"
                  max="256"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validation-split">Validation Split</Label>
                <Input
                  id="validation-split"
                  type="number"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={validationSplit}
                  onChange={(e) => setValidationSplit(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Tabs defaultValue="file">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="text">Enter Text</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <Card>
                <CardContent className="pt-6">
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
                    <FileText className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-sm font-medium mb-2">Upload Training Data</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Upload a CSV file with labeled news data. The file should include text content and a "fake" label
                      column.
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      accept=".csv,.json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className="mb-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                    {file && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Selected: {file.name}</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
              <div className="space-y-4">
                <Label htmlFor="training-data">Enter labeled training data (JSON format)</Label>
                <Textarea
                  id="training-data"
                  placeholder={`[
  {"text": "Government announces new policy", "fake": false},
  {"text": "Secret meeting reveals conspiracy", "fake": true}
]`}
                  className="min-h-[200px] font-mono text-sm"
                  value={trainingData}
                  onChange={(e) => setTrainingData(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="flex items-center mb-1">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">Data Format Requirements</h4>
            </div>
            <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 list-disc pl-4">
              <li>CSV files must have "text" and "fake" columns</li>
              <li>JSON data must be an array of objects with "text" and "fake" properties</li>
              <li>The "fake" field should be a boolean (true/false)</li>
              <li>For best results, include at least 50 examples</li>
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

      <Button onClick={trainModel} disabled={isTraining || (!file && !trainingData.trim())} className="w-full">
        {isTraining ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Training Model... {trainingProgress}%
          </>
        ) : (
          "Train Model"
        )}
      </Button>

      {isTraining && <Progress value={trainingProgress} className="h-2" />}

      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium">Model Training Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Model Version</p>
                <p className="text-lg font-bold">{result.modelVersion}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Training Time</p>
                <p className="text-lg font-bold">{result.trainingTime} seconds</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Precision</p>
                <div className="flex items-center">
                  <Progress value={result.metrics.precision * 100} className="h-2 mr-2" />
                  <span className="text-sm font-medium">{(result.metrics.precision * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Recall</p>
                <div className="flex items-center">
                  <Progress value={result.metrics.recall * 100} className="h-2 mr-2" />
                  <span className="text-sm font-medium">{(result.metrics.recall * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">F1 Score</p>
                <div className="flex items-center">
                  <Progress value={result.metrics.f1Score * 100} className="h-2 mr-2" />
                  <span className="text-sm font-medium">{(result.metrics.f1Score * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Accuracy</p>
                <div className="flex items-center">
                  <Progress value={result.metrics.accuracy * 100} className="h-2 mr-2" />
                  <span className="text-sm font-medium">{(result.metrics.accuracy * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Performance Change</p>
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{(Math.random() * 5).toFixed(1)}% improvement</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Model Status</p>
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Active and serving predictions</span>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Model Updated</AlertTitle>
              <AlertDescription>
                The new model has been deployed and will be used for all future predictions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


"use client"

import type React from "react"

import { AlertTriangle, CheckCircle, FileText, Loader2, Upload } from "lucide-react"
import { useState } from "react"
import { retrainModel, TrainingItem } from "../lib/api"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Label } from "./ui/label"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Textarea } from "./ui/textarea"
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
  const [trainingData, setTrainingData] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [result, setResult] = useState<TrainingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }


  const trainModel = async () => {
    if (!file && !trainingData.trim()) {
      setError("Please provide training data either by file upload or text input");
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setError(null);

    try {
      // Procesamiento del texto o archivo para enviar a la API
      let trainingItems: TrainingItem[] = [];

      if (trainingData.trim()) {
        // Si hay datos en formato texto, intentamos parsearlo
        try {
          // Asumimos que los datos siguen el formato: ID;Label;Titulo;Descripcion;Fecha
          // Ignoramos la primera línea si contiene encabezados
          const lines = trainingData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

          if (lines.length === 0) {
            throw new Error("No se encontraron datos válidos en el texto ingresado");
          }

          // Detectar si la primera línea contiene encabezados
          let startIndex = 0;
          const firstLine = lines[0].toUpperCase();
          if (firstLine.includes('ID') &&
            (firstLine.includes('LABEL') || firstLine.includes('ETIQUETA')) &&
            firstLine.includes('TITULO') &&
            (firstLine.includes('DESCRIPCION') || firstLine.includes('CONTENIDO')) &&
            firstLine.includes('FECHA')) {
            startIndex = 1;
          }

          // Detectar el separador (coma o punto y coma)
          let separator = ';';
          if (lines[0].includes(',') && !lines[0].includes(';')) {
            separator = ',';
          }

          const processedLines = [];

          // Procesar cada línea
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(separator).map(part => part.trim());

            if (parts.length < 5) {
              console.warn(`La línea ${i + 1} tiene solo ${parts.length} columnas: ${line}`);
              continue; // Ignorar líneas con formato incorrecto
            }

            try {
              const [id, labelRaw, titulo, descripcion, fecha] = parts;
              // Convertir el valor a 'FAKE' o 'REAL' según sea 0 o 1
              const label = (labelRaw.trim() === '0') ? 'FAKE' as const : (labelRaw.trim() === '1' ? 'REAL' as const : '');

              if (label !== 'FAKE' && label !== 'REAL') {
                console.warn(`Etiqueta inválida en línea ${i + 1}: "${labelRaw}". Se esperaba 0 o 1.`);
                continue; // Ignorar esta línea y continuar con las demás
              }

              // Creamos el texto combinando título y descripción
              const text = `${titulo}. ${descripcion}`;
              processedLines.push({ text, label });
            } catch (lineError) {
              console.warn(`Error al procesar línea ${i + 1}: ${lineError}`);
              // Continuar con las siguientes líneas
            }
          }

          if (processedLines.length === 0) {
            throw new Error("No se pudieron procesar datos válidos del texto ingresado. Verifica el formato.");
          }

          trainingItems = processedLines;
          console.log(`Procesadas ${trainingItems.length} líneas válidas de un total de ${lines.length - startIndex} líneas de datos.`);
        } catch (e) {
          console.error("Error detallado:", e);
          throw new Error(e instanceof Error ? e.message : "Formato de datos inválido. Cada línea debe seguir el formato: ID;Label;Titulo;Descripcion;Fecha");
        }
      }
      else if (file) {
        // Procesamiento de archivo CSV con formato específico
        setTrainingProgress(30);

        try {
          const text = await file.text();
          // Eliminar BOM si existe y espacios en blanco
          const cleanText = text.replace(/^\uFEFF/, '').trim();
          const lines = cleanText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

          if (lines.length === 0) {
            throw new Error("El archivo está vacío o no contiene datos válidos");
          }

          // Verificar encabezados - ser más flexible con la detección
          const firstLine = lines[0].toUpperCase();
          const requiredHeaders = ["ID", "LABEL", "TITULO", "DESCRIPCION", "FECHA"];

          // Detectar el tipo de separador (coma o punto y coma)
          let separator = ';';
          if (firstLine.includes(',') && !firstLine.includes(';')) {
            separator = ',';
          }

          const headers = firstLine.split(separator).map(h => h.trim());

          // Comprobar si los encabezados requeridos están presentes (ignorando mayúsculas/minúsculas)
          const headersValid = requiredHeaders.every(required =>
            headers.some(h => h.toUpperCase() === required)
          );

          if (!headersValid) {
            console.error("Encabezados encontrados:", headers);
            throw new Error(`Encabezados incorrectos. Se requieren: ${requiredHeaders.join(', ')}. Encabezados encontrados: ${headers.join(', ')}`);
          }

          // Procesar las líneas de datos (ignorando encabezados)
          const processedLines = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(separator).map(part => part.trim());

            if (parts.length < 5) {
              console.warn(`La línea ${i + 1} tiene solo ${parts.length} columnas: ${line}`);
              continue; // Ignorar líneas con formato incorrecto en lugar de fallar
            }

            try {
              const [id, labelRaw, titulo, descripcion, fecha] = parts;
              // Convertir el valor a 'FAKE' o 'REAL' según sea 0 o 1
              const label = (labelRaw.trim() === '0') ? 'FAKE' as const : (labelRaw.trim() === '1' ? 'REAL' as const : '');

              if (label !== 'FAKE' && label !== 'REAL') {
                console.warn(`Etiqueta inválida en línea ${i + 1}: "${labelRaw}". Se esperaba 0 o 1.`);
                continue; // Ignorar esta línea y continuar con las demás
              }

              // Creamos el texto combinando título y descripción
              const text = `${titulo}. ${descripcion}`;
              processedLines.push({ text, label });
            } catch (lineError) {
              console.warn(`Error al procesar línea ${i + 1}: ${lineError}`);
              // Continuar con las siguientes líneas
            }
          }

          if (processedLines.length === 0) {
            throw new Error("No se pudieron procesar datos válidos del archivo. Verifica el formato.");
          }

          trainingItems = processedLines;
          console.log(`Procesadas ${trainingItems.length} líneas válidas de un total de ${lines.length - 1} líneas de datos.`);

          setTrainingProgress(60);
        } catch (e) {
          console.error("Error detallado:", e);
          throw new Error(e instanceof Error ? e.message : "Error al procesar el archivo CSV");
        }
      }

      // Verificar que tengamos datos
      if (trainingItems.length === 0) {
        throw new Error("No se encontraron datos válidos para el entrenamiento");
      }

      // Enviar datos a la API
      setTrainingProgress(80);

      try {
        // Registrar el tiempo de inicio
        const startTime = performance.now();

        // Llamar a la API de reentrenamiento
        const data = await retrainModel(trainingItems);

        // Calcular el tiempo que tomó el entrenamiento (en segundos)
        const endTime = performance.now();
        const trainingTimeSeconds = (endTime - startTime) / 1000;

        console.log("Respuesta completa de la API:", data);
        console.log(`Tiempo de entrenamiento calculado: ${trainingTimeSeconds.toFixed(2)} segundos`);

        // Establecer resultado basado en la respuesta de la API
        setResult({
          success: true,
          metrics: {
            precision: data.precision || 0.0,
            recall: data.recall || 0.0,
            f1Score: data.f1_score || 0.0,
            accuracy: data.accuracy || 0.0,
          },
          modelVersion: data.new_model_version || "pending update...",
          // Usar el tiempo calculado localmente
          trainingTime: trainingTimeSeconds,
        });

        setTrainingProgress(100);
      } catch (apiError) {
        console.error("Error en la API de reentrenamiento:", apiError);
        throw new Error(apiError instanceof Error
          ? `Error de API: ${apiError.message}`
          : "Error en la comunicación con el servidor de reentrenamiento.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error en el reentrenamiento. Inténtalo de nuevo.");
    } finally {
      setIsTraining(false);
    }
  };

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

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="file">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="text">Enter Text</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                <h4 className="text-sm font-medium mb-2">Upload Training Data</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Upload a CSV file with labeled news data. The file must have the following headers:
                </p>
                <div className="my-2 font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  ID;Label;Titulo;Descripcion;Fecha
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Donde Label debe ser 0 (FAKE) o 1 (REAL) y Fecha en formato DD/MM/YYYY.
                </p>
                <div className="mt-2 mb-4 text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                  <p className="font-medium text-orange-700 dark:text-orange-400">Solución de problemas comunes:</p>
                  <ul className="list-disc pl-4 mt-1 text-slate-700 dark:text-slate-300">
                    <li>Asegúrate de que el archivo use punto y coma (;) como separador</li>
                    <li>Verifica que cada línea tenga exactamente 5 columnas</li>
                    <li>La etiqueta debe ser 0 o 1, sin espacios adicionales</li>
                    <li>El archivo debe tener codificación UTF-8</li>
                  </ul>
                </div>

                <input
                  type="file"
                  id="file-upload"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
                {file && (
                  <div className="mt-2 text-sm">
                    Selected: <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="text">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <Label htmlFor="training-data" className="text-sm font-medium mb-2 block">
                  Enter training data
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Each line should follow the CSV format with semicolon separators:
                </p>
                <div className="my-2 font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  ID;Label;Titulo;Descripcion;Fecha
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Donde Label debe ser 0 (FAKE) o 1 (REAL) y Fecha en formato DD/MM/YYYY.
                </p>
                <div className="mt-2 mb-2 text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                  <p className="font-medium text-orange-700 dark:text-orange-400">Consejos:</p>
                  <ul className="list-disc pl-4 mt-1 text-slate-700 dark:text-slate-300">
                    <li>Usa punto y coma (;) como separador entre columnas</li>
                    <li>Cada línea debe tener exactamente 5 columnas</li>
                    <li>La primera línea puede contener encabezados que se ignorarán</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Example: <code>1;0;Titular falso;Contenido de la noticia falsa;02/06/2023</code>
                </p>
                <Textarea
                  id="training-data"
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="1;0;Titular falso;Contenido de la noticia falsa;02/06/2023"
                  value={trainingData}
                  onChange={(e) => setTrainingData(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Ready to Train</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The model will be trained with your data to improve prediction accuracy.
                </p>
              </div>
              <Button
                onClick={trainModel}
                disabled={isTraining || (!file && !trainingData.trim())}
                className="min-w-[120px]"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  "Train Model"
                )}
              </Button>
            </div>
            {isTraining && <Progress value={trainingProgress} className="h-2" />}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <div className="mt-2 text-xs">
              <p className="font-medium">Posibles soluciones:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>Verifica que el archivo siga el formato especificado con 5 columnas separadas por punto y coma (;)</li>
                <li>Comprueba que la columna Label contenga valores 0 o 1</li>
                <li>Asegúrate de que no haya filas vacías o con formato incorrecto</li>
                <li>Si tienes el archivo abierto en Excel, guárdalo como CSV (delimitado por punto y coma)</li>
              </ul>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                // Convertir a un formato tabular para facilitar la depuración
                let datos = '';
                try {
                  if (file) {
                    datos = `Archivo: "${file.name}" - Tamaño: ${file.size} bytes - Tipo: ${file.type}`;
                  } else if (trainingData) {
                    const lineas = trainingData.split('\n').filter(l => l.trim()).length;
                    datos = `Texto ingresado: ${lineas} líneas`;
                  }
                } catch (e) {
                  datos = 'No se pudo procesar la información para depuración';
                }
                console.log('Información de depuración:', datos);
                alert(`Información para soporte técnico:\n${datos}\n\nConsulta la consola del navegador para más detalles.`);
              }}
            >
              Mostrar info de depuración
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                <p className="text-lg font-bold">
                  {result.trainingTime ? `${result.trainingTime.toFixed(2)} seconds` : 'No disponible'}
                </p>
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
                  {result.metrics.accuracy > 0 ? (
                    <>
                      <Progress value={result.metrics.accuracy * 100} className="h-2 mr-2" />
                      <span className="text-sm font-medium">{(result.metrics.accuracy * 100).toFixed(1)}%</span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">No disponible</span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Estado del modelo</p>
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Activo y listo para predicciones</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Información adicional</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("Resultado completo del entrenamiento:", result);
                    alert("La información detallada del entrenamiento está disponible en la consola del navegador (F12)");
                  }}
                >
                  Ver detalles completos
                </Button>
              </div>
            </div>

            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Modelo Actualizado</AlertTitle>
              <AlertDescription>
                El nuevo modelo ha sido desplegado y se utilizará para todas las predicciones futuras.
                {!result.metrics.accuracy && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Nota: La métrica de precisión (accuracy) puede no estar disponible si el servidor no la proporciona.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


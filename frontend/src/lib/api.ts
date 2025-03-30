// Constantes para la API
// Usamos rutas relativas para aprovechar el proxy de Vite
const API_BASE_URL = '/api/v1';

// Tipos de datos para la API
export type NewsItem = {
  id: string | number;
  text: string;
};

export type PredictionResult = {
  id: string | number;
  prediction: 'FAKE' | 'REAL';
  probability: number;
};

export type PredictionRequest = {
  news_items: NewsItem[];
};

export type PredictionResponse = {
  predictions: PredictionResult[];
  model_version: string;
};

export type TrainingItem = {
  text: string;
  label: 'FAKE' | 'REAL';
};

export type RetrainingRequest = {
  new_data: TrainingItem[];
};

export type RetrainingResponse = {
  message: string;
  precision: number;
  recall: number;
  f1_score: number;
  new_model_version: string;
  accuracy?: number;
  training_time?: number;
};

// Configuración para las peticiones fetch
const fetchConfig = {
  mode: 'cors' as RequestMode,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  credentials: 'omit' as RequestCredentials,
};

// Funciones para interactuar con la API
export const analyzeNews = async (newsItems: NewsItem[]): Promise<PredictionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      ...fetchConfig,
      body: JSON.stringify({ news_items: newsItems }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      throw new Error(errorData.detail || 'Error en el análisis');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al analizar noticias:', error);
    // Si es un error de red, proporciona un mensaje más amigable
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. Verifica que la API esté funcionando en http://localhost:8000');
    }
    throw error;
  }
};

export const retrainModel = async (trainingData: TrainingItem[]): Promise<RetrainingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/retrain`, {
      method: 'POST',
      ...fetchConfig,
      body: JSON.stringify({ new_data: trainingData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      throw new Error(errorData.detail || 'Error en el reentrenamiento');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al reentrenar el modelo:', error);
    // Si es un error de red, proporciona un mensaje más amigable
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. Verifica que la API esté funcionando en http://localhost:8000');
    }
    throw error;
  }
}; 
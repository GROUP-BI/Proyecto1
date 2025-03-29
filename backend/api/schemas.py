# api/schemas.py
from typing import List, Optional, Union

# Importar nombres de config para ejemplos
from core.config import TARGET_NAMES
from pydantic import BaseModel, Field


class NewsInput(BaseModel):
    """Esquema para una única entrada de noticia para predicción."""
    id: Union[int, str] = Field(..., example=1)
    title: Optional[str] = Field(None, example="Título impactante de noticia")
    text: str = Field(..., example="Texto completo de la noticia...")

class PredictionOutput(BaseModel):
    """Esquema para una única salida de predicción."""
    id: Union[int, str] # Para correlacionar con la entrada
    prediction: str = Field(..., example=TARGET_NAMES[0]) # 'FAKE' o 'REAL'
    probability: float = Field(..., ge=0.0, le=1.0, example=0.85)

class PredictionRequest(BaseModel):
    """Esquema para la solicitud de predicción (lista de noticias)."""
    news_items: List[NewsInput]

class PredictionResponse(BaseModel):
    """Esquema para la respuesta de predicción (lista de resultados)."""
    predictions: List[PredictionOutput]
    model_version: Optional[str] = Field(None, example="20250327-140000") # Podrías añadir versión/timestamp

class RetrainInput(BaseModel):
    """Esquema para una única entrada de noticia para reentrenamiento."""
    title: Optional[str] = Field(None, example="Título de noticia verificada")
    text: str = Field(..., example="Texto de una noticia para reentrenar...")
    label: str = Field(..., example=TARGET_NAMES[1]) # Espera 'FAKE' o 'REAL'

class RetrainRequest(BaseModel):
    """Esquema para la solicitud de reentrenamiento (lista de noticias con etiquetas)."""
    new_data: List[RetrainInput]

class RetrainResponse(BaseModel):
    """Esquema para la respuesta del reentrenamiento."""
    message: str = Field(..., example="Modelo reentrenado exitosamente.")
    precision: Optional[float] = Field(None, ge=0.0, le=1.0) # Métricas pueden ser None si falla
    recall: Optional[float] = Field(None, ge=0.0, le=1.0)
    f1_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    new_model_version: Optional[str] = Field(None, example="20250327-150000") # Versión/timestamp del nuevo modelo
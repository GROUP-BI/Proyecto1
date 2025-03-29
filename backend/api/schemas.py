# api/schemas.py
from typing import Any, List, Union

from pydantic import BaseModel, Field


class NewsInput(BaseModel):
    """Esquema para una única entrada de noticia para predicción."""
    # Asegúrate de que los nombres coincidan con lo que espera tu pipeline
    # Si solo necesita texto:
    text: str = Field(..., example="Texto completo de la noticia...")
    # Si necesita más campos:
    # title: Optional[str] = Field(None, example="Título de la noticia")
    # source: Optional[str] = Field(None, example="Fuente de la noticia")

    # Necesitamos un identificador único para mapear entradas y salidas
    id: Union[int, str] = Field(..., example=1)

class PredictionOutput(BaseModel):
    """Esquema para una única salida de predicción."""
    id: Union[int, str] # Para correlacionar con la entrada
    prediction: Union[str, int] = Field(..., example="FAKE") # O 0, 1
    probability: float = Field(..., ge=0.0, le=1.0, example=0.85)

class PredictionRequest(BaseModel):
    """Esquema para la solicitud de predicción (lista de noticias)."""
    news_items: List[NewsInput]

class PredictionResponse(BaseModel):
    """Esquema para la respuesta de predicción (lista de resultados)."""
    predictions: List[PredictionOutput]
    model_version: str = Field(..., example="1.0.0") # Podrías añadir versión

class RetrainInput(BaseModel):
    """Esquema para una única entrada de noticia para reentrenamiento."""
    # Debe incluir la característica(s) y la etiqueta verdadera
    text: str = Field(..., example="Texto de una noticia para reentrenar...")
    label: Union[str, int] = Field(..., example="REAL") # O 1. Ajusta a tu formato de etiqueta

class RetrainRequest(BaseModel):
    """Esquema para la solicitud de reentrenamiento (lista de noticias con etiquetas)."""
    new_data: List[RetrainInput]

class RetrainResponse(BaseModel):
    """Esquema para la respuesta del reentrenamiento."""
    message: str = Field(..., example="Modelo reentrenado exitosamente.")
    precision: float = Field(..., ge=0.0, le=1.0)
    recall: float = Field(..., ge=0.0, le=1.0)
    f1_score: float = Field(..., ge=0.0, le=1.0)
    new_model_version: str = Field(..., example="1.0.1") # Podrías versionar
# api/endpoints/prediction.py
import logging
from typing import List

import pandas as pd
from api.schemas import PredictionOutput, PredictionRequest, PredictionResponse

# Importar INV_LABEL_MAP y nombres de columnas
from core.config import INV_LABEL_MAP, TEXT_FEATURE, TITLE_FEATURE
from fastapi import APIRouter, Body, HTTPException
from pipeline.pipeline import load_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)

# Intenta cargar el pipeline al iniciar
try:
    pipeline = load_pipeline()
    # Obtener las clases tal como las aprendió el modelo (0, 1)
    MODEL_CLASSES = pipeline.classes_ if hasattr(pipeline, 'classes_') else list(INV_LABEL_MAP.keys())
    logger.info(f"Clases detectadas en el pipeline: {MODEL_CLASSES}")
except Exception as e:
    logger.error(f"Fallo crítico al iniciar: No se pudo cargar el pipeline. {e}", exc_info=True)
    pipeline = None # Marcar como no disponible


@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_news(
    request: PredictionRequest = Body(...)
) -> PredictionResponse:
    """
    Recibe una o más noticias (título y texto) y devuelve las predicciones ('FAKE'/'REAL') y probabilidades.
    """
    if pipeline is None:
        logger.error("Intento de predicción fallido: Pipeline no cargado.")
        raise HTTPException(status_code=503, detail="Modelo no disponible en este momento.")

    if not request.news_items:
        raise HTTPException(status_code=400, detail="La lista de noticias no puede estar vacía.")

    try:
        # 1. Prepara el DataFrame de entrada para el pipeline
        # El pipeline (con TextPreprocessor) espera un DataFrame con columnas 'title' y 'text'
        input_list_of_dicts = [item.dict(include={TITLE_FEATURE, TEXT_FEATURE}) for item in request.news_items]
        input_df = pd.DataFrame(input_list_of_dicts)

        logger.info(f"Realizando predicciones para {len(input_df)} ítems.")

        # 2. Realiza las predicciones (el pipeline hace todo el preprocesamiento interno)
        numeric_predictions = pipeline.predict(input_df) # Devuelve 0 o 1

        # 3. Obtiene las probabilidades
        probabilities = pipeline.predict_proba(input_df) # Devuelve array [prob_clase_0, prob_clase_1]

        # 4. Formatea la salida
        results: List[PredictionOutput] = []
        for i, item in enumerate(request.news_items):
            numeric_pred = numeric_predictions[i]
            # Mapear 0/1 a 'FAKE'/'REAL'
            predicted_label = INV_LABEL_MAP.get(numeric_pred, "Unknown") # Manejar caso inesperado

            # Obtener la probabilidad de la clase predicha (0 o 1)
            try:
                 # Encuentra el índice de la clase predicha (0 o 1) en las clases del modelo
                 # Asegúrate que MODEL_CLASSES esté definido (ej: [0, 1])
                 class_index = list(MODEL_CLASSES).index(numeric_pred)
                 probability = probabilities[i, class_index]
            except (ValueError, IndexError, AttributeError) as prob_err:
                 logger.warning(f"No se pudo determinar la probabilidad para el ítem {item.id}. Predicción numérica: {numeric_pred}. Error: {prob_err}")
                 probability = 0.0 # O None, pero el schema espera float

            results.append(
                PredictionOutput(
                    id=item.id,
                    prediction=predicted_label,
                    probability=round(float(probability), 4)
                )
            )

        logger.info(f"Predicciones generadas exitosamente para {len(results)} ítems.")
        # Podrías obtener una versión/timestamp del modelo aquí si la gestionas
        model_version = getattr(pipeline, 'version', None) or getattr(pipeline, 'timestamp', "N/A") # Ejemplo

        return PredictionResponse(predictions=results, model_version=str(model_version))

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception("Error inesperado durante la predicción.")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al predecir: {e}")
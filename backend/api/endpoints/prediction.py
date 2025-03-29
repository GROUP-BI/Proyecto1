# api/endpoints/prediction.py
import logging
from typing import List

import pandas as pd
from api.schemas import PredictionOutput, PredictionRequest, PredictionResponse
from core.config import TARGET_NAMES, TEXT_FEATURE
from fastapi import APIRouter, Body, HTTPException
from pipeline.pipeline import load_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)

# Carga el pipeline al iniciar el módulo (o usa Depends para cargarlo por request)
try:
    pipeline = load_pipeline()
except Exception as e:
    logger.error(f"Fallo crítico al iniciar: No se pudo cargar el pipeline. {e}")
    # Podrías decidir detener la aplicación aquí si el pipeline es esencial
    pipeline = None # Indica que no está disponible

@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_news(
    request: PredictionRequest = Body(...)
) -> PredictionResponse:
    """
    Recibe una o más noticias y devuelve las predicciones y probabilidades.
    """
    if pipeline is None:
        logger.error("Intento de predicción fallido: Pipeline no cargado.")
        raise HTTPException(status_code=503, detail="Modelo no disponible en este momento.")

    if not request.news_items:
        raise HTTPException(status_code=400, detail="La lista de noticias no puede estar vacía.")

    try:
        # Prepara los datos para el pipeline
        input_data = pd.DataFrame([item.dict() for item in request.news_items])

        if TEXT_FEATURE not in input_data.columns:
             raise HTTPException(status_code=400, detail=f"Falta la columna requerida '{TEXT_FEATURE}' en los datos de entrada.")

        logger.info(f"Realizando predicciones para {len(input_data)} ítems.")

        # Realiza las predicciones
        predictions = pipeline.predict(input_data)

        # Obtiene las probabilidades (para la clase predicha)
        probabilities = pipeline.predict_proba(input_data)

        # Formatea la salida
        results: List[PredictionOutput] = []
        for i, item in enumerate(request.news_items):
            predicted_class_index = predictions[i] # Asume que predict devuelve el índice o la etiqueta directa
            # Si predict devuelve 0/1 y quieres 'FAKE'/'REAL', mapea aquí
            # predicted_label = TARGET_NAMES[predicted_class_index] if isinstance(predicted_class_index, int) else predicted_class_index
            predicted_label = predicted_class_index # Usa esto si tu modelo ya devuelve FAKE/REAL

            # Obtén la probabilidad de la clase predicha
            # Si es binario, prob[:, 1] suele ser la prob de la clase 'positiva'
            # Si es multiclase, necesitas encontrar la prob de la clase predicha
            # Este ejemplo asume binario y que el índice 1 es la clase 'positiva' (ajusta si es necesario)
            # O si quieres la probabilidad de la etiqueta específica predicha:
            class_index = list(pipeline.classes_).index(predicted_label) # Encuentra el índice de la etiqueta
            probability = probabilities[i, class_index]

            results.append(
                PredictionOutput(
                    id=item.id,
                    prediction=predicted_label,
                    probability=round(float(probability), 4)
                )
            )

        logger.info(f"Predicciones generadas exitosamente para {len(results)} ítems.")
        # Podrías obtener una versión del modelo aquí si la gestionas
        model_version = "1.0.0" # Placeholder

        return PredictionResponse(predictions=results, model_version=model_version)

    except HTTPException as http_exc:
        # Re-lanza excepciones HTTP para que FastAPI las maneje
        raise http_exc
    except KeyError as ke:
         logger.error(f"Error de clave durante la predicción: {ke}. Verifica las columnas de entrada.")
         raise HTTPException(status_code=400, detail=f"Error en los datos de entrada: Falta la columna {ke}")
    except Exception as e:
        logger.exception("Error inesperado durante la predicción.") # Loggea el stack trace
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al predecir: {e}")
# api/endpoints/retraining.py
import logging
from datetime import datetime

import pandas as pd
from api.schemas import RetrainRequest, RetrainResponse
from fastapi import APIRouter, BackgroundTasks, Body, HTTPException
from pipeline.pipeline import load_pipeline, save_pipeline, train_new_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)

# Variable para simular versionado simple
current_model_version = "1.0.0"

def background_retrain_and_save(data: pd.DataFrame):
    """Tarea en segundo plano para reentrenar y guardar."""
    global current_model_version
    try:
        logger.info("Iniciando tarea de reentrenamiento en segundo plano...")
        new_pipeline, metrics = train_new_pipeline(data)
        save_pipeline(new_pipeline) # Sobrescribe el modelo anterior
        # Actualiza la versión (ejemplo simple basado en timestamp)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        current_model_version = f"2.0.0-{timestamp}" # Indica nueva versión principal + timestamp
        logger.info(f"Reentrenamiento completado. Nueva versión: {current_model_version}. Métricas: {metrics}")
        # Aquí podrías notificar a algún sistema o loggear de forma más persistente
    except Exception as e:
        logger.error(f"Error en la tarea de reentrenamiento en segundo plano: {e}", exc_info=True)

@router.post("/retrain", response_model=RetrainResponse, status_code=202, tags=["Retraining"]) # 202 Accepted
async def retrain_model(
    background_tasks: BackgroundTasks,
    request: RetrainRequest = Body(...)
) -> RetrainResponse:
    """
    Recibe nuevos datos etiquetados, inicia un proceso de reentrenamiento
    en segundo plano y devuelve métricas (potencialmente calculadas antes de guardar).

    Nota: Devuelve 202 Accepted porque el reentrenamiento real ocurre en segundo plano.
    Las métricas devueltas son calculadas sobre los datos de entrada *antes* de guardar el modelo.
    """
    if not request.new_data:
        raise HTTPException(status_code=400, detail="La lista de datos de reentrenamiento no puede estar vacía.")

    try:
        # Prepara los datos para el pipeline
        new_data_df = pd.DataFrame([item.dict() for item in request.new_data])
        logger.info(f"Recibidos {len(new_data_df)} registros para reentrenamiento.")

        # --- Ejecución Síncrona (opcional, si quieres métricas inmediatas) ---
        # Podrías hacer un entrenamiento *temporal* aquí solo para obtener métricas rápidas
        # _, initial_metrics = train_new_pipeline(new_data_df.copy()) # Usa una copia
        # logger.info("Cálculo preliminar de métricas completado.")
        # --- Fin Ejecución Síncrona ---

        # Añade la tarea de reentrenamiento real (que guarda el modelo) al fondo
        background_tasks.add_task(background_retrain_and_save, new_data_df)
        logger.info("Tarea de reentrenamiento añadida al segundo plano.")

        # Devuelve una respuesta inmediata indicando que el proceso ha comenzado
        # y potencialmente con métricas calculadas en el paso síncrono opcional
        # O con métricas placeholder si todo es asíncrono.
        # Aquí usamos placeholders ya que el cálculo real está en background.
        placeholder_metrics = {"precision": 0.0, "recall": 0.0, "f1_score": 0.0}

        return RetrainResponse(
            message="Proceso de reentrenamiento iniciado en segundo plano. El nuevo modelo estará disponible en breve.",
            **placeholder_metrics, # Desempaqueta las métricas calculadas o placeholders
            new_model_version=f"pending update..." # El versionado real se hace en background
        )

    except ValueError as ve:
         logger.error(f"Error en los datos de reentrenamiento: {ve}")
         raise HTTPException(status_code=400, detail=f"Error en los datos de reentrenamiento: {ve}")
    except Exception as e:
        logger.exception("Error inesperado al iniciar el reentrenamiento.")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al iniciar reentrenamiento: {e}")
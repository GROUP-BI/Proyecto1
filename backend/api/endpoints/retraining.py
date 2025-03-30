# api/endpoints/retraining.py
import logging
import time  # Para simular versionado
from datetime import datetime

import pandas as pd
from api.schemas import RetrainRequest, RetrainResponse
from fastapi import APIRouter, BackgroundTasks, Body, HTTPException

# Usar la nueva función de reentrenamiento y guardar/cargar
from pipeline.pipeline import (
    load_pipeline,
    retrain_pipeline_with_new_data,
    save_pipeline,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Variable simple para rastrear la versión/timestamp del modelo actual
# Se actualiza después de un reentrenamiento exitoso
current_model_timestamp = "initial"
try:
    # Intenta obtener algún metadato del pipeline cargado si existe
    _initial_pipeline = load_pipeline()
    current_model_timestamp = getattr(_initial_pipeline, "timestamp", "initial")
except:
    pass  # No hay pipeline inicial aún


def background_retrain_and_save(data: pd.DataFrame):
    """Tarea en segundo plano para reentrenar y guardar."""
    global current_model_timestamp
    try:
        logger.info("Iniciando tarea de reentrenamiento en segundo plano...")
        # Llama a la función de reentrenamiento que devuelve el pipeline y métricas
        new_pipeline, metrics = retrain_pipeline_with_new_data(data)

        # Añadir un timestamp al pipeline antes de guardar (para versionado simple)
        new_timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        new_pipeline.timestamp = new_timestamp  # Añade atributo al objeto pipeline

        # Guardar el pipeline recién entrenado (sobrescribe el anterior)
        save_pipeline(new_pipeline)

        # Actualizar la variable global de timestamp
        current_model_timestamp = new_timestamp
        logger.info(
            f"Reentrenamiento completado y guardado. Nuevo timestamp: {current_model_timestamp}. Métricas: {metrics}"
        )
        # Aquí podrías notificar o loggear de forma más persistente
        return metrics, new_timestamp

    except Exception as e:
        logger.error(
            f"Error en la tarea de reentrenamiento en segundo plano: {e}", exc_info=True
        )


@router.post(
    "/retrain", response_model=RetrainResponse, status_code=202, tags=["Retraining"]
)  # 202 Accepted
async def retrain_model(
    background_tasks: BackgroundTasks, request: RetrainRequest = Body(...)
) -> RetrainResponse:
    """
    Recibe nuevos datos etiquetados ('FAKE'/'REAL'), inicia un proceso de
    reentrenamiento completo (usando solo estos datos) en segundo plano
    y devuelve un mensaje de aceptación.
    """
    if not request.new_data:
        raise HTTPException(
            status_code=400,
            detail="La lista de datos de reentrenamiento no puede estar vacía.",
        )

    try:
        # Prepara los datos para la función de reentrenamiento
        new_data_df = pd.DataFrame([item.dict() for item in request.new_data])
        logger.info(f"Recibidos {len(new_data_df)} registros para reentrenamiento.")

        # Añade la tarea de reentrenamiento real al fondo
        # Pasamos el DataFrame directamente
        metricas, timestamp = background_retrain_and_save(new_data_df)
        logger.info("Tarea de reentrenamiento añadida al segundo plano.")

        # Devuelve una respuesta inmediata indicando que el proceso ha comenzado
        # Las métricas reales se calculan en segundo plano y se loggean.
        # La respuesta aquí no puede incluirlas directamente.
        xd = "1.0.1" + str(timestamp)
        return RetrainResponse(
            message="Proceso de reentrenamiento iniciado en segundo plano. El nuevo modelo estará disponible pronto.",
            precision=metricas["precision"],  # Métricas no disponibles inmediatamente
            recall=metricas["recall"],
            f1_score=metricas["f1_score"],
            new_model_version=xd,  # El timestamp real se asigna en background
        )

    except ValueError as ve:  # Errores de validación de datos
        logger.error(f"Error en los datos de reentrenamiento: {ve}")
        raise HTTPException(
            status_code=400, detail=f"Error en los datos de reentrenamiento: {ve}"
        )
    except Exception as e:
        logger.exception("Error inesperado al iniciar el reentrenamiento.")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor al iniciar reentrenamiento: {e}",
        )

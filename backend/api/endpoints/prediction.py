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
    MODEL_CLASSES = (
        pipeline.classes_
        if hasattr(pipeline, "classes_")
        else list(INV_LABEL_MAP.keys())
    )
    logger.info(f"Clases detectadas en el pipeline: {MODEL_CLASSES}")
except Exception as e:
    logger.error(
        f"Fallo crítico al iniciar: No se pudo cargar el pipeline. {e}", exc_info=True
    )
    pipeline = None  # Marcar como no disponible

import re
from typing import List


def extract_keywords_from_text(pipeline, text: str, top_n: int = 5) -> List[str]:
    # Para extraer las keywords, primero preprocesamos el texto
    # Asumimos que la etapa "preprocessing" espera un DataFrame con 'title' y 'text'
    import pandas as pd

    df = pd.DataFrame({"title": [""], "text": [text]})
    preprocessed_text = pipeline.named_steps["preprocessing"].transform(df)[0]
    # Obtenemos el vector TF-IDF
    tfidf_vector = pipeline.named_steps["tfidf"].transform([preprocessed_text])
    feature_names = pipeline.named_steps["tfidf"].get_feature_names_out()
    tfidf_scores = tfidf_vector.toarray()[0]
    # Seleccionamos los índices de las top n palabras con mayor TF-IDF
    top_indices = tfidf_scores.argsort()[-top_n:][::-1]
    keywords = [feature_names[idx] for idx in top_indices if tfidf_scores[idx] > 0]
    return keywords


@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_news(request: PredictionRequest = Body(...)) -> PredictionResponse:
    if pipeline is None:
        logger.error("Intento de predicción fallido: Pipeline no cargado.")
        raise HTTPException(
            status_code=503, detail="Modelo no disponible en este momento."
        )

    if not request.news_items:
        raise HTTPException(
            status_code=400, detail="La lista de noticias no puede estar vacía."
        )

    try:
        # Preparamos el DataFrame de entrada para el pipeline
        input_list_of_dicts = [
            item.dict(include={TITLE_FEATURE, TEXT_FEATURE})
            for item in request.news_items
        ]
        input_df = pd.DataFrame(input_list_of_dicts)
        logger.info(f"Realizando predicciones para {len(input_df)} ítems.")

        # Se obtiene la predicción y las probabilidades reales del pipeline
        numeric_predictions = pipeline.predict(input_df)
        probabilities = pipeline.predict_proba(input_df)

        results: List[PredictionOutput] = []
        for i, item in enumerate(request.news_items):
            numeric_pred = numeric_predictions[i]
            predicted_label = INV_LABEL_MAP.get(numeric_pred, "Unknown")
            try:
                class_index = list(pipeline.classes_).index(numeric_pred)
                probability = probabilities[i, class_index]
            except (ValueError, IndexError, AttributeError) as prob_err:
                logger.warning(
                    f"No se pudo determinar la probabilidad para el ítem {item.id}. Error: {prob_err}"
                )
                probability = 0.0

            # Extraemos las keywords usando el vectorizador del pipeline
            keywords = extract_keywords_from_text(pipeline, item.text)

            results.append(
                PredictionOutput(
                    id=item.id,
                    prediction=predicted_label,
                    probability=round(float(probability), 4),
                    keywords=keywords,
                )
            )

        model_version = getattr(pipeline, "version", None) or getattr(
            pipeline, "timestamp", "N/A"
        )
        return PredictionResponse(predictions=results, model_version=str(model_version))

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception("Error inesperado durante la predicción.")
        raise HTTPException(
            status_code=500, detail=f"Error interno del servidor al predecir: {e}"
        )

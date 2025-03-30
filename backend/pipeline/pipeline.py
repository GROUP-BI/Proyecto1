# pipeline/pipeline.py
import logging

import joblib
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# from sklearn.tree import DecisionTreeClassifier # Opcional si cambias
# from sklearn.ensemble import RandomForestClassifier # Opcional si cambias
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.pipeline import Pipeline

# Importar configuración y función de preprocesamiento
from core.config import (
    FULL_TEXT_FEATURE,
    LABEL_MAP,
    LOGREG_SOLVER,
    MODEL_PATH,
    RANDOM_STATE,
    TARGET_FEATURE,
    TEXT_FEATURE,
    TFIDF_MAX_FEATURES,
    TITLE_FEATURE,
    preprocess_text,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_pipeline = None  # Caché en memoria


# --- Transformador Personalizado para Preprocesamiento ---
class TextPreprocessor(BaseEstimator, TransformerMixin):
    """
    Un transformador de Scikit-learn para aplicar la función preprocess_text.
    Espera un DataFrame y procesa la columna FULL_TEXT_FEATURE.
    """

    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self  # Nada que aprender en el fit

    def transform(self, X: pd.DataFrame) -> pd.Series:
        """Aplica la combinación de título/texto y preprocesamiento."""
        logger.debug(
            f"Aplicando TextPreprocessor a DataFrame con columnas: {X.columns}"
        )
        if not isinstance(X, pd.DataFrame):
            raise TypeError(
                "La entrada para TextPreprocessor debe ser un DataFrame de pandas."
            )

        # 1. Combinar título y texto
        X_copy = X.copy()  # Evitar SettingWithCopyWarning
        title_col = X_copy.get(
            TITLE_FEATURE, pd.Series([""] * len(X_copy), index=X_copy.index)
        )
        text_col = X_copy.get(
            TEXT_FEATURE, pd.Series([""] * len(X_copy), index=X_copy.index)
        )
        X_copy[FULL_TEXT_FEATURE] = title_col.fillna("") + " " + text_col.fillna("")

        # 2. Aplicar la función de preprocesamiento
        return X_copy[FULL_TEXT_FEATURE].apply(preprocess_text)


# --- Fin Transformador Personalizado ---


def build_pipeline() -> Pipeline:
    """
    Construye el objeto Pipeline de Scikit-learn completo, incluyendo
    el preprocesamiento, vectorización y clasificación.
    """
    logger.info("Construyendo la estructura del pipeline...")
    pipeline = Pipeline(
        [
            (
                "preprocessing",
                TextPreprocessor(),
            ),  # Nuestro transformador personalizado
            ("tfidf", TfidfVectorizer(max_features=TFIDF_MAX_FEATURES)),
            (
                "clf",
                RandomForestClassifier(
                    random_state=RANDOM_STATE,
                    n_estimators=100,
                    max_depth=None,
                    min_samples_split=6,
                    max_features="sqrt",
                    n_jobs=-1,
                ),
            ),
        ]
    )
    return pipeline


def load_pipeline() -> Pipeline:
    """Carga el pipeline completo desde el archivo."""
    global _pipeline
    if _pipeline is None:
        try:
            logger.info(f"Cargando pipeline desde: {MODEL_PATH}")
            # Asumimos que se guarda el objeto Pipeline completo
            _pipeline = joblib.load(MODEL_PATH)
            # Validación simple (opcional pero útil)
            if not isinstance(_pipeline, Pipeline):
                logger.warning(
                    f"El archivo {MODEL_PATH} no contiene un objeto Pipeline de scikit-learn."
                )
                # Podrías intentar cargarlo de otra forma si sospechas otro formato
                raise TypeError("El objeto cargado no es un Pipeline.")
            logger.info("Pipeline cargado exitosamente.")
        except FileNotFoundError:
            logger.error(
                f"Error: No se encontró el archivo del pipeline en {MODEL_PATH}"
            )
            logger.error("Asegúrate de haber entrenado y guardado el pipeline inicial.")
            raise
        except Exception as e:
            logger.error(f"Error al cargar el pipeline: {e}", exc_info=True)
            raise
    return _pipeline


def save_pipeline(pipeline: Pipeline):
    """Guarda el pipeline completo en el archivo."""
    global _pipeline
    try:
        logger.info(f"Guardando pipeline en: {MODEL_PATH}")
        joblib.dump(pipeline, MODEL_PATH)
        _pipeline = pipeline  # Actualiza la caché en memoria
        logger.info("Pipeline guardado exitosamente.")
    except Exception as e:
        logger.error(f"Error al guardar el pipeline: {e}", exc_info=True)
        raise


def train_initial_pipeline(data_path: str):
    logger.info(f"Iniciando entrenamiento inicial desde: {data_path}")
    try:
        # Lee el CSV con delimitador ';'
        df = pd.read_csv(
            data_path,
            sep=";",
            encoding="utf-8",
        )

        # Renombrar columnas: 'Label' -> 'label', 'Titulo' -> 'title', 'Descripcion' -> 'text'
        df.rename(
            columns={"Label": "label", "Titulo": "title", "Descripcion": "text"},
            inplace=True,
        )

        logger.info(f"Datos cargados: {df.shape[0]} filas.")

        # Validar que existan las columnas necesarias
        if "label" not in df.columns:
            raise ValueError("El archivo CSV debe contener la columna 'label'")
        if not ("title" in df.columns or "text" in df.columns):
            raise ValueError("El archivo CSV debe contener 'title' y/o 'text'")

        # Opcional: Si las etiquetas vienen como números, conviértelas a string y mapéalas
        if df["label"].dtype != object:
            df["label"] = df["label"].astype(str)
        # Mapear etiquetas: Esto permite usar tanto 'FAKE'/'REAL' como '0'/'1'
        y_train_series = df["label"].map({"0": 0, "1": 1, "FAKE": 0, "REAL": 1})

        if y_train_series.isnull().any():
            logger.warning("Se encontraron etiquetas no mapeadas en 'label'.")
            valid_indices = y_train_series.notnull()
            df = df[valid_indices]
            y_train_series = y_train_series[valid_indices]
            if y_train_series.empty:
                raise ValueError(
                    "No quedan datos válidos después de eliminar etiquetas no mapeadas."
                )

        # Prepara el DataFrame de entrada solo con las columnas que se usarán para el texto
        X_train_df = df[["title", "text"]]

        # Entrena el pipeline
        pipeline_to_train = build_pipeline()
        logger.info("Entrenando el pipeline inicial...")
        pipeline_to_train.fit(X_train_df, y_train_series)
        logger.info("Entrenamiento inicial completado.")

        # Guarda el pipeline entrenado (se crea el archivo joblib)
        save_pipeline(pipeline_to_train)
        logger.info("Pipeline inicial entrenado y guardado exitosamente!")

    except Exception as e:
        logger.error(f"Error durante el entrenamiento inicial: {e}", exc_info=True)
        raise


def retrain_pipeline_with_new_data(data: pd.DataFrame) -> tuple[Pipeline, dict]:
    """
    Re-entrena un NUEVO pipeline con los nuevos datos proporcionados (DataFrame).
    Asume que 'data' contiene 'title', 'text', y 'label' ('FAKE'/'REAL').
    Implementa la estrategia: Reentrenamiento Completo (sobre Nuevos Datos).
    """
    logger.info(f"Iniciando reentrenamiento con {len(data)} nuevos registros.")

    required_cols = [TITLE_FEATURE, TEXT_FEATURE, TARGET_FEATURE]
    if not all(col in data.columns for col in required_cols):
        missing = [col for col in required_cols if col not in data.columns]
        raise ValueError(
            f"Los datos de reentrenamiento deben contener las columnas: {missing}"
        )

    # Preparar X (DataFrame) y y (Serie numérica)
    X_retrain_df = data[[TITLE_FEATURE, TEXT_FEATURE]].copy()
    y_retrain_series = data[TARGET_FEATURE].map(LABEL_MAP)

    # Validar mapeo (similar a train_initial_pipeline)
    if y_retrain_series.isnull().any():
        logger.warning(
            f"Se encontraron etiquetas no mapeadas en '{TARGET_FEATURE}' durante el reentrenamiento."
        )
        valid_indices = y_retrain_series.notnull()
        X_retrain_df = X_retrain_df[valid_indices]
        y_retrain_series = y_retrain_series[valid_indices]
        if y_retrain_series.empty:
            raise ValueError(
                "No quedan datos válidos para reentrenamiento después de eliminar etiquetas no mapeadas."
            )

    # Construir una NUEVA instancia del pipeline y entrenarla
    pipeline_to_retrain = build_pipeline()

    try:
        logger.info("Reentrenando el pipeline...")
        pipeline_to_retrain.fit(X_retrain_df, y_retrain_series)  # Pasar DataFrame a fit
        logger.info("Reentrenamiento completado.")

        # Evaluar en los mismos datos de reentrenamiento
        logger.info("Evaluando sobre los datos de reentrenamiento...")
        # ¡Importante! Para predecir, el pipeline espera un DataFrame similar al de entrada del fit
        y_pred_retrain = pipeline_to_retrain.predict(X_retrain_df)

        # Calcular métricas usando las etiquetas numéricas (0/1)
        metrics = {
            # Usamos average='weighted' para promediar métricas por clase,
            # o podrías usar average='binary', pos_label=1 si te interesa la clase REAL (1)
            "precision": precision_score(y_retrain_series, y_pred_retrain),
            "recall": recall_score(y_retrain_series, y_pred_retrain),
            "f1_score": f1_score(y_retrain_series, y_pred_retrain),
        }
        logger.info(f"Métricas de reentrenamiento (sobre datos de entrada): {metrics}")

        return pipeline_to_retrain, metrics

    except Exception as e:
        logger.error(f"Error durante el reentrenamiento: {e}", exc_info=True)
        raise


# --- Definiciones de Reentrenamiento (sin cambios) ---
# ... (mantener las descripciones de las 3 estrategias) ...
# Estrategia Implementada: Reentrenamiento Completo (sobre Nuevos Datos).
# ... (mantener justificación) ...

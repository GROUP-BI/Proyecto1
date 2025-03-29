# pipeline/pipeline.py
import logging

import joblib
import pandas as pd
from core.config import MODEL_PATH, TARGET_FEATURE, TARGET_NAMES, TEXT_FEATURE
from sklearn.metrics import f1_score, precision_score, recall_score
from sklearn.pipeline import Pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Variable global para mantener el pipeline cargado en memoria (cache simple)
_pipeline = None

def load_pipeline() -> Pipeline:
    """Carga el pipeline desde el archivo."""
    global _pipeline
    if _pipeline is None:
        try:
            logger.info(f"Cargando pipeline desde: {MODEL_PATH}")
            _pipeline = joblib.load(MODEL_PATH)
            logger.info("Pipeline cargado exitosamente.")
        except FileNotFoundError:
            logger.error(f"Error: No se encontró el archivo del modelo en {MODEL_PATH}")
            raise
        except Exception as e:
            logger.error(f"Error al cargar el pipeline: {e}")
            raise
    return _pipeline

def save_pipeline(pipeline: Pipeline):
    """Guarda el pipeline en el archivo."""
    global _pipeline
    try:
        logger.info(f"Guardando pipeline en: {MODEL_PATH}")
        joblib.dump(pipeline, MODEL_PATH)
        _pipeline = pipeline # Actualiza la caché en memoria
        logger.info("Pipeline guardado exitosamente.")
    except Exception as e:
        logger.error(f"Error al guardar el pipeline: {e}")
        raise

def train_new_pipeline(data: pd.DataFrame) -> tuple[Pipeline, dict]:
    """
    Entrena un NUEVO pipeline con los datos proporcionados.
    ADAPTACIÓN NECESARIA: Debes reemplazar esta función con la lógica
    real para construir y entrenar TU pipeline específico de la Etapa 1.
    Esto es solo un esqueleto.
    """
    logger.info(f"Iniciando entrenamiento con {len(data)} registros.")

    if TEXT_FEATURE not in data.columns or TARGET_FEATURE not in data.columns:
        raise ValueError(f"Los datos deben contener las columnas '{TEXT_FEATURE}' y '{TARGET_FEATURE}'")

    X = data[TEXT_FEATURE]
    y = data[TARGET_FEATURE]

    # --- INICIO: SECCIÓN A ADAPTAR ---
    # Aquí deberías definir o importar tu pipeline de scikit-learn
    # Ejemplo MUY básico (REEMPLAZAR con tu pipeline real):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.naive_bayes import MultinomialNB  # O tu clasificador elegido

    # Crea una instancia NUEVA del pipeline CADA VEZ que reentrenas
    # Asegúrate de usar los mismos parámetros que en la Etapa 1
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(stop_words='english', max_features=5000)), # Ajusta parámetros
        ('clf', MultinomialNB()) # O tu clasificador
    ])
    # --- FIN: SECCIÓN A ADAPTAR ---

    try:
        # Entrenar el pipeline completo
        pipeline.fit(X, y)
        logger.info("Pipeline entrenado exitosamente.")

        # Evaluar en los mismos datos de entrenamiento (idealmente usar split o datos nuevos)
        y_pred = pipeline.predict(X)
        # Asegúrate que las etiquetas sean consistentes para las métricas
        # (ej: si y es string 'FAKE'/'REAL', ajusta 'pos_label' si es necesario)
        metrics = {
            "precision": precision_score(y, y_pred, average='weighted'), # o 'binary', pos_label='FAKE'
            "recall": recall_score(y, y_pred, average='weighted'),    # o 'binary', pos_label='FAKE'
            "f1_score": f1_score(y, y_pred, average='weighted')        # o 'binary', pos_label='FAKE'
        }
        logger.info(f"Métricas de reentrenamiento (sobre datos de entrada): {metrics}")

        return pipeline, metrics

    except Exception as e:
        logger.error(f"Error durante el entrenamiento: {e}")
        raise

# --- Definiciones de Reentrenamiento (para la documentación) ---
# 1. Reentrenamiento Completo (sobre Nuevos Datos):
#    - Descripción: El modelo existente se descarta. Se entrena un modelo completamente nuevo utilizando ÚNICAMENTE el nuevo conjunto de datos proporcionado.
#    - Ventaja: Simple de implementar. Refleja directamente la información más reciente.
#    - Desventaja: Puede sufrir "olvido catastrófico", perdiendo conocimiento aprendido de datos antiguos si los nuevos datos no son representativos del todo.
#
# 2. Reentrenamiento Completo (sobre Datos Combinados):
#    - Descripción: El nuevo conjunto de datos se combina con el conjunto de datos original (o una muestra representativa de él). Se entrena un modelo completamente nuevo con todos estos datos combinados.
#    - Ventaja: Conserva el conocimiento de los datos antiguos y aprende de los nuevos. Generalmente más robusto.
#    - Desventaja: Requiere almacenar o acceder a los datos antiguos. El tiempo de entrenamiento aumenta con el tamaño de los datos acumulados. Puede haber desbalance si los lotes nuevos/viejos son muy diferentes en tamaño o distribución.
#
# 3. Aprendizaje Incremental (Online Learning / Mini-batch):
#    - Descripción: El modelo existente se actualiza utilizando solo el nuevo conjunto de datos, sin volver a entrenar desde cero. Solo aplicable si el algoritmo subyacente soporta `partial_fit` (ej: SGDClassifier, MultinomialNB, PassiveAggressiveClassifier en Scikit-learn).
#    - Ventaja: Muy eficiente en tiempo y recursos, no requiere almacenar datos antiguos. Ideal para flujos continuos de datos.
#    - Desventaja: No todos los algoritmos lo soportan. Puede ser sensible al orden de los datos. El rendimiento puede degradarse si la distribución de los datos cambia drásticamente (concept drift).
#
# Estrategia Implementada en este Ejemplo: Reentrenamiento Completo (sobre Nuevos Datos).
# Justificación: Es la más sencilla de implementar para demostrar el flujo de la API y cumple
# con el requisito de reemplazar el modelo. En un escenario real, la opción 2 (Datos Combinados)
# suele ser preferible para modelos de batch, o la 3 si el modelo y el caso de uso lo permiten.
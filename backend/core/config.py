# core/config.py
import os
import re
import string
from pathlib import Path

import nltk
from dotenv import load_dotenv
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

# --- Descargar recursos NLTK si no existen ---
try:
    nltk.data.find('corpora/stopwords')
except nltk.downloader.DownloadError:
    print("Descargando stopwords de NLTK...")
    nltk.download('stopwords', quiet=True)
try:
    nltk.data.find('tokenizers/punkt') # Necesario para algunas tokenizaciones implícitas
except nltk.downloader.DownloadError:
    print("Descargando punkt de NLTK...")
    nltk.download('punkt', quiet=True)
# --- Fin descarga NLTK ---


# Carga variables de entorno si usas un archivo .env
load_dotenv()

# Ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Ruta al modelo/pipeline serializado completo
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "pipeline_model.joblib"))

# Columnas de texto de entrada (usaremos ambas)
TITLE_FEATURE = 'title'
TEXT_FEATURE = 'text'
FULL_TEXT_FEATURE = 'full_text' # Nombre interno tras combinar

# Nombre de la columna objetivo en los datos originales
TARGET_FEATURE = 'label'

# Mapeo de etiquetas
LABEL_MAP = {'FAKE': 0, 'REAL': 1}
INV_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()} # {0: 'FAKE', 1: 'REAL'}
TARGET_NAMES = list(LABEL_MAP.keys()) # ['FAKE', 'REAL']

# --- Configuración de Preprocesamiento (directamente del notebook) ---
SPANISH_STOPWORDS = stopwords.words('spanish')
STEMMER = SnowballStemmer('spanish')
PUNCTUATION = string.punctuation

def preprocess_text(text: str) -> str:
    """
    Limpia y preprocesa el texto: minúsculas, sin puntuación, sin números,
    sin stopwords, stemming. (Función del notebook)
    """
    if not isinstance(text, str):
        return "" # Manejar posibles NaNs o no-strings
    text = text.lower()
    text = ''.join(char for char in text if char not in PUNCTUATION)
    text = re.sub(r'\d+', '', text) # Eliminar números
    # Tokenización simple por espacio después de limpiar
    words = text.split()
    # Eliminar stopwords y aplicar stemming
    processed_words = [STEMMER.stem(word) for word in words if word not in SPANISH_STOPWORDS]
    return ' '.join(processed_words)
# --- Fin Configuración de Preprocesamiento ---

# Parámetros del Vectorizador (del notebook)
TFIDF_MAX_FEATURES = 5000

# Parámetros del Clasificador (del notebook, ejemplo con Logistic Regression)
LOGREG_SOLVER = 'liblinear'
RANDOM_STATE = 42
# core/config.py
import os
from pathlib import Path

from dotenv import load_dotenv

# Carga variables de entorno si usas un archivo .env
load_dotenv()

# Ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Ruta al modelo serializado
# Puedes usar una variable de entorno para más flexibilidad
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "pipeline_model.joblib"))

# Clases o etiquetas esperadas por tu modelo (ajusta según tu caso)
TARGET_NAMES = ['FAKE', 'REAL'] # O [0, 1] si usas números

# Nombre de la columna de texto en tus datos
TEXT_FEATURE = 'text' # Ajusta si tu columna se llama diferente

# Nombre de la columna objetivo
TARGET_FEATURE = 'label' # Ajusta si tu columna se llama diferente
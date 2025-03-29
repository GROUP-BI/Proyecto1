# Ejemplo de cómo ejecutarlo una vez (en un script aparte o celda de notebook)
from core.config import BASE_DIR
from pipeline.pipeline import train_initial_pipeline

data_file = str(BASE_DIR / "data" / "fake_news_spanish.csv")
try:
    train_initial_pipeline(data_file)
    print("Pipeline inicial entrenado y guardado exitosamente!")
except Exception as e:
    print(f"Error al entrenar/guardar pipeline inicial: {e}")

# main.py
import logging

from api.endpoints import prediction, retraining
from core.config import BASE_DIR  # Si necesitas acceder a la ruta base
from fastapi import FastAPI

# from core.logging_config import setup_logging # Descomenta si creas logging_config.py

# setup_logging() # Configura el logging (opcional)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="API de Detección de Noticias Falsas",
    description="API para predecir si una noticia es falsa y para reentrenar el modelo.",
    version="1.0.0" # Versión inicial de la API
)

# Incluir routers de los endpoints
app.include_router(prediction.router, prefix="/api/v1") # Prefijo opcional para versionado de API
app.include_router(retraining.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Acciones al iniciar la aplicación (ej: precargar modelo)."""
    logger.info("Iniciando aplicación...")
    # La carga del pipeline ya se intenta hacer al importar prediction.py
    # Podrías añadir comprobaciones adicionales aquí si es necesario
    pass

@app.on_event("shutdown")
async def shutdown_event():
    """Acciones al detener la aplicación."""
    logger.info("Deteniendo aplicación...")

@app.get("/", tags=["Health Check"])
async def read_root():
    """Endpoint básico para verificar que la API está funcionando."""
    return {"status": "ok", "message": "Bienvenido a la API de Detección de Noticias Falsas"}


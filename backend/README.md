# Proyecto1

Para ejecutar localmente con Uvicorn:

`````shell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
`````

Documenta cómo configurar, ejecutar y usar tu API.

# Proyecto 1 - Etapa 2: API de Detección de Noticias Falsas

Esta API permite predecir si una noticia es falsa o verdadera y reentrenar el modelo subyacente.

## Rol: Ingeniero de Datos

El objetivo de esta etapa es automatizar el pipeline de ML, exponerlo a través de una API RESTful robusta y gestionar el ciclo de vida del modelo (predicción y reentrenamiento).

## estructura del proyecto

```shell
├── api/                # Código de la API FastAPI (endpoints, schemas) 
├── core/               # Configuraciones y utilidades centrales 
├── data/               # Datos de ejemplo/entrenamiento 
├── models/             # Modelo serializado (`pipeline_model.joblib`) 
├── pipeline/           # Lógica del pipeline de ML 
├── tests/              # Pruebas 
├── .gitignore 
├── main.py             # Punto de entrada de FastAPI 
├── requirements.txt    # Dependencias 
└── README.md           # Este archivo
```

## Configuración

1. **Clonar el repositorio:**

   ```bash
   git clone <tu-repositorio-url>
   cd <nombre-del-directorio>
   ```
2. **Crear un entorno virtual (recomendado):**

   ```bash
   python -m venv venv source venv/bin/activate
   # En Windows 
   venv\Scripts\activate
   ```
3. **Instalar dependencias:**

   ```bash
   pip install -r requirements.txt
   ```
4. **(IMPORTANTE) Colocar el modelo:** Asegúrate de que tu archivo de pipeline serializado (`pipeline_model.joblib` o como lo hayas llamado) esté en el directorio `models/`. Este archivo debe ser el resultado de tu Etapa 1.
5. **(Opcional) Descargar datos de NLTK/Spacy:** Si tu preprocesamiento los usa, asegúrate de descargarlos (ej: `python -m nltk.downloader stopwords punkt`

## Ejecución Local

Para iniciar la API localmente usando Uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

* `--reload`: Reinicia automáticamente el servidor cuando detecta cambios en el código (útil para desarrollo).
* `--host 0.0.0.0`: Permite acceder a la API desde otras máquinas en la misma red.
* `--port 8000`: Especifica el puerto en el que se ejecutará la API.

Puedes acceder a la documentación interactiva (Swagger UI) en `http://localhost:8000/docs` y a la documentación alternativa (ReDoc) en `http://localhost:8000/redoc`.

## Uso de la API

### Endpoint de Predicción

* **URL:**`/api/v1/predict`
* **Método:**`POST`
* **Body (JSON):**

  ```JSON
  {
    "news_items": [
      {
        "id": 1,
        "text": "Este es el texto de la primera noticia a clasificar..."
      },
      {
        "id": "item-002",
        "text": "Aquí va el contenido de otra noticia."
      }
    ]
  }
  ```
* **Respuesta Exitosa (200 OK):**

  ```JSON
  {
    "predictions": [
      {
        "id": 1,
        "prediction": "FAKE",
        "probability": 0.9234
      },
      {
        "id": "item-002",
        "prediction": "REAL",
        "probability": 0.7511
      }
    ],
    "model_version": "1.0.0"
  }
  ```
* **Respuesta de Error (ej: 400 Bad Request, 500 Internal Server Error):**

  ```JSON
  {
    "detail": "Mensaje descriptivo del error."
  }
  ```

### Endpoint de Reentrenamiento

* **URL:**`/api/v1/retrain`
* **Método:**`POST`
* **Body (JSON):**

  ```JSON
  {
    "new_data": [
      {
        "text": "Texto de una noticia verificada usada para reentrenar.",
        "label": "REAL" // O 1, según tu formato
      },
      {
        "text": "Otra noticia, esta resultó ser falsa.",
        "label": "FAKE" // O 0
      }
      // ... más datos
    ]
  }
  ```
* **Respuesta Exitosa (202 Accepted):**

  ```JSON
  {
      "message": "Proceso de reentrenamiento iniciado en segundo plano. El nuevo modelo estará disponible en breve.",
      "precision": 0.0, // Métricas placeholder o calculadas síncronamente
      "recall": 0.0,
      "f1_score": 0.0,
      "new_model_version": "pending update..."
  }
  ```

  *Nota: El reentrenamiento real y el guardado del modelo ocurren en segundo plano. La API responde inmediatamente.*
* **Respuesta de Error (ej: 400 Bad Request, 500 Internal Server Error):**

  ```JSON
  {
    "detail": "Mensaje descriptivo del error."
  }
  ```

## Estrategia de Reentrenamiento Implementada

Se implementó la estrategia de **Reentrenamiento Completo (sobre Nuevos Datos)**.

* **Descripción:** Cuando se llama al endpoint `/retrain`, se toma el lote de datos (`new_data`) proporcionado en la solicitud y se entrena un **nuevo** pipeline desde cero utilizando **únicamente** estos datos. El pipeline resultante **reemplaza** al archivo `pipeline_model.joblib` existente.
* **Ventaja:** Implementación sencilla, permite actualizar el modelo con la información más reciente proporcionada.
* **Desventaja:** El modelo "olvida" lo aprendido con datos anteriores. Si los lotes de reentrenamiento no son representativos o son pequeños, el rendimiento puede degradarse. En un sistema productivo, sería preferible combinar datos nuevos y antiguos o usar aprendizaje incremental si el modelo lo soporta.

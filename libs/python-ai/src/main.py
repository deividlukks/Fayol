from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.services.categorizer import CategorizerService

app = FastAPI(
    title="Fayol AI Service",
    description="Microserviço de Inteligência Artificial para o ecossistema Fayol",
    version="0.1.0"
)

categorizer = CategorizerService()

# --- DTOs (Pydantic Models) ---
class CategorizationRequest(BaseModel):
    description: str

class CategorizationResponse(BaseModel):
    category: str | None
    confidence: float
    method: str

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "online", "service": "Fayol AI"}

@app.post("/categorize", response_model=CategorizationResponse)
def predict_category(payload: CategorizationRequest):
    """
    Recebe uma descrição de transação e retorna a categoria sugerida.
    """
    try:
        category = categorizer.predict_category(payload.description)
        
        return {
            "category": category,
            "confidence": 1.0 if category else 0.0, # Simulado por enquanto
            "method": "keyword_matching" # Indica qual método foi usado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
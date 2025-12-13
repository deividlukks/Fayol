from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from src.services.categorizer import CategorizerService
from src.services.analyzer import AnalyzerService
from src.services.forecaster import ForecasterService
from src.models.schemas import AnalysisRequest, InsightResponse

app = FastAPI(
    title="Fayol AI Service",
    description="Microserviço de Inteligência Artificial Avançada",
    version="0.3.0"
)

categorizer = CategorizerService()
analyzer = AnalyzerService()
forecaster = ForecasterService()

# --- DTOs ---
class CategorizationRequest(BaseModel):
    description: str

class CategorizationResponse(BaseModel):
    category: str | None
    confidence: float
    method: str

class FeedbackRequest(BaseModel):
    description: str
    category: str

class ForecastResponse(BaseModel):
    predicted_amount: float
    trend: str
    average_spend: float = 0
    message: str | None = None

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "online", "service": "Fayol AI", "version": "0.3.0", "features": ["nlp", "forecasting", "learning"]}

@app.post("/categorize", response_model=CategorizationResponse)
def predict_category(payload: CategorizationRequest):
    """
    Sugere categoria usando Naive Bayes treinado.
    """
    try:
        category = categorizer.predict_category(payload.description)
        return {
            "category": category,
            "confidence": 1.0 if category else 0.0,
            "method": "ml_naive_bayes"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train", status_code=201)
def train_model(payload: FeedbackRequest):
    """
    Endpoint de Feedback: Ensina a IA que uma descrição pertence a uma categoria.
    """
    try:
        success = categorizer.learn(payload.description, payload.category)
        return {"success": success, "message": "Modelo atualizado com novo conhecimento."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights", response_model=List[InsightResponse])
def generate_insights(payload: AnalysisRequest):
    """
    Gera insights baseados em estatística e detecção de anomalias.
    """
    try:
        insights = analyzer.analyze_spending(payload.transactions)
        return insights
    except Exception as e:
        print(f"Erro na análise: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast", response_model=ForecastResponse)
def predict_future_spending(payload: AnalysisRequest):
    """
    Prevê gastos do próximo mês baseados no histórico.
    """
    try:
        result = forecaster.predict_next_month(payload.transactions)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
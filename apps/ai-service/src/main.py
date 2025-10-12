from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Optional
import datetime

from .services.ai_service import (
    suggest_category_from_description,
    detect_anomalies_in_transactions,
    generate_financial_recommendations,
    predict_future_spending,
)

app = FastAPI(
    title="Fayol AI Service",
    description="Serviço de IA para análise financeira, categorização e previsões.",
    version="0.1.0",
)

# --- Pydantic Models ---

class TransactionInput(BaseModel):
    id: str
    date: datetime.datetime
    description: str
    amount: float
    movementType: Literal["income", "expense"]
    category: Optional[str] = None
    subcategory: Optional[str] = None

class SuggestCategoryInput(BaseModel):
    description: str

class SuggestCategoryOutput(BaseModel):
    suggestedCategory: str
    confidence: float

class AnomalyOutput(BaseModel):
    transactionId: str
    reason: str
    severity: Literal["low", "medium", "high"]

class RecommendationOutput(BaseModel):
    recommendationId: str
    title: str
    description: str
    priority: Literal["low", "medium", "high"]

class PredictFutureInput(BaseModel):
    userId: str
    transactions: List[TransactionInput]
    days: int = 30

class SpendingPrediction(BaseModel):
    date: str
    predictedExpenses: float
    predictedIncome: float

class FuturePredictionOutput(BaseModel):
    userId: str
    days: int
    predictions: List[SpendingPrediction]
    totalPredictedExpenses: float
    totalPredictedIncome: float


# --- Endpoints ---

@app.get("/", tags=["General"])
def read_root():
    return {"message": "Bem-vindo ao Fayol AI Service"}

@app.get("/health", tags=["General"])
def health_check():
    return {"status": "ok"}

@app.post("/suggest-category", response_model=SuggestCategoryOutput, tags=["Categorization"])
async def suggest_category(payload: SuggestCategoryInput):
    """Sugere uma categoria para uma transação com base na sua descrição."""
    try:
        category, confidence = suggest_category_from_description(payload.description)
        return {"suggestedCategory": category, "confidence": confidence}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect-anomalies", response_model=List[AnomalyOutput], tags=["Analysis"])
async def detect_anomalies(payload: List[TransactionInput]):
    """Deteta anomalias numa lista de transações."""
    try:
        anomalies = detect_anomalies_in_transactions(payload)
        return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommendations", response_model=List[RecommendationOutput], tags=["Analysis"])
async def get_recommendations(payload: List[TransactionInput]):
    """Gera recomendações financeiras com base num histórico de transações."""
    try:
        recommendations = generate_financial_recommendations(payload)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-future", response_model=FuturePredictionOutput, tags=["Prediction"])
async def predict_future(payload: PredictFutureInput):
    """Prevê gastos e receitas para os próximos N dias."""
    try:
        prediction = predict_future_spending(payload.userId, payload.transactions, payload.days)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

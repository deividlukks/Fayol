from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TransactionInput(BaseModel):
    amount: float
    date: datetime
    category_name: str
    type: str  # 'INCOME' ou 'EXPENSE'

class AnalysisRequest(BaseModel):
    transactions: List[TransactionInput]

class InsightResponse(BaseModel):
    type: str  # 'warning', 'tip', 'success'
    text: str
    score: float  # Para ordenação de relevância
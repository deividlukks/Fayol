import random
from typing import List, Tuple
from datetime import datetime, timedelta
from ..utils.preprocessor import preprocess_text

# --- Mock Data and Simple Logic ---
# Em um cenário real, isso seria substituído por modelos de ML treinados.

def suggest_category_from_description(description: str) -> Tuple[str, float]:
    """
    Lógica de mock para sugerir categoria.
    Procura por palavras-chave na descrição.
    """
    processed_desc = preprocess_text(description)
    
    if any(keyword in processed_desc for keyword in ["mercado", "super", "compras", "alimentacao"]):
        return "Alimentação", 0.85
    if any(keyword in processed_desc for keyword in ["uber", "taxi", "onibus", "transporte"]):
        return "Transporte", 0.90
    if any(keyword in processed_desc for keyword in ["aluguel", "condominio", "moradia"]):
        return "Moradia", 0.95
    if any(keyword in processed_desc for keyword in ["luz", "agua", "internet", "conta"]):
        return "Contas da Casa", 0.88
    
    return "Outros", 0.40

def detect_anomalies_in_transactions(transactions: List[dict]) -> List[dict]:
    """
    Lógica de mock para detecção de anomalias.
    Marca transações com valor muito alto como anomalias.
    """
    anomalies = []
    if not transactions:
        return []

    amounts = [t['amount'] for t in transactions if t['movementType'] == 'expense']
    if not amounts:
        return []

    avg_expense = sum(amounts) / len(amounts)
    std_dev = (sum([(x - avg_expense) ** 2 for x in amounts]) / len(amounts)) ** 0.5

    for t in transactions:
        if t['movementType'] == 'expense' and t['amount'] > avg_expense + 2 * std_dev:
            anomalies.append({
                "transactionId": t['id'],
                "reason": f"Valor R$ {t['amount']:.2f} é significativamente maior que a média de gastos (R$ {avg_expense:.2f}).",
                "severity": "medium"
            })
    return anomalies

def generate_financial_recommendations(transactions: List[dict]) -> List[dict]:
    """
    Lógica de mock para gerar recomendações.
    """
    recommendations = []
    total_expenses = sum(t['amount'] for t in transactions if t['movementType'] == 'expense')
    total_income = sum(t['amount'] for t in transactions if t['movementType'] == 'income')

    if total_expenses > total_income * 0.9:
        recommendations.append({
            "recommendationId": "rec_1",
            "title": "Rever Orçamento",
            "description": "As suas despesas estão muito próximas ou excedem as suas receitas. Considere rever o seu orçamento para identificar áreas de poupança.",
            "priority": "high"
        })

    recommendations.append({
        "recommendationId": "rec_2",
        "title": "Criar Fundo de Emergência",
        "description": "É sempre uma boa prática ter um fundo de emergência. Tente poupar o equivalente a 3-6 meses das suas despesas.",
        "priority": "medium"
    })
    
    return recommendations


def predict_future_spending(user_id: str, transactions: List[dict], days: int) -> dict:
    """
    Lógica de mock para previsão de gastos.
    Projeta uma média diária de gastos para o futuro.
    """
    predictions = []
    if not transactions:
        # Retorna uma previsão vazia se não houver dados
        return {
            "userId": user_id,
            "days": days,
            "predictions": [],
            "totalPredictedExpenses": 0,
            "totalPredictedIncome": 0,
        }

    daily_expenses = {}
    for t in transactions:
        if t['movementType'] == 'expense':
            date_str = t['date'].strftime('%Y-%m-%d')
            daily_expenses[date_str] = daily_expenses.get(date_str, 0) + t['amount']
    
    avg_daily_expense = sum(daily_expenses.values()) / len(daily_expenses) if daily_expenses else 0

    total_predicted_expenses = 0
    today = datetime.now()
    for i in range(1, days + 1):
        future_date = today + timedelta(days=i)
        # Simula alguma variação
        predicted_expense = max(0, avg_daily_expense + random.uniform(-avg_daily_expense * 0.1, avg_daily_expense * 0.1))
        predictions.append({
            "date": future_date.strftime('%Y-%m-%d'),
            "predictedExpenses": round(predicted_expense, 2),
            "predictedIncome": 0 # Mock simples
        })
        total_predicted_expenses += predicted_expense

    return {
        "userId": user_id,
        "days": days,
        "predictions": predictions,
        "totalPredictedExpenses": round(total_predicted_expenses, 2),
        "totalPredictedIncome": 0,
    }

import pandas as pd
import numpy as np
from typing import List
from src.models.schemas import TransactionInput, InsightResponse

class AnalyzerService:
    def analyze_spending(self, transactions: List[TransactionInput]) -> List[InsightResponse]:
        if not transactions:
            return []

        insights = []
        
        # Converte para DataFrame
        data = [t.dict() for t in transactions]
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Filtra apenas despesas
        expenses = df[df['type'] == 'EXPENSE'].copy()
        
        if expenses.empty:
            return [InsightResponse(type='success', text='Você não possui despesas registradas recentemente. Continue economizando!', score=1.0)]

        # --- 1. Detecção de Anomalias (Outliers) ---
        # Calcula a média e desvio padrão dos gastos
        mean_spend = expenses['amount'].mean()
        std_spend = expenses['amount'].std()
        
        # Se tiver dados suficientes (mais que 3 transações e desvio padrão não nulo)
        if len(expenses) > 3 and std_spend > 0:
            # Define limite como: Média + 2x Desvio Padrão (Regra empírica básica)
            threshold = mean_spend + (2 * std_spend)
            
            outliers = expenses[expenses['amount'] > threshold]
            
            for _, row in outliers.iterrows():
                insights.append(InsightResponse(
                    type='warning',
                    text=f"⚠️ Gasto atípico detectado: R$ {row['amount']:.2f} em '{row['category_name']}'. Isso é muito acima da sua média.",
                    score=1.0 # Alta prioridade
                ))

        # --- 2. Análise de Maior Categoria de Gasto ---
        category_sum = expenses.groupby('category_name')['amount'].sum().sort_values(ascending=False)
        if not category_sum.empty:
            top_category = category_sum.index[0]
            top_amount = category_sum.iloc[0]
            total_spent = expenses['amount'].sum()
            
            percent = (top_amount / total_spent) * 100
            
            if percent > 40:
                insights.append(InsightResponse(
                    type='warning',
                    text=f"Atenção: '{top_category}' representa {percent:.1f}% de todas as suas despesas (R$ {top_amount:.2f}).",
                    score=0.9
                ))

        # --- 3. Análise de Tendência (Mês Atual vs Mês Anterior) ---
        expenses['month_period'] = expenses['date'].dt.to_period('M')
        monthly_spend = expenses.groupby('month_period')['amount'].sum()
        
        if len(monthly_spend) >= 2:
            current_month = monthly_spend.iloc[-1]
            last_month = monthly_spend.iloc[-2]
            
            if last_month > 0:
                variation = ((current_month - last_month) / last_month) * 100
                
                if variation > 20:
                    insights.append(InsightResponse(
                        type='warning',
                        text=f"Seus gastos subiram {variation:.1f}% em relação ao mês passado.",
                        score=0.85
                    ))
                elif variation < -10:
                    insights.append(InsightResponse(
                        type='success',
                        text=f"Parabéns! Você reduziu seus gastos em {abs(variation):.1f}% comparado ao mês anterior.",
                        score=0.8
                    ))

        # --- 4. Dica Genérica (Fallback) ---
        if len(insights) == 0:
            insights.append(InsightResponse(
                type='tip',
                text='Mantenha o registro diário dos seus gastos para que a IA possa aprender seus hábitos com mais precisão.',
                score=0.1
            ))

        # Retorna ordenado por relevância (score), limitando a 5 insights
        return sorted(insights, key=lambda x: x.score, reverse=True)[:5]
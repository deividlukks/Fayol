import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.arima.model import ARIMA
from typing import List, Dict
from src.models.schemas import TransactionInput
import warnings

# Ignora avisos de convergência do statsmodels para manter logs limpos
warnings.filterwarnings("ignore")

class ForecasterService:
    def predict_next_month(self, transactions: List[TransactionInput]) -> Dict:
        if not transactions:
            return {"predicted_amount": 0, "trend": "neutral", "message": "Sem dados."}

        # Prepara DataFrame
        data = [t.dict() for t in transactions]
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Filtra despesas
        expenses = df[df['type'] == 'EXPENSE'].copy()
        if expenses.empty:
            return {"predicted_amount": 0, "trend": "stable", "message": "Sem despesas."}

        # Agrupa por mês (início do mês) para ter uma série temporal regular
        # 'MS' = Month Start frequency
        monthly_spend = expenses.groupby(pd.Grouper(key='date', freq='MS'))['amount'].sum().fillna(0)
        
        # Quantidade de meses disponíveis
        n_months = len(monthly_spend)
        
        last_month_value = float(monthly_spend.iloc[-1])
        average_spend = float(monthly_spend.mean())

        # --- ESTRATÉGIA DE PREVISÃO ---
        
        # Cenário 1: Pouquíssimos dados (< 3 meses) -> Usa média simples
        if n_months < 3:
            return {
                "predicted_amount": round(average_spend, 2),
                "trend": "insufficient_data",
                "average_spend": round(average_spend, 2),
                "last_month_spend": round(last_month_value, 2),
                "message": "Histórico insuficiente para previsão avançada."
            }

        # Cenário 2: Dados suficientes para ARIMA (> 6 meses) -> Modelo Estatístico Robusto
        # Cenário 3: Dados intermediários (3-6 meses) -> Regressão Linear (Fallback)
        
        prediction = 0.0
        method = "linear_regression"

        if n_months >= 6:
            try:
                # Modelo ARIMA (1,1,1) simples para começar
                # Em produção real, poderíamos usar auto_arima para achar os melhores p,d,q
                model = ARIMA(monthly_spend, order=(1, 1, 1))
                model_fit = model.fit()
                
                # Previsão de 1 passo à frente
                forecast = model_fit.forecast(steps=1)
                prediction = float(forecast.iloc[0])
                method = "arima_timeseries"
            except Exception as e:
                print(f"Erro no ARIMA, fallback para Regressão: {e}")
                method = "fallback_regression"
                prediction = self._predict_linear(monthly_spend)
        else:
            prediction = self._predict_linear(monthly_spend)

        # Evitar previsão negativa
        prediction = max(0.0, prediction)

        # Cálculo de Tendência
        trend = "stable"
        diff = prediction - last_month_value
        if diff > (last_month_value * 0.10): # Aumento > 10%
            trend = "increasing"
        elif diff < -(last_month_value * 0.10): # Queda > 10%
            trend = "decreasing"

        return {
            "predicted_amount": round(prediction, 2),
            "trend": trend,
            "average_spend": round(average_spend, 2),
            "last_month_spend": round(last_month_value, 2),
            "method": method
        }

    def _predict_linear(self, series: pd.Series) -> float:
        """Helper para previsão simples via Regressão Linear"""
        y = series.values
        X = np.arange(len(y)).reshape(-1, 1)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Próximo índice
        next_index = len(y)
        pred = model.predict([[next_index]])[0]
        return float(pred)
import pandas as pd
import io
from io import BytesIO

class ExcelGenerator:
    def generate_transactions_sheet(self, data) -> bytes:
        # Converte objetos Pydantic para lista de dicts
        transactions_data = [t.dict() for t in data.transactions]
        
        df = pd.DataFrame(transactions_data)
        
        # Renomear colunas para ficar bonito
        if not df.empty:
            df = df.rename(columns={
                "date": "Data",
                "description": "Descrição",
                "category": "Categoria",
                "account": "Conta",
                "amount": "Valor",
                "type": "Tipo"
            })
            
            # Formatação básica
            df['Data'] = pd.to_datetime(df['Data']).dt.strftime('%d/%m/%Y')
        
        output = BytesIO()
        
        # Usa o ExcelWriter para criar o arquivo em memória
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Transações')
            
            # Aba de Resumo
            summary_data = [
                {"Métrica": "Receitas", "Valor": data.summary.get('total_income', 0)},
                {"Métrica": "Despesas", "Valor": data.summary.get('total_expense', 0)},
                {"Métrica": "Saldo", "Valor": data.summary.get('balance', 0)}
            ]
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, index=False, sheet_name='Resumo')

        return output.getvalue()
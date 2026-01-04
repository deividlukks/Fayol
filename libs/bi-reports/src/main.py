from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional
from src.services.pdf_generator import PDFGenerator
from src.services.excel_generator import ExcelGenerator
from datetime import datetime

app = FastAPI(
    title="Fayol BI Reports",
    description="Microserviço de Geração de Relatórios (PDF/Excel)",
    version="0.1.1"
)

# --- DTOs ---
class TransactionItem(BaseModel):
    date: str
    description: str
    category: str
    account: str
    amount: float
    type: str  # 'INCOME' | 'EXPENSE'

class ReportRequest(BaseModel):
    title: str
    period: str
    user_name: str
    transactions: List[TransactionItem]
    summary: dict  # { "total_income": 1000, "total_expense": 500, "balance": 500 }

# --- Services ---
pdf_service = PDFGenerator()
excel_service = ExcelGenerator()

@app.get("/")
def read_root():
    return {"status": "online", "service": "Fayol BI Reports", "version": "0.1.0"}

@app.post("/generate/pdf")
async def generate_pdf_report(payload: ReportRequest):
    """
    Gera um relatório PDF bonito baseado nos dados enviados.
    """
    try:
        pdf_bytes = pdf_service.generate_monthly_report(payload)
        
        filename = f"relatorio_fayol_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Erro PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")

@app.post("/generate/excel")
async def generate_excel_report(payload: ReportRequest):
    """
    Gera uma planilha Excel com os dados brutos.
    """
    try:
        excel_bytes = excel_service.generate_transactions_sheet(payload)
        
        filename = f"extrato_fayol_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Erro Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar Excel: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
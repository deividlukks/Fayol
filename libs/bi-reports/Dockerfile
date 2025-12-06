FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema (necessárias para xhtml2pdf/reportlab)
# CORREÇÃO: Atualizado nome do pacote libgdk-pixbuf-2.0-0
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala requerimentos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte e templates
COPY src/ ./src/

# Exposição da porta
EXPOSE 8001

# Comando de inicialização
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
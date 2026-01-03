FROM python:3.11-slim

WORKDIR /app

# 1. Instalar dependências do sistema (Adicionado libgomp1 para scikit-learn)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar requerimentos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copiar código fonte
COPY src/ ./src/

# 4. Expor a porta
EXPOSE 8000

# 5. Comando de inicialização
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
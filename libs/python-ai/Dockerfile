FROM python:3.11-slim

WORKDIR /app

# CORREÇÃO: Instala curl (necessário para healthcheck) além do build-essential
RUN apt-get update && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*

# Copia e instala requerimentos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte
COPY src/ ./src/

# Exposição da porta
EXPOSE 8000

# Comando de inicialização
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
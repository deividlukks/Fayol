# ================================
# MULTI-STAGE BUILD - AI Service (Python/FastAPI)
# ================================

# ================================
# Stage 1: Builder
# ================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Instala dependências do sistema necessárias para compilação
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Copia e instala dependências Python
COPY ./apps/ai-service/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ================================
# Stage 2: Production Runtime
# ================================
FROM python:3.11-slim

WORKDIR /app

# Instala apenas dependências runtime essenciais
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Cria usuário não-root
RUN useradd -m -u 1001 -s /bin/bash appuser

# Copia dependências Python do builder
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Adiciona o diretório de binários do Python ao PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Copia código da aplicação
COPY --chown=appuser:appuser ./apps/ai-service/src ./src

# Cria diretórios necessários
RUN mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# Muda para usuário não-root
USER appuser

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV LOG_LEVEL=info

# Expõe porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Comando para iniciar a aplicação
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

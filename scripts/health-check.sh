#!/bin/bash

# ============================================
# Script de Health Check - Fayol
# ============================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs dos serviços
BACKEND_URL="${BACKEND_URL:-https://api.seudominio.com}"
AI_URL="${AI_URL:-https://ai.seudominio.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.seudominio.com}"
EMAIL_ALERT="${EMAIL_ALERT:-}"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  🏥 Fayol Health Check${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Função para verificar serviço
check_service() {
  local name=$1
  local url=$2
  local endpoint=$3

  echo -e "${YELLOW}Verificando $name...${NC}"

  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url$endpoint")

  if [ "$response" -eq 200 ]; then
    echo -e "${GREEN}✅ $name: OK (HTTP $response)${NC}"
    return 0
  else
    echo -e "${RED}❌ $name: FALHOU (HTTP $response)${NC}"

    # Enviar alerta por email se configurado
    if [ -n "$EMAIL_ALERT" ]; then
      echo "Serviço $name está offline ou com problema (HTTP $response)" | \
        mail -s "ALERTA: Fayol - $name DOWN" "$EMAIL_ALERT"
    fi

    return 1
  fi
}

# Verificar PM2
echo -e "${YELLOW}Verificando PM2...${NC}"
if command -v pm2 >/dev/null 2>&1; then
  pm2_status=$(pm2 jlist 2>/dev/null)

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2: OK${NC}"

    # Verificar processos específicos
    echo ""
    echo -e "${YELLOW}Status dos processos:${NC}"
    pm2 list | grep -E "fayol-backend|fayol-admin|fayol-ai|fayol-telegram-bot"
  else
    echo -e "${RED}❌ PM2: Erro ao listar processos${NC}"
  fi
else
  echo -e "${RED}❌ PM2: Não instalado${NC}"
fi

echo ""

# Verificar serviços via HTTP
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Verificando Endpoints${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

check_service "Backend" "$BACKEND_URL" "/api/v1/health"
backend_status=$?

check_service "AI Service" "$AI_URL" "/health"
ai_status=$?

check_service "Admin Panel" "$ADMIN_URL" "/"
admin_status=$?

echo ""

# Verificar banco de dados (se possível)
echo -e "${YELLOW}Verificando banco de dados...${NC}"
if command -v psql >/dev/null 2>&1; then
  if [ -n "$DB_USER" ] && [ -n "$DB_NAME" ] && [ -n "$DB_PASS" ]; then
    PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT 1" >/dev/null 2>&1

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Database: OK${NC}"
    else
      echo -e "${RED}❌ Database: Erro de conexão${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Database: Credenciais não configuradas${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  psql não instalado - pulando verificação do banco${NC}"
fi

echo ""

# Verificar Redis (se possível)
echo -e "${YELLOW}Verificando Redis...${NC}"
if command -v redis-cli >/dev/null 2>&1; then
  if [ -n "$REDIS_PASSWORD" ]; then
    redis-cli -a $REDIS_PASSWORD ping >/dev/null 2>&1
  else
    redis-cli ping >/dev/null 2>&1
  fi

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Redis: OK${NC}"
  else
    echo -e "${RED}❌ Redis: Erro de conexão${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  redis-cli não instalado - pulando verificação${NC}"
fi

echo ""

# Verificar espaço em disco
echo -e "${YELLOW}Verificando espaço em disco...${NC}"
disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$disk_usage" -lt 80 ]; then
  echo -e "${GREEN}✅ Disco: $disk_usage% usado${NC}"
elif [ "$disk_usage" -lt 90 ]; then
  echo -e "${YELLOW}⚠️  Disco: $disk_usage% usado (ATENÇÃO)${NC}"
else
  echo -e "${RED}❌ Disco: $disk_usage% usado (CRÍTICO)${NC}"

  if [ -n "$EMAIL_ALERT" ]; then
    echo "Espaço em disco crítico: $disk_usage% usado" | \
      mail -s "ALERTA: Fayol - Disco Cheio" "$EMAIL_ALERT"
  fi
fi

echo ""

# Verificar memória
echo -e "${YELLOW}Verificando memória...${NC}"
if command -v free >/dev/null 2>&1; then
  mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

  if [ "$mem_usage" -lt 80 ]; then
    echo -e "${GREEN}✅ Memória: $mem_usage% usado${NC}"
  elif [ "$mem_usage" -lt 90 ]; then
    echo -e "${YELLOW}⚠️  Memória: $mem_usage% usado (ATENÇÃO)${NC}"
  else
    echo -e "${RED}❌ Memória: $mem_usage% usado (CRÍTICO)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Comando 'free' não disponível${NC}"
fi

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Resumo${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Contar falhas
failures=0
[ $backend_status -ne 0 ] && ((failures++))
[ $ai_status -ne 0 ] && ((failures++))
[ $admin_status -ne 0 ] && ((failures++))

if [ $failures -eq 0 ]; then
  echo -e "${GREEN}✅ Todos os serviços estão operacionais!${NC}"
  exit 0
else
  echo -e "${RED}❌ $failures serviço(s) com problema!${NC}"
  exit 1
fi

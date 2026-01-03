#!/bin/bash
# ============================================
# Fayol - Restore do PostgreSQL
# ============================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Fayol - Restore PostgreSQL${NC}"
echo "================================================"
echo ""

# Verifica se foi passado um arquivo de backup
if [ -z "$1" ]; then
  echo -e "${BLUE}📋 Backups disponíveis:${NC}"
  echo ""

  BACKUP_DIR="${BACKUP_DIR:-./backups}"

  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/fayol_backup_*.sql.gz 2>/dev/null)" ]; then
    echo -e "${RED}❌ Nenhum backup encontrado em $BACKUP_DIR${NC}"
    exit 1
  fi

  ls -lht "$BACKUP_DIR"/fayol_backup_*.sql.gz | head -10
  echo ""
  echo -e "${YELLOW}Uso:${NC}"
  echo "  $0 <arquivo_backup.sql.gz>"
  echo ""
  echo -e "${YELLOW}Exemplo:${NC}"
  echo "  $0 backups/fayol_backup_20250131_120000.sql.gz"
  exit 0
fi

BACKUP_FILE="$1"

# Verifica se o arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Erro: Arquivo '$BACKUP_FILE' não encontrado!${NC}"
  exit 1
fi

# Confirma ação (PERIGOSO)
echo -e "${RED}⚠️  ATENÇÃO: Esta ação irá SOBRESCREVER o banco de dados atual!${NC}"
echo ""
read -p "Deseja continuar? (digite 'CONFIRMO' para prosseguir): " CONFIRMATION

if [ "$CONFIRMATION" != "CONFIRMO" ]; then
  echo -e "${YELLOW}❌ Operação cancelada.${NC}"
  exit 0
fi

# Verifica se o container do postgres está rodando
if ! docker ps | grep -q fayol_postgres; then
  echo -e "${RED}❌ Erro: Container fayol_postgres não está rodando!${NC}"
  echo "   Execute: docker-compose up -d postgres"
  exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Restaurando backup...${NC}"
echo "   Arquivo: $BACKUP_FILE"
echo ""

# Para serviços que dependem do banco
echo -e "${YELLOW}⏸️  Parando serviços dependentes...${NC}"
docker-compose stop backend web-app telegram-bot 2>/dev/null || true

echo ""
echo -e "${YELLOW}📥 Executando restore...${NC}"

# Restaura backup
gunzip < "$BACKUP_FILE" | docker exec -i fayol_postgres psql \
  -U "${POSTGRES_USER:-fayol_admin}" \
  -d postgres

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Restore concluído com sucesso!${NC}"
  echo ""

  # Reinicia serviços
  echo -e "${YELLOW}🔄 Reiniciando serviços...${NC}"
  docker-compose up -d backend web-app telegram-bot 2>/dev/null || true

  echo ""
  echo -e "${GREEN}✨ Restore finalizado!${NC}"
else
  echo -e "${RED}❌ Erro ao executar restore!${NC}"
  exit 1
fi

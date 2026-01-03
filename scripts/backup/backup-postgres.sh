#!/bin/bash
# ============================================
# Fayol - Backup Manual do PostgreSQL
# ============================================

set -e

# Configurações
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="fayol_backup_${TIMESTAMP}.sql.gz"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗄️  Fayol - Backup PostgreSQL${NC}"
echo "================================================"
echo ""

# Cria diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verifica se o container do postgres está rodando
if ! docker ps | grep -q fayol_postgres; then
  echo -e "${RED}❌ Erro: Container fayol_postgres não está rodando!${NC}"
  echo "   Execute: docker-compose up -d postgres"
  exit 1
fi

echo -e "${YELLOW}📦 Criando backup...${NC}"
echo "   Arquivo: $BACKUP_FILE"
echo "   Destino: $BACKUP_DIR"
echo ""

# Executa backup usando pg_dump dentro do container
docker exec fayol_postgres pg_dump \
  -U "${POSTGRES_USER:-fayol_admin}" \
  -d "${POSTGRES_DB:-fayol_db}" \
  --clean \
  --if-exists \
  --create \
  --no-owner \
  --no-acl \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verifica se o backup foi criado
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
  echo -e "${GREEN}✅ Backup criado com sucesso!${NC}"
  echo "   Tamanho: $BACKUP_SIZE"
  echo "   Path: $BACKUP_DIR/$BACKUP_FILE"
  echo ""

  # Lista backups recentes
  echo -e "${YELLOW}📋 Últimos 5 backups:${NC}"
  ls -lht "$BACKUP_DIR"/fayol_backup_*.sql.gz 2>/dev/null | head -5 || echo "   Nenhum backup encontrado"

  echo ""
  echo -e "${GREEN}✨ Backup concluído!${NC}"
else
  echo -e "${RED}❌ Erro ao criar backup!${NC}"
  exit 1
fi

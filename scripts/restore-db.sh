#!/bin/bash

# ============================================
# Script de Restauração do Banco de Dados Fayol
# ============================================

BACKUP_DIR=~/fayol-backups
DB_NAME="${DB_NAME:-fayol_production}"
DB_USER="${DB_USER:-fayol_user}"
DB_PASS="${DB_PASS}"
DB_HOST="${DB_HOST:-localhost}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Fayol Database Restore Script${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Verificar se senha foi fornecida
if [ -z "$DB_PASS" ]; then
  echo -e "${RED}Erro: DB_PASS não definida!${NC}"
  echo "Use: DB_PASS=sua-senha ./restore-db.sh [arquivo-backup]"
  exit 1
fi

# Listar backups disponíveis
echo -e "${YELLOW}Backups disponíveis:${NC}"
echo ""
ls -lht $BACKUP_DIR/fayol_*.sql.gz 2>/dev/null | nl
echo ""

# Verificar se arquivo foi fornecido
if [ -z "$1" ]; then
  echo -e "${YELLOW}Uso: ./restore-db.sh [arquivo-backup]${NC}"
  echo ""
  echo "Exemplo:"
  echo "  ./restore-db.sh $BACKUP_DIR/fayol_20250112_030000.sql.gz"
  echo ""
  exit 1
fi

BACKUP_FILE=$1

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Erro: Arquivo '$BACKUP_FILE' não encontrado!${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  ATENÇÃO: Este processo irá SOBRESCREVER o banco atual!${NC}"
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Backup: $BACKUP_FILE"
echo ""
read -p "Deseja continuar? (sim/não): " CONFIRM

if [ "$CONFIRM" != "sim" ]; then
  echo -e "${YELLOW}Operação cancelada.${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}Criando backup de segurança antes de restaurar...${NC}"
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > $BACKUP_DIR/fayol_pre_restore_$DATE.sql.gz
echo -e "${GREEN}✅ Backup de segurança criado: fayol_pre_restore_$DATE.sql.gz${NC}"

echo ""
echo -e "${YELLOW}Restaurando banco de dados...${NC}"

# Restaurar banco
gunzip -c "$BACKUP_FILE" | PGPASSWORD=$DB_PASS psql -U $DB_USER -h $DB_HOST $DB_NAME

# Verificar se restauração foi bem-sucedida
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Banco de dados restaurado com sucesso!${NC}"
  echo ""
  echo -e "${YELLOW}Execute migrations se necessário:${NC}"
  echo "  cd ~/fayol/apps/backend"
  echo "  pnpm prisma migrate deploy"
else
  echo ""
  echo -e "${RED}❌ Erro ao restaurar banco de dados!${NC}"
  echo ""
  echo -e "${YELLOW}Você pode restaurar o backup de segurança:${NC}"
  echo "  ./restore-db.sh $BACKUP_DIR/fayol_pre_restore_$DATE.sql.gz"
  exit 1
fi

echo ""
echo -e "${GREEN}✨ Processo concluído!${NC}"

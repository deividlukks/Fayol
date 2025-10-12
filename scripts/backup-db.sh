#!/bin/bash

# ============================================
# Script de Backup do Banco de Dados Fayol
# ============================================

BACKUP_DIR=~/fayol-backups
DATE=$(date +%Y%m%d_%H%M%S)
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
echo -e "${GREEN}  Fayol Database Backup Script${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Verificar se senha foi fornecida
if [ -z "$DB_PASS" ]; then
  echo -e "${RED}Erro: DB_PASS não definida!${NC}"
  echo "Use: DB_PASS=sua-senha ./backup-db.sh"
  exit 1
fi

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Iniciando backup do banco de dados...${NC}"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Data: $DATE"
echo ""

# Backup PostgreSQL
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > $BACKUP_DIR/fayol_$DATE.sql.gz

# Verificar se backup foi bem-sucedido
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h $BACKUP_DIR/fayol_$DATE.sql.gz | cut -f1)
  echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
  echo "Arquivo: fayol_$DATE.sql.gz"
  echo "Tamanho: $BACKUP_SIZE"
else
  echo -e "${RED}❌ Erro ao criar backup!${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Limpando backups antigos...${NC}"

# Manter apenas últimos 7 backups
TOTAL_BACKUPS=$(ls -1 $BACKUP_DIR/fayol_*.sql.gz 2>/dev/null | wc -l)
if [ $TOTAL_BACKUPS -gt 7 ]; then
  REMOVED=$(ls -t $BACKUP_DIR/fayol_*.sql.gz | tail -n +8 | xargs rm -f)
  REMOVED_COUNT=$((TOTAL_BACKUPS - 7))
  echo "Removidos $REMOVED_COUNT backup(s) antigo(s)"
else
  echo "Total de backups: $TOTAL_BACKUPS (mantendo todos)"
fi

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Lista de backups disponíveis:${NC}"
echo -e "${GREEN}=====================================${NC}"
ls -lht $BACKUP_DIR/fayol_*.sql.gz | head -7

echo ""
echo -e "${GREEN}✨ Processo concluído!${NC}"

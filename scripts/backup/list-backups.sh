#!/bin/bash
# ============================================
# Fayol - Listar Backups PostgreSQL
# ============================================

BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Cores
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}📋 Fayol - Backups PostgreSQL${NC}"
echo "================================================"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
  echo -e "${BLUE}ℹ️  Diretório de backups não existe: $BACKUP_DIR${NC}"
  exit 0
fi

# Lista backups automáticos (do container)
echo -e "${GREEN}🤖 Backups Automáticos:${NC}"
echo ""
if [ -d "$BACKUP_DIR/daily" ] || [ -d "$BACKUP_DIR/weekly" ] || [ -d "$BACKUP_DIR/monthly" ]; then
  echo "Daily:"
  ls -lht "$BACKUP_DIR/daily"/*.sql.gz 2>/dev/null | head -7 || echo "  Nenhum backup diário"
  echo ""
  echo "Weekly:"
  ls -lht "$BACKUP_DIR/weekly"/*.sql.gz 2>/dev/null | head -4 || echo "  Nenhum backup semanal"
  echo ""
  echo "Monthly:"
  ls -lht "$BACKUP_DIR/monthly"/*.sql.gz 2>/dev/null | head -6 || echo "  Nenhum backup mensal"
else
  ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10 || echo "  Nenhum backup automático"
fi

echo ""
echo -e "${GREEN}👤 Backups Manuais:${NC}"
echo ""
ls -lht "$BACKUP_DIR"/fayol_backup_*.sql.gz 2>/dev/null | head -10 || echo "  Nenhum backup manual"

echo ""
echo -e "${YELLOW}💾 Espaço em Disco:${NC}"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "  N/A"
echo ""

# Estatísticas
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/**/*.sql.gz 2>/dev/null | wc -l)
echo -e "${BLUE}Total de backups: $TOTAL_BACKUPS${NC}"

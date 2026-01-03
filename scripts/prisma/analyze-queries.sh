#!/bin/bash
# ============================================
# Fayol - Prisma Query Analyzer
# ============================================

set -e

# Cores
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📊 Fayol - Prisma Query Analyzer${NC}"
echo "================================================"
echo ""

LOG_FILE="${1:-prisma-queries.log}"

if [ ! -f "$LOG_FILE" ]; then
  echo -e "${RED}Arquivo de log não encontrado: $LOG_FILE${NC}"
  echo ""
  echo -e "${BLUE}Para capturar logs:${NC}"
  echo "  DEBUG=\"prisma:query\" pnpm run dev 2>&1 | tee prisma-queries.log"
  exit 1
fi

echo -e "${GREEN}Analisando: $LOG_FILE${NC}"
echo ""

# Queries mais executadas
echo -e "${YELLOW}📈 Top 10 Queries Mais Executadas:${NC}"
echo "================================================"
grep "SELECT" "$LOG_FILE" | \
  sed 's/.*prisma:query //' | \
  sort | uniq -c | sort -rn | head -10 | \
  nl -w2 -s'. '
echo ""

# Queries lentas (com duração)
echo -e "${YELLOW}🐌 Queries Lentas (se disponível):${NC}"
echo "================================================"
grep -E "duration.*ms" "$LOG_FILE" | head -10 || echo "Nenhuma informação de duração encontrada"
echo ""

# Contadores
TOTAL_QUERIES=$(grep -c "SELECT\|INSERT\|UPDATE\|DELETE" "$LOG_FILE" 2>/dev/null || echo "0")
TOTAL_SELECT=$(grep -c "SELECT" "$LOG_FILE" 2>/dev/null || echo "0")
TOTAL_INSERT=$(grep -c "INSERT" "$LOG_FILE" 2>/dev/null || echo "0")
TOTAL_UPDATE=$(grep -c "UPDATE" "$LOG_FILE" 2>/dev/null || echo "0")
TOTAL_DELETE=$(grep -c "DELETE" "$LOG_FILE" 2>/dev/null || echo "0")

echo -e "${YELLOW}📊 Estatísticas:${NC}"
echo "================================================"
echo -e "  Total de queries:   ${GREEN}$TOTAL_QUERIES${NC}"
echo -e "  SELECT:             ${BLUE}$TOTAL_SELECT${NC}"
echo -e "  INSERT:             ${GREEN}$TOTAL_INSERT${NC}"
echo -e "  UPDATE:             ${YELLOW}$TOTAL_UPDATE${NC}"
echo -e "  DELETE:             ${RED}$TOTAL_DELETE${NC}"
echo ""

# N+1 Detection (queries repetitivas em sequência)
echo -e "${YELLOW}⚠️  Possíveis N+1 Queries:${NC}"
echo "================================================"
grep "SELECT.*FROM.*WHERE" "$LOG_FILE" | \
  sed 's/.*prisma:query //' | \
  uniq -c | \
  awk '$1 > 5 {print "  " $1 "x vezes: " substr($0, index($0,$2))}' | \
  head -5 || echo "  Nenhum padrão N+1 detectado"
echo ""

echo -e "${GREEN}✅ Análise completa!${NC}"
echo ""
echo -e "${BLUE}Dicas para otimização:${NC}"
echo "  • Use 'include' para evitar N+1 queries"
echo "  • Considere adicionar índices para queries frequentes"
echo "  • Use 'select' para buscar apenas campos necessários"
echo "  • Implemente DataLoader para batch requests"
echo ""

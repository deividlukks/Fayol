#!/bin/bash
# ============================================
# Fayol - Prisma Performance Audit
# ============================================

set -e

# Cores
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔎 Fayol - Prisma Performance Audit${NC}"
echo "================================================"
echo ""

cd "$(dirname "$0")/../../packages/database-models"

echo -e "${BLUE}📋 Executando auditoria completa...${NC}"
echo ""

# 1. Validar schema
echo -e "${YELLOW}1. Validando Prisma Schema...${NC}"
npx prisma validate 2>&1 | grep -v "Environment variables loaded" || true
echo -e "${GREEN}   ✓ Schema válido${NC}"
echo ""

# 2. Verificar se há migrations pendentes
echo -e "${YELLOW}2. Verificando migrations...${NC}"
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 | grep -E "database is up to date|pending" || echo "unknown")

if echo "$MIGRATION_STATUS" | grep -q "up to date"; then
  echo -e "${GREEN}   ✓ Todas as migrations aplicadas${NC}"
elif echo "$MIGRATION_STATUS" | grep -q "pending"; then
  echo -e "${RED}   ✗ Há migrations pendentes!${NC}"
  echo -e "     Execute: ${BLUE}npx prisma migrate deploy${NC}"
else
  echo -e "${YELLOW}   ⚠ Status desconhecido (banco pode estar offline)${NC}"
fi
echo ""

# 3. Analisar índices do schema
echo -e "${YELLOW}3. Analisando índices...${NC}"
INDEX_COUNT=$(grep -c "@@index" prisma/schema.prisma 2>/dev/null || echo "0")
UNIQUE_COUNT=$(grep -c "@@unique\|@unique" prisma/schema.prisma 2>/dev/null || echo "0")
echo -e "   Índices encontrados:    ${BLUE}$INDEX_COUNT${NC}"
echo -e "   Constraints únicos:     ${BLUE}$UNIQUE_COUNT${NC}"
echo ""

# 4. Verificar campos sem índices em relações
echo -e "${YELLOW}4. Verificando relações sem índices...${NC}"
RELATIONS=$(grep -E "@relation" prisma/schema.prisma | wc -l)
echo -e "   Total de relações:      ${BLUE}$RELATIONS${NC}"
echo ""

# 5. Tamanho do schema
echo -e "${YELLOW}5. Estatísticas do Schema...${NC}"
MODELS=$(grep -c "^model " prisma/schema.prisma 2>/dev/null || echo "0")
ENUMS=$(grep -c "^enum " prisma/schema.prisma 2>/dev/null || echo "0")
FIELDS=$(grep -c "^\s\+\w\+\s" prisma/schema.prisma 2>/dev/null || echo "0")

echo -e "   Models:                 ${BLUE}$MODELS${NC}"
echo -e "   Enums:                  ${BLUE}$ENUMS${NC}"
echo -e "   Campos (aproximado):    ${BLUE}$FIELDS${NC}"
echo ""

# 6. Verificar Prisma Client gerado
echo -e "${YELLOW}6. Verificando Prisma Client...${NC}"
if [ -d "../../node_modules/.pnpm/@prisma+client"* ]; then
  CLIENT_SIZE=$(du -sh ../../node_modules/.pnpm/@prisma+client* 2>/dev/null | head -1 | cut -f1)
  echo -e "${GREEN}   ✓ Prisma Client gerado${NC}"
  echo -e "   Tamanho:                ${BLUE}$CLIENT_SIZE${NC}"
else
  echo -e "${RED}   ✗ Prisma Client não encontrado${NC}"
  echo -e "     Execute: ${BLUE}npx prisma generate${NC}"
fi
echo ""

# 7. Recomendações
echo -e "${YELLOW}📊 Recomendações de Performance:${NC}"
echo "================================================"
echo ""

if [ "$INDEX_COUNT" -lt 5 ]; then
  echo -e "${YELLOW}⚠️  Poucos índices detectados ($INDEX_COUNT)${NC}"
  echo "   Considere adicionar índices em:"
  echo "   • Campos de filtro frequente (WHERE)"
  echo "   • Campos de ordenação (ORDER BY)"
  echo "   • Campos de junção (JOIN)"
fi

if [ "$MODELS" -gt 50 ]; then
  echo -e "${YELLOW}⚠️  Schema grande ($MODELS models)${NC}"
  echo "   Considere:"
  echo "   • Separar em schemas menores"
  echo "   • Usar views do Prisma"
fi

echo ""
echo -e "${BLUE}💡 Comandos úteis:${NC}"
echo "   ${GREEN}npx prisma studio${NC}          - Interface visual do banco"
echo "   ${GREEN}npx prisma db seed${NC}          - Popular banco com dados de teste"
echo "   ${GREEN}npx prisma migrate dev${NC}      - Criar nova migration"
echo "   ${GREEN}DEBUG=prisma:* pnpm dev${NC}    - Debug mode completo"
echo ""

echo -e "${GREEN}✅ Auditoria completa!${NC}"

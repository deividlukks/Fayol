#!/bin/bash
# ============================================
# Fayol - Prisma Debug Mode
# ============================================

set -e

# Cores
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Fayol - Prisma Debug Mode${NC}"
echo "================================================"
echo ""

echo -e "${BLUE}Modo de Debug Disponíveis:${NC}"
echo ""
echo "  1. Query Logging            - Log todas as queries SQL"
echo "  2. Error Logging            - Log apenas erros"
echo "  3. Info Logging             - Log informações gerais"
echo "  4. Warn Logging             - Log warnings"
echo "  5. All Logging              - Log TUDO (query + info + warn + error)"
echo "  6. Performance Tracing      - Analisa performance das queries"
echo ""

read -p "Escolha uma opção (1-6): " OPTION

case $OPTION in
  1)
    echo -e "${GREEN}Ativando Query Logging...${NC}"
    export DEBUG="prisma:query"
    ;;
  2)
    echo -e "${GREEN}Ativando Error Logging...${NC}"
    export DEBUG="prisma:error"
    ;;
  3)
    echo -e "${GREEN}Ativando Info Logging...${NC}"
    export DEBUG="prisma:info"
    ;;
  4)
    echo -e "${GREEN}Ativando Warn Logging...${NC}"
    export DEBUG="prisma:warn"
    ;;
  5)
    echo -e "${GREEN}Ativando ALL Logging...${NC}"
    export DEBUG="prisma:*"
    ;;
  6)
    echo -e "${GREEN}Ativando Performance Tracing...${NC}"
    export DEBUG="prisma:engine"
    export PRISMA_SHOW_ALL_TRACES=1
    ;;
  *)
    echo -e "${RED}Opção inválida!${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${YELLOW}Iniciando aplicação com debug...${NC}"
echo ""
echo -e "${BLUE}Variáveis de ambiente ativas:${NC}"
env | grep -E "DEBUG|PRISMA" || echo "  Nenhuma"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
echo "================================================"
echo ""

# Inicia o backend com debug
cd ../../apps/backend
pnpm run dev

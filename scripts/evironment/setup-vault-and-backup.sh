#!/bin/bash
# ============================================
# Fayol - Setup Completo: Vault + Backup
# ============================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║          🚀 FAYOL - SETUP VAULT & BACKUP 🚀              ║
║                                                          ║
║  Configuração automática de:                             ║
║  • HashiCorp Vault (Secrets Management)                  ║
║  • Backup Automático PostgreSQL                          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Função para verificar se comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificar dependências
echo -e "${BLUE}🔍 Verificando dependências...${NC}"

if ! command_exists docker; then
  echo -e "${RED}❌ Docker não encontrado! Instale: https://docs.docker.com/get-docker/${NC}"
  exit 1
fi

if ! command_exists docker-compose; then
  echo -e "${RED}❌ Docker Compose não encontrado! Instale: https://docs.docker.com/compose/install/${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Todas as dependências instaladas${NC}"
echo ""

# Verificar .env
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
  if [ -f ".env.example" ]; then
    echo -e "${BLUE}📝 Copiando .env.example para .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
  else
    echo -e "${RED}❌ Nem .env nem .env.example encontrados!${NC}"
    exit 1
  fi
fi

# Carregar variáveis
source .env 2>/dev/null || true

echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ETAPA 1: Subir Infraestrutura${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""

# Subir serviços de infraestrutura
echo -e "${BLUE}🐳 Iniciando containers...${NC}"
docker-compose up -d postgres redis vault postgres-backup

echo ""
echo -e "${BLUE}⏳ Aguardando serviços ficarem saudáveis...${NC}"

# Aguardar postgres
for i in {1..30}; do
  if docker exec fayol_postgres pg_isready -U "${POSTGRES_USER:-fayol_admin}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL pronto!${NC}"
    break
  fi
  echo -e "   Aguardando PostgreSQL... ($i/30)"
  sleep 2
done

# Aguardar redis
for i in {1..20}; do
  if docker exec fayol_redis redis-cli -a "${REDIS_PASSWORD:-redis_secure_pass_123!}" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis pronto!${NC}"
    break
  fi
  echo -e "   Aguardando Redis... ($i/20)"
  sleep 1
done

# Aguardar vault
for i in {1..20}; do
  if curl -s http://localhost:${VAULT_PORT:-8200}/v1/sys/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Vault pronto!${NC}"
    break
  fi
  echo -e "   Aguardando Vault... ($i/20)"
  sleep 2
done

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ETAPA 2: Inicializar Vault${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""

# Executar script de inicialização do Vault
if [ -f "scripts/vault/init-vault.sh" ]; then
  echo -e "${BLUE}🔐 Configurando Vault...${NC}"
  chmod +x scripts/vault/init-vault.sh
  ./scripts/vault/init-vault.sh
else
  echo -e "${YELLOW}⚠️  Script init-vault.sh não encontrado, pulando...${NC}"
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ETAPA 3: Criar Backup Inicial${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo ""

# Criar diretório de backups
mkdir -p "${BACKUP_DIR:-./backups}"

# Criar primeiro backup
if [ -f "scripts/backup/backup-postgres.sh" ]; then
  echo -e "${BLUE}💾 Criando backup inicial...${NC}"
  chmod +x scripts/backup/backup-postgres.sh
  ./scripts/backup/backup-postgres.sh
else
  echo -e "${YELLOW}⚠️  Script backup-postgres.sh não encontrado, pulando...${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SETUP CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Resumo:${NC}"
echo ""
echo -e "  🔐 ${GREEN}Vault UI:${NC}"
echo -e "     http://localhost:${VAULT_PORT:-8200}/ui"
echo -e "     Token: ${VAULT_ROOT_TOKEN:-fayol-dev-root-token-CHANGE-IN-PROD}"
echo ""
echo -e "  🗄️  ${GREEN}Backup Automático:${NC}"
echo -e "     Frequência: Diário (01:00 AM)"
echo -e "     Retenção: ${BACKUP_KEEP_DAYS:-7} dias, ${BACKUP_KEEP_WEEKS:-4} semanas, ${BACKUP_KEEP_MONTHS:-6} meses"
echo -e "     Localização: Volume Docker 'postgres_backups'"
echo ""
echo -e "  💾 ${GREEN}Backup Manual:${NC}"
echo -e "     Diretório: ${BACKUP_DIR:-./backups}"
echo ""
echo -e "${BLUE}🔍 Verificar Status:${NC}"
echo -e "  docker-compose ps"
echo -e "  docker logs fayol_vault"
echo -e "  docker logs fayol_postgres_backup"
echo ""
echo -e "${BLUE}📚 Documentação:${NC}"
echo -e "  docs/VAULT_BACKUP_GUIDE.md"
echo -e "  scripts/README.md"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE (PRODUÇÃO):${NC}"
echo -e "  1. ${RED}Mudar VAULT_ROOT_TOKEN${NC} no .env"
echo -e "  2. Configurar Vault com storage persistente (não -dev)"
echo -e "  3. Habilitar TLS/HTTPS"
echo -e "  4. Configurar backup offsite (S3/GCS)"
echo ""

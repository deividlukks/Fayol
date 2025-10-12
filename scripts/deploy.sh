#!/bin/bash

# ============================================
# Script de Deploy Automático - Fayol
# ============================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR=~/fayol

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  🚀 Fayol Deploy Script${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Função para verificar se comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificar dependências
echo -e "${YELLOW}Verificando dependências...${NC}"

if ! command_exists node; then
  echo -e "${RED}❌ Node.js não instalado!${NC}"
  exit 1
fi

if ! command_exists pnpm; then
  echo -e "${YELLOW}⚠️  pnpm não encontrado. Instalando...${NC}"
  npm install -g pnpm
fi

if ! command_exists pm2; then
  echo -e "${YELLOW}⚠️  PM2 não encontrado. Instalando...${NC}"
  npm install -g pm2
fi

echo -e "${GREEN}✅ Dependências OK${NC}"
echo ""

# Navegar para diretório do projeto
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}❌ Diretório do projeto não encontrado: $PROJECT_DIR${NC}"
  exit 1
fi

cd $PROJECT_DIR
echo -e "${GREEN}📁 Diretório do projeto: $PROJECT_DIR${NC}"
echo ""

# Git pull (se for repositório git)
if [ -d ".git" ]; then
  echo -e "${YELLOW}Atualizando código do repositório...${NC}"
  git pull origin main

  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao atualizar código!${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Código atualizado${NC}"
  echo ""
fi

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
pnpm install

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro ao instalar dependências!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Build do projeto
echo -e "${YELLOW}Compilando projeto...${NC}"
pnpm build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro ao compilar projeto!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Projeto compilado${NC}"
echo ""

# Executar migrations
echo -e "${YELLOW}Executando migrations...${NC}"
cd apps/backend
pnpm prisma migrate deploy

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Erro ao executar migrations (continuando...)${NC}"
fi

echo -e "${GREEN}✅ Migrations executadas${NC}"
echo ""

# Voltar para raiz
cd $PROJECT_DIR

# Reiniciar aplicações com PM2
echo -e "${YELLOW}Reiniciando aplicações...${NC}"
echo ""

# Backend
echo -e "${BLUE}🔄 Backend...${NC}"
pm2 restart fayol-backend || pm2 start apps/backend/ecosystem.config.js --env production

# Admin Panel (se for modo servidor)
if pm2 list | grep -q "fayol-admin"; then
  echo -e "${BLUE}🔄 Admin Panel...${NC}"
  pm2 restart fayol-admin
fi

# AI Service
if pm2 list | grep -q "fayol-ai"; then
  echo -e "${BLUE}🔄 AI Service...${NC}"
  pm2 restart fayol-ai
fi

# Telegram Bot (se existir)
if pm2 list | grep -q "fayol-telegram-bot"; then
  echo -e "${BLUE}🔄 Telegram Bot...${NC}"
  pm2 restart fayol-telegram-bot
fi

echo ""
echo -e "${GREEN}✅ Aplicações reiniciadas${NC}"
echo ""

# Salvar configuração PM2
pm2 save

# Status final
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  📊 Status das Aplicações${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
pm2 status

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  ✨ Deploy Concluído!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "  pm2 logs              # Ver logs de todas as aplicações"
echo "  pm2 logs fayol-backend # Ver logs do backend"
echo "  pm2 monit             # Monitorar CPU/RAM"
echo "  pm2 restart all       # Reiniciar tudo"
echo ""

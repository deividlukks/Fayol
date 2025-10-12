# 🚀 Projeto Fayol - Gestor Financeiro Inteligente

Bem-vindo à documentação oficial do Projeto Fayol. Este sistema é um monorepo que integra um backend robusto, um painel administrativo e bots para automação, com o objetivo de oferecer uma gestão financeira pessoal e inteligente.

---

### 📚 Índice

* [Visão Geral do Projeto](#-visão-geral-do-projeto)
* [Arquitetura do Sistema](#-arquitetura-do-sistema)
* [Guia de Instalação](#-guia-de-instalação)
* [Referência da API](#-referência-da-api)
* [Guia de Desenvolvimento](#-guia-de-desenvolvimento)
* [Erros Comuns (Backend)](#-erros-comuns-backend)
* [Como Contribuir](#️-como-contribuir)

---

## 🗺️ Visão Geral do Projeto

*(Aqui você pode adicionar uma descrição mais detalhada da visão geral do projeto. Explique o problema que ele resolve, o público-alvo e os principais recursos. Você também pode mencionar que a documentação completa está na pasta `/docs`.)*

## 🏗️ Arquitetura do Sistema

*(Nesta seção, descreva a arquitetura do seu monorepo. Fale sobre como o backend, o painel administrativo e os bots se comunicam. Um diagrama seria uma ótima adição aqui!)*

## ⚙️ Guia de Instalação

*(Coloque aqui os pré-requisitos e o passo a passo para que um novo desenvolvedor consiga configurar e executar o projeto em sua máquina local. Por exemplo: clonar o repositório, instalar dependências, configurar variáveis de ambiente, etc.)*

## 📖 Referência da API

*(Descreva os principais endpoints da sua API. Detalhe os métodos (GET, POST, etc.), os parâmetros esperados e os formatos de resposta. Um link para uma documentação mais completa da API, como um Swagger ou Postman, seria perfeito aqui.)*

## 💻 Guia de Desenvolvimento

*(Explique as convenções de código, a estrutura de pastas, como rodar os testes e o fluxo de trabalho para criar novas funcionalidades (ex: git flow). Esta seção é crucial para quem deseja contribuir.)*

## 🐛 Erros Comuns (Backend)

*(Liste alguns dos problemas ou erros mais frequentes que um desenvolvedor pode encontrar ao trabalhar no backend e forneça as soluções ou os passos para depurá-los.)*

## 🛠️ Como Contribuir

Para contribuir, por favor, leia o nosso **[Guia de Desenvolvimento](#-guia-de-desenvolvimento)**. Lá você encontrará todas as informações sobre como submeter suas alterações, nosso padrão de commits e o processo de code review.

---

## 📚 Documentação Completa

### Documentação Principal
- [📋 Visão Geral do Projeto](docs/00_VISAO_GERAL.md)
- [🏗️ Arquitetura do Sistema](docs/01_ARQUITETURA.md)
- [⚙️ Guia de Instalação](docs/02_GUIA_INSTALACAO.md)
- [📖 Referência da API](docs/03_API_REFERENCE.md)
- [💻 Guia de Desenvolvimento](docs/04_DESENVOLVIMENTO.md)

### Deploy & Produção
- [🚀 Deploy Rápido em cPanel](docs/DEPLOY_RAPIDO.md) - Guia condensado (45-60min)
- [📖 Guia Completo de Produção](docs/GUIA_PRODUCAO_CPANEL.md) - Documentação detalhada
- [❓ FAQ & Troubleshooting](docs/FAQ_TROUBLESHOOTING.md) - Soluções para problemas comuns

### Scripts Úteis
```bash
# Deploy automático
./scripts/deploy.sh

# Backup do banco de dados
DB_PASS=senha ./scripts/backup-db.sh

# Restaurar backup
DB_PASS=senha ./scripts/restore-db.sh [arquivo]

# Verificar saúde do sistema
./scripts/health-check.sh
```

---

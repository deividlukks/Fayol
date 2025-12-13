<#
.SYNOPSIS
    Fayol Dev Mode - Modo Híbrido Inteligente
.DESCRIPTION
    1. Sobe APENAS a infraestrutura no Docker (BD, Redis, AI, Bot).
    2. Garante que o Backend e WebApp no Docker fiquem PARADOS para libertar portas.
    3. Inicia o `pnpm dev` localmente para desenvolvimento ágil.
#>

$ErrorActionPreference = "Stop"

function Write-Step ($Msg) { Write-Host "`n🔵 $Msg" -ForegroundColor Cyan }
function Write-Success ($Msg) { Write-Host "   ✅ $Msg" -ForegroundColor Green }

Clear-Host
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   🚀 FAYOL - MODO DESENVOLVIMENTO" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# 1. Subir Infraestrutura (Background)
Write-Step "A iniciar Infraestrutura (Docker)..."

# Iniciamos os serviços de suporte.
# O bot e o Python AI podem ficar no Docker pois não conflitam com portas padrão de dev (3000/3333)
# ou se conflitam (AI na 8000), assumimos que você não vai editar o Python agora.
docker compose up -d postgres redis python-ai pgadmin telegram-bot

# 2. Libertar Portas
Write-Step "A garantir portas livres (3000 e 3333)..."
# Forçamos a parada dos containers de aplicação caso estejam rodando
docker compose stop backend web-app telegram-bot

Write-Success "Infraestrutura (BD, Redis, IA) rodando no Docker."
Write-Success "Portas 3333 (API) e 3000 (Web) liberadas para uso local."

# 3. Iniciar Aplicação Local
Write-Step "A iniciar Aplicação Local (Hot-Reload)..."
Write-Host "   (Pressione CTRL+C para parar)" -ForegroundColor Gray
Write-Host ""

# Inicia o modo dev do TurboRepo
pnpm dev
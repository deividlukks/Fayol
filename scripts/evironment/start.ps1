<#
.SYNOPSIS
    Script de Inicialização Automatizada do Ambiente Fayol
.DESCRIPTION
    Este script deve ser salvo na pasta /scripts. Ele ajusta o contexto para a raiz
    do projeto automaticamente antes de rodar os comandos.
.PARAMETER SkipBuild
    Pula o build dos serviços Docker (usa imagens existentes)
.PARAMETER SkipMigrations
    Pula a execução de migrations do Prisma
.PARAMETER Fast
    Modo rápido: Pula build e migrations
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipMigrations,
    [switch]$Fast
)

# Se Fast mode, ativa os outros skips
if ($Fast) {
    $SkipBuild = $true
    $SkipMigrations = $true
}

$ErrorActionPreference = "Stop"

# --- AJUSTE DE DIRETÓRIO ---
$ScriptLocation = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ScriptsFolder = Split-Path -Parent $ScriptLocation
$ProjectRoot = Split-Path -Parent $ScriptsFolder
Set-Location $ProjectRoot
Write-Host "Executando no diretório: $ProjectRoot" -ForegroundColor Gray

# --- FUNÇÕES AUXILIARES ---
function Write-Step {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "[$timestamp] >>> $Message" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Cyan
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Check-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Log "Erro: $Name não está instalado ou não está no PATH." "ERROR"
        exit 1
    }
}

function Test-DockerRunning {
    try {
        docker ps 2>&1 | Out-Null
        return $true
    } catch {
        return $false
    }
}

# --- TRATAMENTO DE ERROS ---
trap {
    Write-Log "❌ Erro fatal: $_" "ERROR"
    Write-Log "Limpando containers..." "WARN"
    docker-compose down 2>$null
    exit 1
}

# --- 1. Verificações Iniciais ---
Write-Step "1. Verificando Pré-requisitos"
Check-Command "pnpm"
Check-Command "node"

# Verificar se PostgreSQL nativo está rodando
Write-Host "`n🐘 Verificando PostgreSQL nativo..." -ForegroundColor Cyan
try {
    $pgService = Get-Service -Name "postgresql-x64-18" -ErrorAction Stop
    if ($pgService.Status -eq "Running") {
        Write-Log "PostgreSQL 18.1 está rodando (nativo)" "SUCCESS"
    } else {
        Write-Log "PostgreSQL encontrado mas não está rodando. Iniciando..." "WARN"
        Start-Service -Name "postgresql-x64-18"
        Start-Sleep -Seconds 3
        Write-Log "PostgreSQL iniciado" "SUCCESS"
    }
} catch {
    Write-Log "PostgreSQL 18.1 não encontrado!" "ERROR"
    Write-Log "Instale o PostgreSQL 18.1 ou configure o serviço." "ERROR"
    Write-Host ""
    Write-Host "Localização esperada: C:\Program Files\PostgreSQL\18" -ForegroundColor Yellow
    Write-Host "Serviço esperado: postgresql-x64-18" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Verificar se Docker está rodando (opcional para alguns serviços)
Write-Host "`n🐳 Verificando Docker..." -ForegroundColor Cyan
if (-not (Test-DockerRunning)) {
    Write-Log "Docker daemon não está rodando!" "WARN"
    Write-Log "Alguns serviços (Redis, AI, BI) não estarão disponíveis." "WARN"
    Write-Log "Você pode continuar para desenvolvimento local sem Docker." "INFO"
    Write-Host ""
    Write-Host "Deseja continuar sem Docker? (S/N): " -ForegroundColor Yellow -NoNewline
    $continue = Read-Host
    if ($continue -ne "S" -and $continue -ne "s") {
        Write-Log "Operação cancelada. Inicie o Docker e tente novamente." "ERROR"
        exit 1
    }
    $skipDocker = $true
} else {
    Write-Log "Docker está rodando" "SUCCESS"
    $skipDocker = $false
}

Check-Command "docker"

# Verificar arquivo .env
if (-not (Test-Path ".env")) {
    Write-Log "Arquivo .env não encontrado. Criando a partir de .env.example..." "WARN"
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" -Destination ".env"
        Write-Log ".env criado com sucesso" "SUCCESS"
    } else {
        Write-Log ".env.example não encontrado!" "ERROR"
        exit 1
    }
}

# --- 2. Instalação de Dependências ---
Write-Step "2. Instalando Dependências"
Write-Log "Sincronizando pnpm-lock.yaml..." "INFO"
pnpm install

# --- 3. Infraestrutura de Dados ---
Write-Step "3. Iniciando Infraestrutura"

if (-not $skipDocker) {
    Write-Log "Subindo Redis e outros serviços de infraestrutura..." "INFO"
    docker-compose up -d redis vault

    Write-Log "Aguardando serviços ficarem saudáveis (healthcheck)..." "INFO"
    $maxAttempts = 30
    $attempt = 0
    $healthy = $false

    while ($attempt -lt $maxAttempts -and -not $healthy) {
        $attempt++
        Start-Sleep -Seconds 2

        $redisHealth = docker inspect --format='{{.State.Health.Status}}' fayol_redis 2>$null

        if ($redisHealth -eq "healthy") {
            $healthy = $true
            Write-Log "Infraestrutura Docker pronta!" "SUCCESS"
        } else {
            Write-Host "." -NoNewline
        }
    }

    if (-not $healthy) {
        Write-Log "Timeout aguardando infraestrutura ficar saudável" "WARN"
        Write-Log "Continuando mesmo assim..." "INFO"
    }
} else {
    Write-Log "Docker desabilitado - pulando Redis e Vault" "WARN"
}

# --- 4. Configuração do Prisma ---
Write-Step "4. Configurando Banco de Dados (Prisma 7)"

Write-Log "Gerando Prisma Client..." "INFO"
pnpm --filter @fayol/database-models run generate

if (-not $SkipMigrations) {
    Write-Log "Aplicando Migrações..." "INFO"
    try {
        pnpm --filter @fayol/database-models run migrate:dev
        Write-Log "Migrations aplicadas com sucesso" "SUCCESS"
    } catch {
        Write-Log "Erro ao aplicar migrations: $_" "ERROR"
        throw
    }

    Write-Log "Populando Banco de Dados (Seed)..." "INFO"
    try {
        pnpm --filter @fayol/database-models run seed
        Write-Log "Seed concluído com sucesso" "SUCCESS"
    } catch {
        Write-Log "Erro ao executar seed (ignorando): $_" "WARN"
    }
} else {
    Write-Log "Migrations puladas (--SkipMigrations)" "WARN"
}

# --- 5. Build e Start dos Serviços ---
if (-not $skipDocker) {
    if (-not $SkipBuild) {
        Write-Step "5. Construindo e Iniciando Serviços Docker"

        $services = @(
            @{Name="python-ai"; DisplayName="Serviço de IA (Python)"},
            @{Name="bi-reports"; DisplayName="Serviço de Relatórios (BI)"},
            @{Name="backend"; DisplayName="Backend (NestJS)"},
            @{Name="telegram-bot"; DisplayName="Telegram Bot"},
            @{Name="web-app"; DisplayName="Frontend Web"},
            @{Name="admin-panel"; DisplayName="Admin Panel"}
        )

        foreach ($service in $services) {
            Write-Log "Construindo $($service.DisplayName)..." "INFO"
            docker-compose build $service.Name

            Write-Log "Iniciando $($service.DisplayName)..." "INFO"
            docker-compose up -d $service.Name
        }
    } else {
        Write-Step "5. Iniciando Serviços Docker (sem build)"
        Write-Log "Build pulado (--SkipBuild)" "WARN"
        docker-compose up -d
    }
} else {
    Write-Step "5. Modo sem Docker"
    Write-Log "Serviços Docker desabilitados" "WARN"
    Write-Log "Você pode rodar localmente:" "INFO"
    Write-Host "  - Backend: cd apps/backend && pnpm run dev" -ForegroundColor Gray
    Write-Host "  - Web App: cd apps/web-app && pnpm run dev" -ForegroundColor Gray
    Write-Host "  - Admin Panel: cd apps/admin-panel && pnpm run dev" -ForegroundColor Gray
}

# --- 6. Verificação Final ---
Write-Step "6. Verificação de Saúde dos Serviços"
Start-Sleep -Seconds 3

if (-not $skipDocker) {
    docker-compose ps
}

# --- Finalização ---
Write-Step "AMBIENTE INICIADO COM SUCESSO!"
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 SERVIÇOS DISPONÍVEIS" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Log "🗄️  PostgreSQL 18.1:  localhost:5432 (NATIVO)" "SUCCESS"
Write-Log "    Database: fayol_db | User: fayol" "INFO"
Write-Log "    Prisma Studio: pnpm db:studio" "INFO"
Write-Host ""

if (-not $skipDocker) {
    Write-Log "🌐 Frontend Web:     http://localhost:3000" "SUCCESS"
    Write-Log "🛡️  Admin Panel:      http://localhost:3001" "SUCCESS"
    Write-Log "🔧 Backend API:      http://localhost:3333" "SUCCESS"
    Write-Log "📚 API Docs:         http://localhost:3333/api/docs" "SUCCESS"
    Write-Log "🤖 Python AI:        http://localhost:8000" "INFO"
    Write-Log "📊 BI Reports:       http://localhost:8001" "INFO"
    Write-Host ""
    Write-Log "Para ver logs: docker-compose logs -f [service-name]" "INFO"
    Write-Log "Para parar Docker: docker-compose down" "INFO"
} else {
    Write-Log "🌐 Modo Local (sem Docker):" "INFO"
    Write-Host "   pnpm dev                    # Todos os apps" -ForegroundColor Gray
    Write-Host "   pnpm dev:web                # Apenas web-app" -ForegroundColor Gray
    Write-Host "   pnpm dev:admin              # Apenas admin-panel" -ForegroundColor Gray
    Write-Host "   pnpm dev:both               # Web + Admin" -ForegroundColor Gray
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

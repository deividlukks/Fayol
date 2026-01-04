<#
.SYNOPSIS
    FAYOL NUKE PROTOCOL - Destruição Total do Ambiente
.DESCRIPTION
    Apaga TUDO: Containers, Volumes, Redes, Imagens, Cache, Node_modules, Dist, Migrations.
    Deixa o repositório como se tivesse acabado de ser clonado.
.PARAMETER SkipConfirmation
    Pula a confirmação (usado quando chamado por outros scripts)
.PARAMETER DockerOnly
    Limpa apenas Docker (containers, volumes, imagens do Fayol)
.PARAMETER NodeOnly
    Limpa apenas node_modules, dist, builds
.PARAMETER KeepData
    Mantém volumes do Docker (preserva dados do banco)
.PARAMETER BackupEnv
    Faz backup do arquivo .env antes de limpar
#>

param(
    [switch]$SkipConfirmation,
    [switch]$DockerOnly,
    [switch]$NodeOnly,
    [switch]$KeepData,
    [switch]$BackupEnv
)

$ErrorActionPreference = "Continue" # Continua mesmo se falhar ao tentar apagar algo que já não existe

# --- AJUSTE DE DIRETÓRIO ---
$ScriptLocation = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ScriptsRoot = Split-Path -Parent $ScriptLocation
$ProjectRoot = Split-Path -Parent $ScriptsRoot
Set-Location $ProjectRoot

Write-Host "`n☢️  PROTOCOLO NUKE - DESTRUIÇÃO TOTAL" -ForegroundColor Red
Write-Host "   Alvo: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

if (-not $SkipConfirmation) {
    Write-Host "⚠️  ATENÇÃO: Esta é a operação MAIS DESTRUTIVA!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Esta operação irá:" -ForegroundColor Yellow

    if ($DockerOnly) {
        Write-Host "   1. Parar e remover containers Docker do Fayol" -ForegroundColor Yellow
        if (-not $KeepData) {
            Write-Host "   2. Remover volumes Docker (Redis, AI models, Vault)" -ForegroundColor Yellow
        }
        Write-Host "   3. Remover imagens Docker do Fayol" -ForegroundColor Yellow
    } elseif ($NodeOnly) {
        Write-Host "   1. Deletar node_modules, dist, builds" -ForegroundColor Yellow
        Write-Host "   2. Deletar arquivos de lock e cache" -ForegroundColor Yellow
    } else {
        Write-Host "   1. Parar e remover TODOS containers Docker do Fayol" -ForegroundColor Yellow
        if (-not $KeepData) {
            Write-Host "   2. Remover TODOS volumes Docker (Redis, AI models, Vault)" -ForegroundColor Yellow
        }
        Write-Host "   3. Remover TODAS imagens Docker do Fayol" -ForegroundColor Yellow
        Write-Host "   4. Matar TODOS processos Node" -ForegroundColor Yellow
        Write-Host "   5. Deletar TODOS node_modules, dist, builds" -ForegroundColor Yellow
        Write-Host "   6. Limpar TODOS arquivos de cache" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "ℹ️  PostgreSQL NATIVO NÃO será afetado (roda fora do Docker)" -ForegroundColor Cyan
    if (-not $KeepData) {
        Write-Host "⚠️  Volumes Docker serão removidos (Redis, AI, Vault)" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Volumes Docker serão preservados (--KeepData)" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Digite 'NUKE' para confirmar (qualquer outra coisa cancela):" -ForegroundColor Cyan -NoNewline
    $confirmation = Read-Host " "

    if ($confirmation -cne 'NUKE') {
        Write-Host ""
        Write-Host "❌ Operação cancelada. Nada foi modificado." -ForegroundColor Green
        Write-Host ""
        exit 0
    }

    Write-Host ""
    Write-Host "☢️  Confirmação recebida. Iniciando protocolo..." -ForegroundColor Red
    Write-Host ""
}

# Backup do .env se solicitado
if ($BackupEnv -and (Test-Path ".env")) {
    $backupName = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item ".env" $backupName
    Write-Host "✓ Backup do .env criado: $backupName" -ForegroundColor Green
}

# Medir espaço antes
$beforeSize = 0
try {
    $beforeSize = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
} catch {
    Write-Host "⚠️  Não foi possível medir espaço inicial" -ForegroundColor Yellow
}

# --- LIMPEZA ---
$stepNum = 1

if (-not $NodeOnly) {
    # Limpar Docker
    Write-Host "`n[$stepNum/6] 🐳 Limpando Docker..." -ForegroundColor Cyan
    $stepNum++

    # Parar containers
    docker compose down --remove-orphans 2>$null

    # Remover volumes se não for KeepData
    if (-not $KeepData) {
        docker compose down --volumes 2>$null
        Write-Host "   ✓ Volumes removidos" -ForegroundColor Green
    } else {
        Write-Host "   ✓ Volumes preservados (--KeepData)" -ForegroundColor Yellow
    }

    # Remover apenas imagens do Fayol (não afeta outros projetos)
    Write-Host "   Removendo imagens Docker do Fayol..." -ForegroundColor Gray
    docker images --format "{{.Repository}}:{{.Tag}}\t{{.ID}}" | Where-Object { $_ -like "*fayol*" } | ForEach-Object {
        $imageId = ($_ -split '\t')[1]
        docker rmi $imageId -f 2>$null
    }

    # Limpar networks órfãs
    docker network prune -f 2>$null

    Write-Host "   ✓ Docker limpo" -ForegroundColor Green
}

if (-not $DockerOnly) {
    # Matar processos Node
    Write-Host "`n[$stepNum/6] 🔪 Matando processos Node..." -ForegroundColor Cyan
    $stepNum++
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Write-Host "   ✓ $($nodeProcesses.Count) processo(s) Node terminado(s)" -ForegroundColor Green
    } else {
        Write-Host "   ✓ Nenhum processo Node encontrado" -ForegroundColor Gray
    }

    # Limpar node_modules, dist, builds
    Write-Host "`n[$stepNum/6] 🗑️  Apagando node_modules, dist, builds..." -ForegroundColor Cyan
    $stepNum++
    $dirs_to_nuke = @("node_modules", "dist", "build", ".turbo", ".next", ".nest", "coverage", ".nyc_output", ".swc")

    $deletedDirs = 0
    Get-ChildItem -Path . -Recurse -Directory -Force -ErrorAction SilentlyContinue | Where-Object {
        $dirs_to_nuke -contains $_.Name
    } | ForEach-Object {
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $deletedDirs++
    }
    Write-Host "   ✓ $deletedDirs diretório(s) removido(s)" -ForegroundColor Green

    # Limpar Prisma Client gerado
    Write-Host "   Removendo Prisma Client gerado..." -ForegroundColor Gray
    $prismaClientPath = "packages\database-models\node_modules\.prisma"
    if (Test-Path $prismaClientPath) {
        Remove-Item $prismaClientPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✓ Prisma Client removido" -ForegroundColor Green
    }

    # Limpar arquivos de lock e cache
    Write-Host "`n[$stepNum/6] 🧹 Apagando arquivos de lock e cache..." -ForegroundColor Cyan
    $stepNum++
    $files_to_nuke = @("pnpm-lock.yaml", "yarn.lock", "package-lock.json", ".eslintcache", "tsconfig.tsbuildinfo")

    $deletedFiles = 0
    Get-ChildItem -Path . -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
        $files_to_nuke -contains $_.Name
    } | ForEach-Object {
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
        $deletedFiles++
    }
    Write-Host "   ✓ $deletedFiles arquivo(s) removido(s)" -ForegroundColor Green

    # Migrations do Prisma são PRESERVADAS (necessárias para o PostgreSQL nativo)
    Write-Host "`n[$stepNum/6] 📊 Migrations do Prisma..." -ForegroundColor Cyan
    $stepNum++
    Write-Host "   ✓ Migrations preservadas (necessárias para o banco nativo)" -ForegroundColor Yellow

    # Resetar Husky
    Write-Host "`n[$stepNum/6] 🐶 Resetando Husky..." -ForegroundColor Cyan
    $stepNum++
    if (Test-Path ".husky\_") {
        Remove-Item ".husky\_" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✓ Husky resetado" -ForegroundColor Green
    } else {
        Write-Host "   ✓ Husky já estava limpo" -ForegroundColor Gray
    }
}

# Medir espaço depois
$afterSize = 0
try {
    $afterSize = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $freedSpace = [math]::Round(($beforeSize - $afterSize) / 1GB, 2)

    if ($freedSpace -gt 0) {
        Write-Host "`n💾 Espaço liberado: $freedSpace GB" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Não foi possível calcular espaço liberado" -ForegroundColor Yellow
}

Write-Host "`n✨ LIMPEZA COMPLETA! O TERRENO ESTÁ LIMPO." -ForegroundColor Green
Write-Host ""
Write-Host "Para reiniciar o ambiente:" -ForegroundColor Yellow
Write-Host "  1. .\scripts\start.ps1" -ForegroundColor White
Write-Host ""

if ($BackupEnv -and (Test-Path ".env.backup.*")) {
    Write-Host "📦 Backups do .env disponíveis:" -ForegroundColor Cyan
    Get-ChildItem ".env.backup.*" | ForEach-Object {
        Write-Host "   - $($_.Name)" -ForegroundColor Gray
    }
    Write-Host ""
}

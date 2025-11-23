<#
.SYNOPSIS
    Hard Reset V3.1 - Reset TOTAL (Ambiente + Histórico de Banco + Dependências Nativas).
.DESCRIPTION
    1. Mata processos Node.
    2. Limpa Docker.
    3. Apaga node_modules, caches E a pasta de migrações do Prisma.
    4. Reinstala e Recompila dependências (Correção bcrypt).
    5. Recria o banco com uma única migração limpa.
#>

$ErrorActionPreference = "Stop"

# Funções renomeadas para usar o verbo aprovado 'Write'
function Write-LogInfo ($Msg) { Write-Host "`n🔵 $Msg" -ForegroundColor Cyan }
function Write-LogSuccess ($Msg) { Write-Host "   ✅ $Msg" -ForegroundColor Green }
function Write-LogWarn ($Msg) { Write-Host "   ⚠️  $Msg" -ForegroundColor Yellow }
function Write-LogError ($Msg) { Write-Host "   ❌ $Msg" -ForegroundColor Red }

Clear-Host
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   🧹 FAYOL - HARD RESET (V3.1)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# 1. Matar Processos Node
Write-LogInfo "[1/7] Encerrando processos Node..."
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-LogSuccess "Processos limpos."
} catch {
    Write-LogWarn "Nenhum processo Node estava rodando."
}

# 2. Limpeza do Docker
Write-LogInfo "[2/7] Resetando Docker..."
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    try {
        docker-compose down -v --remove-orphans
        Write-LogSuccess "Docker limpo."
    } catch {
        Write-LogWarn "Docker inacessível (verifique se o Desktop está rodando)."
    }
}

# 3. Limpeza de Arquivos e Migrações
Write-LogInfo "[3/7] Removendo lixo e histórico de migrações..."
$foldersToRemove = @("node_modules", "dist", ".turbo", ".next", "build", "coverage", ".nyc_output", ".prisma")
$migrationFolder = "packages/database-models/prisma/migrations"

# Remove pastas padrão
Get-ChildItem -Path . -Include $foldersToRemove -Recurse -Directory | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove pasta de migrações especificamente
if (Test-Path $migrationFolder) {
    Write-Host "   - Apagando histórico de migrações ($migrationFolder)..." -ForegroundColor DarkGray
    Remove-Item $migrationFolder -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove arquivos de lock
$filesToRemove = @("pnpm-lock.yaml", "yarn.lock", "package-lock.json", ".eslintcache", "*.tsbuildinfo")
Get-ChildItem -Path . -Include $filesToRemove -Recurse -File | ForEach-Object {
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
}
Write-LogSuccess "Arquivos removidos."

# 4. Reinstalação
Write-LogInfo "[4/7] Instalando dependências..."
pnpm install
if ($LASTEXITCODE -ne 0) { Write-LogError "Falha no install."; exit 1 }

# 5. Rebuild de Nativos
Write-LogInfo "[5/7] Recompilando módulos nativos (bcrypt)..."
pnpm rebuild
if ($LASTEXITCODE -ne 0) { Write-LogWarn "Aviso: Falha no rebuild, mas vamos tentar prosseguir."; }
else { Write-LogSuccess "Módulos nativos recompilados." }

# 6. Infraestrutura
Write-LogInfo "[6/7] Subindo Banco de Dados..."
docker-compose up -d
if ($LASTEXITCODE -ne 0) { Write-LogError "Falha no Docker."; exit 1 }

Write-Host "   ⏳ Aguardando DB iniciar (15s)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 7. Prisma (Nova Migração Inicial)
Write-LogInfo "[7/7] Criando nova estrutura do banco (Migrate)..."

Write-Host "   - Gerando Cliente..." -ForegroundColor Gray
pnpm --filter @fayol/database-models run generate

Write-Host "   - Criando Schema e Seed..." -ForegroundColor Gray
pnpm --filter @fayol/database-models exec prisma migrate dev --name hard_reset_init

if ($LASTEXITCODE -ne 0) {
    Write-LogError "Falha na migração."
    exit 1
}

Write-Host "`n🎉 AMBIENTE LIMPO E RECONSTRUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Pode rodar: pnpm dev" -ForegroundColor Cyan
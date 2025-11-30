<#
.SYNOPSIS
    FAYOL NUKE PROTOCOL - Destruição Total do Ambiente
.DESCRIPTION
    Apaga TUDO: Containers, Volumes, Redes, Imagens, Cache, Node_modules, Dist, Migrations.
    Deixa o repositório como se tivesse acabado de ser clonado.
#>

$ErrorActionPreference = "Continue" # Continua mesmo se falhar ao tentar apagar algo que já não existe

Write-Host "`n☢️  INICIANDO PROTOCOLO NUKE..." -ForegroundColor Red
Write-Host "⚠️  ISSO VAI APAGAR TODO O BANCO DE DADOS E DEPENDÊNCIAS!" -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 1. Parar e Remover Docker (Forçado)
Write-Host "`n[1/6] 🐳 Exterminando Docker..." -ForegroundColor Cyan
docker compose down --volumes --rmi all --remove-orphans 2>$null
docker system prune -a --volumes -f 2>$null # Limpeza profunda do sistema Docker

# 2. Matar Processos Node Fantasmas
Write-Host "`n[2/6] 🔪 Matando processos Node..." -ForegroundColor Cyan
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 3. Limpar Dependências e Builds (Recursivo)
Write-Host "`n[3/6] 🗑️  Apagando node_modules, dist, builds..." -ForegroundColor Cyan
$dirs_to_nuke = @("node_modules", "dist", "build", ".turbo", ".next", ".nest", "coverage", ".nyc_output", ".swc", ".prisma")

# Procura e deleta pastas
Get-ChildItem -Path . -Recurse -Directory -Force -ErrorAction SilentlyContinue | Where-Object { 
    $dirs_to_nuke -contains $_.Name 
} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 4. Limpar Arquivos de Lock e Cache
Write-Host "`n[4/6] 🧹 Apagando arquivos de lock e cache..." -ForegroundColor Cyan
$files_to_nuke = @("pnpm-lock.yaml", "yarn.lock", "package-lock.json", ".eslintcache", "tsconfig.tsbuildinfo")
Get-ChildItem -Path . -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { 
    $files_to_nuke -contains $_.Name 
} | Remove-Item -Force -ErrorAction SilentlyContinue

# 5. Resetar Migrations do Prisma
Write-Host "`n[5/6] 💥 Resetando Migrations do Prisma..." -ForegroundColor Cyan
$migrations_path = "packages/database-models/prisma/migrations"
if (Test-Path $migrations_path) {
    Remove-Item $migrations_path -Recurse -Force
    Write-Host "   Migrations apagadas." -ForegroundColor Green
}

# 6. Resetar Husky
Write-Host "`n[6/6] 🐶 Resetando Husky..." -ForegroundColor Cyan
if (Test-Path ".husky/_") {
    Remove-Item ".husky/_" -Recurse -Force
}

Write-Host "`n✨ LIMPEZA COMPLETA! O TERRENO ESTÁ LIMPO." -ForegroundColor Green
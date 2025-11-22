<#
.SYNOPSIS
    Limpa todo o ambiente de desenvolvimento (Docker, Dependências, Builds) e reinstala do zero.
.DESCRIPTION
    Use este script quando o ambiente estiver instável. Ele remove node_modules, caches,
    volumes do docker e reinstala tudo. Apenas o código fonte é preservado.
#>

$ErrorActionPreference = "Stop"

Write-Host "`n🧹 INICIANDO HARD RESET DO PROJETO FAYOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Limpeza do Docker
Write-Host "`n🐳 [1/5] Parando containers e removendo volumes..." -ForegroundColor Yellow
try {
    docker-compose down -v --remove-orphans
    Write-Host "   ✅ Docker limpo." -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Aviso: Não foi possível limpar o Docker (talvez não estivesse rodando)." -ForegroundColor Gray
}

# 2. Limpeza de Arquivos
Write-Host "`n🗑️  [2/5] Removendo lixo (node_modules, dist, caches)..." -ForegroundColor Yellow
$foldersToRemove = @("node_modules", "dist", ".turbo", ".next", "build", "coverage", ".prisma")
$filesToRemove = @("pnpm-lock.yaml", "yarn.lock", "package-lock.json")

# Remove pastas recursivamente
Get-ChildItem -Path . -Include $foldersToRemove -Recurse -Directory | ForEach-Object {
    Write-Host "   - Removendo: $($_.FullName)" -ForegroundColor Gray
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove arquivos de lock na raiz
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Write-Host "   - Removendo: $file" -ForegroundColor Gray
        Remove-Item $file -Force
    }
}
Write-Host "   ✅ Arquivos temporários removidos." -ForegroundColor Green

# 3. Reinstalação
Write-Host "`n📦 [3/5] Instalando dependências (pnpm install)..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Erro ao instalar dependências." -ForegroundColor Red
    exit 1 
}
Write-Host "   ✅ Dependências instaladas." -ForegroundColor Green

# 4. Infraestrutura
Write-Host "`n🚀 [4/5] Subindo Banco de Dados e Redis..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Erro ao subir Docker." -ForegroundColor Red
    exit 1 
}

Write-Host "   ⏳ Aguardando banco de dados inicializar (15s)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 5. Prisma (Generate & Migrate)
Write-Host "`n🗄️  [5/5] Configurando Banco de Dados (Prisma)..." -ForegroundColor Yellow

Write-Host "   - Gerando Cliente Prisma..."
pnpm --filter @fayol/database-models run generate

Write-Host "   - Aplicando Migrations (Resetando DB)..."
# O comando abaixo força a criação do banco limpo
pnpm --filter @fayol/database-models exec prisma migrate dev --name init_hard_reset --skip-generate

Write-Host "`n✅ AMBIENTE RESETADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Agora você pode rodar o backend:"
Write-Host "   pnpm --filter backend run dev" -ForegroundColor White
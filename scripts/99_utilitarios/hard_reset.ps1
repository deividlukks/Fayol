<#
.SYNOPSIS
    Fayol Hard Reset V4.0 - Limpeza Profunda, Reconstrução e Seed
.DESCRIPTION
    1. Encerra processos.
    2. Limpa arquivos e cache Docker.
    3. Reinstala dependências.
    4. Sobe containers.
    5. Aplica Migrations e Seed.
#>

$ErrorActionPreference = "Stop"

function Write-Header ($Msg) { Write-Host "`n========================================" -ForegroundColor Magenta; Write-Host "   $Msg" -ForegroundColor Magenta; Write-Host "========================================" -ForegroundColor Magenta }
function Write-Step ($Msg) { Write-Host "`n🔵 $Msg" -ForegroundColor Cyan }
function Write-Success ($Msg) { Write-Host "   ✅ $Msg" -ForegroundColor Green }
function Write-ErrorMsg ($Msg) { Write-Host "   ❌ $Msg" -ForegroundColor Red }

Clear-Host
Write-Header "🧹 FAYOL - HARD RESET SYSTEM (V4.0)"

# 1. Parar Processos
Write-Step "[1/7] Parando ambiente..."
try {
    docker compose down -v --remove-orphans 2>$null
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Success "Ambiente parado."
} catch {
    Write-Host "   ⚠️  Nenhum processo para parar." -ForegroundColor Yellow
}

# 2. Limpeza de Arquivos
Write-Step "[2/7] Removendo arquivos temporários e dependências..."
$dirsToRemove = @("node_modules", "dist", "build", ".turbo", ".next", "coverage", ".nyc_output", ".prisma")
$filesToRemove = @("pnpm-lock.yaml", "yarn.lock", "package-lock.json", ".eslintcache", "tsconfig.tsbuildinfo")

Get-ChildItem -Path . -Recurse -Force -ErrorAction SilentlyContinue | Where-Object {
    ($_.PSIsContainer -and $dirsToRemove -contains $_.Name) -or 
    (-not $_.PSIsContainer -and $filesToRemove -contains $_.Name)
} | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Success "Limpeza de arquivos concluída."

# 3. Limpeza Docker
Write-Step "[3/7] Limpando cache de build do Docker..."
docker builder prune -f | Out-Null
$images = docker images --format "{{.Repository}}" | Where-Object { $_ -like "fayol-*" }
if ($images) { docker rmi -f $images 2>$null }
Write-Success "Cache Docker limpo."

# 4. Instalação
Write-Step "[4/7] Instalando dependências..."
pnpm install --no-frozen-lockfile
if ($LASTEXITCODE -ne 0) { Write-ErrorMsg "Falha no pnpm install"; exit 1 }

# 5. Build
Write-Step "[5/7] Subindo containers (Build forçado)..."
# Gera o client do prisma localmente antes de subir, para evitar erros de tipagem no host
pnpm --filter @fayol/database-models run generate

docker compose up -d --build --force-recreate
if ($LASTEXITCODE -ne 0) { Write-ErrorMsg "Falha ao subir Docker"; exit 1 }

# 6. Aguardar Banco
Write-Step "[6/7] Aguardando inicialização do Banco de Dados..."
# Loop simples para esperar o Postgres estar pronto
for ($i=1; $i -le 30; $i++) {
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 1
    $health = docker inspect --format='{{.State.Health.Status}}' fayol_postgres 2>$null
    if ($health -eq "healthy") { break }
}
Write-Host ""

# 7. Migration e Seed
Write-Step "[7/7] Aplicando Migrations e Seed..."

# Roda a migração (cria as tabelas)
Write-Host "   - Executando Migrate..." -ForegroundColor Gray
# O comando migrate dev já aciona o seed automaticamente se configurado no package.json
pnpm --filter @fayol/database-models exec prisma migrate dev --name init_db --skip-generate

if ($LASTEXITCODE -ne 0) { 
    Write-ErrorMsg "Falha na migração. Tentando rodar db:push como alternativa..."
    pnpm --filter @fayol/database-models exec prisma db push
    pnpm --filter @fayol/database-models exec prisma db seed
} else {
    Write-Success "Banco de dados migrado e populado!"
}

Write-Header "🎉 AMBIENTE PRONTO! ACESSE: http://localhost:3000"
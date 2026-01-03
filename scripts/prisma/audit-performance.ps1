<#
.SYNOPSIS
    Fayol - Prisma Performance Audit
#>

$ErrorActionPreference = "Continue"

function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "🔎 Fayol - Prisma Performance Audit" "Yellow"
Write-Host "================================================"
Write-Host ""

# Muda para o diretório correto
$ScriptPath = $MyInvocation.MyCommand.Path
$PrismaDir = Resolve-Path (Join-Path (Split-Path $ScriptPath) "..\..\packages\database-models")
Set-Location $PrismaDir

Write-Color "📋 Executando auditoria completa..." "Cyan"
Write-Host ""

# 1. Validar Schema
Write-Color "1. Validando Prisma Schema..." "Yellow"
try {
    $ValidateOut = npx prisma validate 2>&1
    Write-Host $ValidateOut
    Write-Color "   ✓ Schema válido" "Green"
} catch {
    Write-Color "   ❌ Erro na validação" "Red"
}
Write-Host ""

# 2. Migrations
Write-Color "2. Verificando migrations..." "Yellow"
$MigrationStatus = npx prisma migrate status 2>&1 | Out-String
if ($MigrationStatus -match "database is up to date") {
    Write-Color "   ✓ Todas as migrations aplicadas" "Green"
} elseif ($MigrationStatus -match "pending") {
    Write-Color "   ✗ Há migrations pendentes!" "Red"
    Write-Host "     Execute: npx prisma migrate deploy"
} else {
    Write-Color "   ⚠ Status desconhecido" "Yellow"
}
Write-Host ""

# 3. Analisar Schema
Write-Color "3. Analisando índices e estatísticas..." "Yellow"
$SchemaContent = Get-Content "prisma/schema.prisma"

$IndexCount = ($SchemaContent | Select-String "@@index").Count
$UniqueCount = ($SchemaContent | Select-String "@@unique|@unique").Count
$Relations = ($SchemaContent | Select-String "@relation").Count
$Models = ($SchemaContent | Select-String "^model ").Count
$Enums = ($SchemaContent | Select-String "^enum ").Count

Write-Host "   Índices encontrados:    $IndexCount" -ForegroundColor Cyan
Write-Host "   Constraints únicos:     $UniqueCount" -ForegroundColor Cyan
Write-Host "   Total de relações:      $Relations" -ForegroundColor Cyan
Write-Host "   Models:                 $Models" -ForegroundColor Cyan
Write-Host "   Enums:                  $Enums" -ForegroundColor Cyan
Write-Host ""

# 6. Verificar Client
Write-Color "4. Verificando Prisma Client..." "Yellow"
$ClientPath = "..\..\node_modules\.pnpm\@prisma+client*"
if (Test-Path $ClientPath) {
    Write-Color "   ✓ Prisma Client gerado" "Green"
} else {
    Write-Color "   ✗ Prisma Client não encontrado" "Red"
}
Write-Host ""

# Recomendações
Write-Color "📊 Recomendações de Performance:" "Yellow"
Write-Host "================================================"

if ($IndexCount -lt 5) {
    Write-Color "⚠️  Poucos índices detectados ($IndexCount)" "Yellow"
    Write-Host "   Considere adicionar índices em campos de filtro (WHERE) e ordenação."
}

if ($Models -gt 50) {
    Write-Color "⚠️  Schema grande ($Models models)" "Yellow"
    Write-Host "   Considere separar em schemas menores."
}

Write-Color "✅ Auditoria completa!" "Green"
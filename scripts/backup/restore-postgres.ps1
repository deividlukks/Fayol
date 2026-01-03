<#
.SYNOPSIS
    Fayol - Restore do PostgreSQL
#>

param (
    [string]$BackupFilePath
)

$ErrorActionPreference = "Stop"
$ContainerName = "fayol_postgres"

# Cores
function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "🔄 Fayol - Restore PostgreSQL" "Yellow"
Write-Host "================================================"
Write-Host ""

$BackupDir = "backups"

# Se não passar arquivo, lista os disponíveis
if ([string]::IsNullOrEmpty($BackupFilePath)) {
    Write-Color "📋 Backups disponíveis:" "Cyan"
    Write-Host ""

    if (-not (Test-Path $BackupDir)) {
        Write-Color "❌ Nenhum diretório de backup encontrado." "Red"
        exit 1
    }

    $Files = Get-ChildItem -Path $BackupDir -Filter "fayol_backup_*.sql.gz" | Sort-Object LastWriteTime -Descending
    
    if ($Files.Count -eq 0) {
        Write-Color "❌ Nenhum backup encontrado em $BackupDir" "Red"
        exit 1
    }

    $Files | Select-Object -First 10 | Format-Table Name, LastWriteTime, @{N='Size(MB)';E={"{0:N2}" -f ($_.Length/1MB)}}

    Write-Host ""
    Write-Color "Uso:" "Yellow"
    Write-Host "  .\scripts\backup\restore-postgres.ps1 <caminho_do_arquivo>"
    exit 0
}

# Verifica arquivo
if (-not (Test-Path $BackupFilePath)) {
    Write-Color "❌ Erro: Arquivo '$BackupFilePath' não encontrado!" "Red"
    exit 1
}

# Confirmação
Write-Color "⚠️  ATENÇÃO: Esta ação irá SOBRESCREVER o banco de dados atual!" "Red"
$Confirmation = Read-Host "Deseja continuar? (digite 'CONFIRMO' para prosseguir)"

if ($Confirmation -ne "CONFIRMO") {
    Write-Color "❌ Operação cancelada." "Yellow"
    exit 0
}

# Verifica container
$ContainerStatus = docker ps | Select-String $ContainerName
if (-not $ContainerStatus) {
    Write-Color "❌ Erro: Container $ContainerName não está rodando!" "Red"
    exit 1
}

Write-Host ""
Write-Color "🔄 Restaurando backup..." "Yellow"
Write-Host "   Arquivo: $BackupFilePath"

# Parar serviços dependentes
Write-Color "⏸️  Parando serviços dependentes..." "Yellow"
docker-compose stop backend web-app telegram-bot

try {
    # Define usuário (fallback)
    $PgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "fayol_admin" }
    $FileName = Split-Path $BackupFilePath -Leaf

    Write-Host ""
    Write-Color "📥 Copiando para container e restaurando..." "Yellow"

    # 1. Copia para dentro do container (Evita pipe do Windows que pode corromper binário)
    docker cp $BackupFilePath "$($ContainerName):/tmp/$FileName"

    # 2. Executa restore interno
    # gunzip -c descompacta para stdout, psql lê do stdin
    docker exec $ContainerName sh -c "gunzip -c /tmp/$FileName | psql -U $PgUser -d postgres"

    # 3. Limpeza
    docker exec $ContainerName rm "/tmp/$FileName"

    Write-Host ""
    Write-Color "✅ Restore concluído com sucesso!" "Green"
    Write-Host ""

    Write-Color "🔄 Reiniciando serviços..." "Yellow"
    docker-compose up -d backend web-app telegram-bot

    Write-Host ""
    Write-Color "✨ Restore finalizado!" "Green"

} catch {
    Write-Color "❌ Erro ao executar restore: $_" "Red"
    exit 1
}
<#
.SYNOPSIS
    Fayol - Backup Manual do PostgreSQL
#>

$ErrorActionPreference = "Stop"

# Configurações
$BackupDir = "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "fayol_backup_$Timestamp.sql.gz"
$ContainerName = "fayol_postgres"

# Cores
function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "🗄️  Fayol - Backup PostgreSQL" "Yellow"
Write-Host "================================================"
Write-Host ""

# Cria diretório de backup
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

# Verifica se o container está rodando
$ContainerStatus = docker ps | Select-String $ContainerName
if (-not $ContainerStatus) {
    Write-Color "❌ Erro: Container $ContainerName não está rodando!" "Red"
    Write-Host "   Execute: docker-compose up -d postgres"
    exit 1
}

Write-Color "📦 Criando backup..." "Yellow"
Write-Host "   Arquivo: $BackupFile"
Write-Host "   Destino: $BackupDir"
Write-Host ""

# Define usuário e banco (fallback para padrão se variável de ambiente não existir)
$PgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "fayol_admin" }
$PgDb = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "fayol_db" }

# ESTRATÉGIA SEGURA WINDOWS:
# 1. Executa o dump e compressão DENTRO do container (evita problemas de encoding do PowerShell)
# 2. Copia o arquivo para fora
try {
    docker exec $ContainerName sh -c "pg_dump -U $PgUser -d $PgDb --clean --if-exists --create --no-owner --no-acl | gzip > /tmp/$BackupFile"
    
    # Copia do container para o host
    docker cp "$($ContainerName):/tmp/$BackupFile" "$BackupDir/$BackupFile"
    
    # Remove arquivo temporário do container
    docker exec $ContainerName rm "/tmp/$BackupFile"

    if (Test-Path "$BackupDir/$BackupFile") {
        $FileStats = Get-Item "$BackupDir/$BackupFile"
        $SizeMB = "{0:N2} MB" -f ($FileStats.Length / 1MB)
        
        Write-Color "✅ Backup criado com sucesso!" "Green"
        Write-Host "   Tamanho: $SizeMB"
        Write-Host "   Path: $FileStats.FullName"
        Write-Host ""

        Write-Color "📋 Últimos 5 backups:" "Yellow"
        Get-ChildItem -Path $BackupDir -Filter "fayol_backup_*.sql.gz" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 5 | 
            Format-Table Name, @{N='Size(MB)';E={"{0:N2}" -f ($_.Length/1MB)}}, LastWriteTime -AutoSize

        Write-Host ""
        Write-Color "✨ Backup concluído!" "Green"
    } else {
        throw "Arquivo não encontrado após cópia."
    }
} catch {
    Write-Color "❌ Erro ao criar backup: $_" "Red"
    exit 1
}
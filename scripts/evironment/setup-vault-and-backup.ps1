<#
.SYNOPSIS
    Fayol - Setup Completo: Vault + Backup
#>

$ErrorActionPreference = "Stop"

function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "🚀 FAYOL - SETUP VAULT & BACKUP 🚀" "Yellow"
Write-Host "Configuração automática de Vault e Backup"
Write-Host ""

# Verificações
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Color "❌ Docker não encontrado!" "Red"
    exit 1
}

# .env check
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Color "✅ Arquivo .env criado a partir do exemplo" "Green"
    } else {
        Write-Color "❌ .env.example não encontrado!" "Red"
        exit 1
    }
}

# Carregar variaveis do .env (Simples)
Get-Content .env | Where-Object { $_ -match "=" -and $_ -notmatch "^#" } | ForEach-Object {
    $Key, $Value = $_.Split('=', 2)
    [Environment]::SetEnvironmentVariable($Key.Trim(), $Value.Trim(), "Process")
}

Write-Color "ETAPA 1: Subir Infraestrutura" "Yellow"
docker-compose up -d postgres redis vault postgres-backup

Write-Color "⏳ Aguardando serviços..." "Cyan"
Start-Sleep -Seconds 10

# Verifica se o script de init existe e executa
if (Test-Path "scripts/vault/init-vault.ps1") {
    Write-Color "🔐 Configurando Vault..." "Cyan"
    & ".\scripts\vault\init-vault.ps1"
}

Write-Color "ETAPA 3: Criar Backup Inicial" "Yellow"
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

if (Test-Path "scripts/backup/backup-postgres.ps1") {
    Write-Color "💾 Criando backup inicial..." "Cyan"
    & ".\scripts\backup\backup-postgres.ps1"
}

Write-Color "✅ SETUP CONCLUÍDO COM SUCESSO!" "Green"
Write-Host "Vault UI: http://localhost:8200/ui"
<#
.SYNOPSIS
    Fayol - Listar Backups PostgreSQL
#>

$BackupDir = "backups"

function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "📋 Fayol - Backups PostgreSQL" "Yellow"
Write-Host "================================================"
Write-Host ""

if (-not (Test-Path $BackupDir)) {
    Write-Color "ℹ️  Diretório de backups não existe: $BackupDir" "Cyan"
    exit 0
}

Write-Color "🤖 Backups Automáticos:" "Green"
Write-Host ""

$SubDirs = @("daily", "weekly", "monthly")
$FoundAuto = $false

foreach ($Sub in $SubDirs) {
    if (Test-Path "$BackupDir\$Sub") {
        Write-Host "$Sub:"
        Get-ChildItem "$BackupDir\$Sub\*.sql.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | Format-Table Name, LastWriteTime, @{N='Size(MB)';E={"{0:N2}" -f ($_.Length/1MB)}} -HideTableHeaders
        $FoundAuto = $true
        Write-Host ""
    }
}

if (-not $FoundAuto) {
    # Tenta listar na raiz se não houver pastas
    $RootFiles = Get-ChildItem "$BackupDir\*.sql.gz" | Where-Object { $_.Name -notmatch "fayol_backup_" }
    if ($RootFiles) {
        $RootFiles | Select-Object -First 5 | Format-Table Name, LastWriteTime
    } else {
        Write-Host "  Nenhum backup automático encontrado."
    }
}

Write-Host ""
Write-Color "👤 Backups Manuais:" "Green"
Write-Host ""

$ManualFiles = Get-ChildItem "$BackupDir\fayol_backup_*.sql.gz"
if ($ManualFiles) {
    $ManualFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | Format-Table Name, LastWriteTime, @{N='Size(MB)';E={"{0:N2}" -f ($_.Length/1MB)}}
} else {
    Write-Host "  Nenhum backup manual encontrado."
}

Write-Host ""
Write-Color "💾 Espaço em Disco Total:" "Yellow"
$TotalSize = (Get-ChildItem $BackupDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Host "  $("{0:N2}" -f ($TotalSize / 1MB)) MB"

$TotalCount = (Get-ChildItem $BackupDir -Recurse -File -Filter "*.sql.gz").Count
Write-Color "Total de arquivos de backup: $TotalCount" "Cyan"
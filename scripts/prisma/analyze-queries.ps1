<#
.SYNOPSIS
    Fayol - Prisma Query Analyzer
#>

param (
    [string]$LogFile = "prisma-queries.log"
)

function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "📊 Fayol - Prisma Query Analyzer" "Yellow"
Write-Host "================================================"
Write-Host ""

if (-not (Test-Path $LogFile)) {
    Write-Color "Arquivo de log não encontrado: $LogFile" "Red"
    Write-Host ""
    Write-Color "Para capturar logs no Windows (PowerShell):" "Cyan"
    Write-Host '  $env:DEBUG="prisma:query"; pnpm run dev | Tee-Object -FilePath prisma-queries.log'
    exit 1
}

Write-Color "Analisando: $LogFile" "Green"
Write-Host ""

$Content = Get-Content $LogFile

# Queries mais executadas
Write-Color "📈 Top 10 Queries Mais Executadas:" "Yellow"
Write-Host "================================================"

$Queries = $Content | Where-Object { $_ -match "prisma:query SELECT" } | ForEach-Object {
    $_.Replace("prisma:query", "").Trim()
} 

if ($Queries) {
    $Queries | Group-Object | Sort-Object Count -Descending | Select-Object -First 10 | Format-Table Count, @{N="Query snippet"; E={$_.Name.Substring(0, [math]::Min(80, $_.Name.Length))}} -AutoSize
} else {
    Write-Host "Nenhuma query SELECT encontrada."
}
Write-Host ""

# Queries lentas
Write-Color "🐌 Queries Lentas (baseado em duration):" "Yellow"
Write-Host "================================================"
$SlowQueries = $Content | Where-Object { $_ -match "duration: \d+ms" } 
if ($SlowQueries) {
    $SlowQueries | Select-Object -First 10 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "Nenhuma informação de duração encontrada."
}
Write-Host ""

# Estatísticas
$TotalSelect = ($Content | Select-String "prisma:query SELECT").Count
$TotalInsert = ($Content | Select-String "prisma:query INSERT").Count
$TotalUpdate = ($Content | Select-String "prisma:query UPDATE").Count
$TotalDelete = ($Content | Select-String "prisma:query DELETE").Count
$TotalQueries = $TotalSelect + $TotalInsert + $TotalUpdate + $TotalDelete

Write-Color "📊 Estatísticas:" "Yellow"
Write-Host "================================================"
Write-Color "  Total de queries:   $TotalQueries" "Green"
Write-Color "  SELECT:             $TotalSelect" "Cyan"
Write-Color "  INSERT:             $TotalInsert" "Green"
Write-Color "  UPDATE:             $TotalUpdate" "Yellow"
Write-Color "  DELETE:             $TotalDelete" "Red"
Write-Host ""

Write-Color "✅ Análise completa!" "Green"
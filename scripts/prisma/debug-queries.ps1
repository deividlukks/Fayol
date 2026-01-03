<#
.SYNOPSIS
    Fayol - Prisma Debug Mode
#>

function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "🔍 Fayol - Prisma Debug Mode" "Yellow"
Write-Host "================================================"
Write-Host ""

Write-Color "Modo de Debug Disponíveis:" "Cyan"
Write-Host "  1. Query Logging            - Log todas as queries SQL"
Write-Host "  2. Error Logging            - Log apenas erros"
Write-Host "  3. Info Logging             - Log informações gerais"
Write-Host "  4. Warn Logging             - Log warnings"
Write-Host "  5. All Logging              - Log TUDO"
Write-Host "  6. Performance Tracing      - Analisa performance"
Write-Host ""

$Option = Read-Host "Escolha uma opção (1-6)"

switch ($Option) {
    "1" { $env:DEBUG="prisma:query"; Write-Color "Ativando Query Logging..." "Green" }
    "2" { $env:DEBUG="prisma:error"; Write-Color "Ativando Error Logging..." "Green" }
    "3" { $env:DEBUG="prisma:info"; Write-Color "Ativando Info Logging..." "Green" }
    "4" { $env:DEBUG="prisma:warn"; Write-Color "Ativando Warn Logging..." "Green" }
    "5" { $env:DEBUG="prisma:*"; Write-Color "Ativando ALL Logging..." "Green" }
    "6" { 
        $env:DEBUG="prisma:engine"
        $env:PRISMA_SHOW_ALL_TRACES="1"
        Write-Color "Ativando Performance Tracing..." "Green" 
    }
    Default { Write-Color "Opção inválida!" "Red"; exit 1 }
}

Write-Host ""
Write-Color "Iniciando aplicação com debug..." "Yellow"
Write-Host "Pressione Ctrl+C para parar"
Write-Host "================================================"

# Inicia o backend
Set-Location "apps/backend"
pnpm run dev
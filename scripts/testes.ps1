# Script para gerar todos os arquivos de teste
# Executar: .\scripts\generate-tests.ps1

$BASE_UI = "c:\Users\Deivid Lucas\Documents\Projetos\Fayol\packages\ui-components\tests"
$BASE_WEB = "c:\Users\Deivid Lucas\Documents\Projetos\Fayol\apps\web-app\tests"

# Criar estrutura de diretórios
@(
    "$BASE_UI\hooks",
    "$BASE_UI\components\ui",
    "$BASE_UI\components\forms",
    "$BASE_UI\components\layout",
    "$BASE_UI\components\charts",
    "$BASE_WEB\components",
    "$BASE_WEB\integration",
    "$BASE_WEB\e2e"
) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "✓ Created: $_"
    }
}

Write-Host "`n✅ Test directories created successfully!`n"
Write-Host "Next steps:"
Write-Host "1. Run: cd packages\ui-components && pnpm install"
Write-Host "2. Run: pnpm test to run tests`n"

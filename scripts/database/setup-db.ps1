# Script PowerShell para configurar PostgreSQL para Fayol
$env:PGPASSWORD = "postgres"
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando PostgreSQL para Fayol" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Criando usuário e banco de dados..." -ForegroundColor Yellow

# Executar arquivo SQL para criar usuário e banco
& $psqlPath -U postgres -f "C:\Users\deivi\Documents\Projetos\Fayol\scripts\database\create-fayol-db.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Usuário e banco criados!" -ForegroundColor Green

    Write-Host ""
    Write-Host "Configurando permissões..." -ForegroundColor Yellow

    # Conectar ao banco fayol_db e configurar permissões
    & $psqlPath -U postgres -d fayol_db -c "GRANT ALL PRIVILEGES ON DATABASE fayol_db TO fayol;"
    & $psqlPath -U postgres -d fayol_db -c "GRANT ALL ON SCHEMA public TO fayol;"
    & $psqlPath -U postgres -d fayol_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fayol;"
    & $psqlPath -U postgres -d fayol_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fayol;"
    & $psqlPath -U postgres -d fayol_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fayol;"
    & $psqlPath -U postgres -d fayol_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fayol;"

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detalhes da configuração:" -ForegroundColor White
    Write-Host "  • Usuário: fayol" -ForegroundColor White
    Write-Host "  • Senha: 2f3795e4198952e2ddf452c7" -ForegroundColor White
    Write-Host "  • Banco: fayol_db" -ForegroundColor White
    Write-Host "  • Host: localhost" -ForegroundColor White
    Write-Host "  • Porta: 5432" -ForegroundColor White
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. pnpm db:generate" -ForegroundColor White
    Write-Host "  2. pnpm db:migrate" -ForegroundColor White
    Write-Host "  3. pnpm db:seed" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERRO] Falha ao configurar o banco de dados" -ForegroundColor Red
    Write-Host "Código de erro: $LASTEXITCODE" -ForegroundColor Red
}

# Limpar variável de senha
$env:PGPASSWORD = $null

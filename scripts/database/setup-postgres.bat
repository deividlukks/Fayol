@echo off
setlocal

set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"
set PGUSER=postgres
set PGPASSWORD=350614561008ecc5032a25980b317d23

echo ========================================
echo Configurando PostgreSQL para Fayol
echo ========================================
echo.

echo Tentando conectar ao PostgreSQL...
echo.

REM Criar usuário e banco de dados
%PSQL% -U %PGUSER% -c "CREATE USER fayol WITH PASSWORD '2f3795e4198952e2ddf452c7';" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Usuario 'fayol' criado
) else (
    echo [INFO] Usuario 'fayol' ja existe ou erro ao criar
)

%PSQL% -U %PGUSER% -c "CREATE DATABASE fayol_db OWNER fayol ENCODING 'UTF8';" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Banco 'fayol_db' criado
) else (
    echo [INFO] Banco 'fayol_db' ja existe ou erro ao criar
)

%PSQL% -U %PGUSER% -d fayol_db -c "GRANT ALL PRIVILEGES ON DATABASE fayol_db TO fayol;" 2>nul
%PSQL% -U %PGUSER% -d fayol_db -c "GRANT ALL ON SCHEMA public TO fayol;" 2>nul
%PSQL% -U %PGUSER% -d fayol_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fayol;" 2>nul
%PSQL% -U %PGUSER% -d fayol_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fayol;" 2>nul

echo.
echo [OK] Permissoes configuradas
echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
echo.
echo Detalhes:
echo   Usuario: fayol
echo   Senha: 2f3795e4198952e2ddf452c7
echo   Banco: fayol_db
echo   Host: localhost
echo   Porta: 5432
echo.
echo Proximo passo: pnpm db:generate
echo.

endlocal

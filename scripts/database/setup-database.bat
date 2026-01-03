@echo off
REM ==========================================
REM FAYOL - Script de Configuração do PostgreSQL
REM ==========================================

echo ========================================
echo FAYOL - Configuracao do PostgreSQL 18.1
echo ========================================
echo.

REM Tentar encontrar o psql nos locais comuns de instalação
set "PSQL_PATH="

REM Verificar PostgreSQL 18
if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe"
)

REM Verificar PostgreSQL 17 (caso tenha instalado versão diferente)
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files\PostgreSQL\17\bin\psql.exe"
)

REM Verificar PostgreSQL 16
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe"
)

REM Verificar se encontrou o psql
if "%PSQL_PATH%"=="" (
    echo [ERRO] PostgreSQL nao encontrado!
    echo.
    echo Por favor, verifique se o PostgreSQL esta instalado em:
    echo   C:\Program Files\PostgreSQL\
    echo.
    echo Ou adicione o diretorio bin do PostgreSQL ao PATH do sistema.
    echo.
    pause
    exit /b 1
)

echo [OK] PostgreSQL encontrado em: %PSQL_PATH%
echo.
echo IMPORTANTE: Voce precisara digitar a senha do usuario 'postgres'
echo que voce definiu durante a instalacao do PostgreSQL.
echo.
pause

REM Executar o script SQL
"%PSQL_PATH%" -U postgres -f "%~dp0setup-database.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCESSO! Banco de dados configurado.
    echo ========================================
    echo.
    echo Proximos passos:
    echo   1. pnpm db:generate
    echo   2. pnpm db:migrate
    echo   3. pnpm db:seed
    echo.
) else (
    echo.
    echo ========================================
    echo [ERRO] Falha ao configurar o banco
    echo ========================================
    echo.
    echo Verifique se:
    echo   1. O PostgreSQL esta rodando
    echo   2. A senha do usuario 'postgres' esta correta
    echo   3. Voce tem permissoes de administrador
    echo.
)

pause

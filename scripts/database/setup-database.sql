-- ==========================================
-- FAYOL - Script de Configuração do Banco de Dados PostgreSQL 18.1
-- ==========================================
-- INSTRUÇÕES:
-- 1. Abra o "SQL Shell (psql)" do menu Iniciar do Windows
-- 2. Conecte como usuário 'postgres' (vai pedir senha que você definiu na instalação)
-- 3. Execute: \i C:/Users/deivi/Documents/Projetos/Fayol/scripts/setup-database.sql
-- ==========================================

-- Criar o usuário 'fayol'
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'fayol') THEN
        CREATE USER fayol WITH PASSWORD '2f3795e4198952e2ddf452c7';
        RAISE NOTICE 'Usuário fayol criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário fayol já existe.';
    END IF;
END
$$;

-- Criar o banco de dados 'fayol_db' se não existir
SELECT 'CREATE DATABASE fayol_db OWNER fayol ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fayol_db')\gexec

-- Mensagem de confirmação
\echo '✓ Usuário fayol criado/verificado'
\echo '✓ Banco de dados fayol_db criado/verificado'
\echo ''
\echo 'Agora vamos conectar ao banco fayol_db e configurar permissões...'
\echo ''

-- Conectar ao banco criado
\c fayol_db

-- Conceder todas as permissões ao usuário fayol
GRANT ALL PRIVILEGES ON DATABASE fayol_db TO fayol;
GRANT ALL ON SCHEMA public TO fayol;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fayol;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fayol;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO fayol;

-- Configurar privilégios padrão para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO fayol;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO fayol;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO fayol;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '✓ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!'
\echo '════════════════════════════════════════════════════════════'
\echo ''
\echo 'Detalhes da configuração:'
\echo '  • Usuário: fayol'
\echo '  • Senha: 2f3795e4198952e2ddf452c7'
\echo '  • Banco: fayol_db'
\echo '  • Host: localhost'
\echo '  • Porta: 5432'
\echo ''
\echo 'Próximos passos:'
\echo '  1. Execute: pnpm db:generate'
\echo '  2. Execute: pnpm db:migrate'
\echo '  3. Execute: pnpm db:seed'
\echo ''
\echo '════════════════════════════════════════════════════════════'

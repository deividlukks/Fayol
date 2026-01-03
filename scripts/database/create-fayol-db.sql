-- Criar usuário fayol se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'fayol') THEN
        CREATE USER fayol WITH PASSWORD '2f3795e4198952e2ddf452c7';
        RAISE NOTICE 'Usuário fayol criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário fayol já existe.';
    END IF;
END
$$;

-- Criar banco de dados se não existir
SELECT 'CREATE DATABASE fayol_db OWNER fayol ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fayol_db')\gexec

\echo 'Configuracao basica concluida. Agora conectando ao banco fayol_db...'

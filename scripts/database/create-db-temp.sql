-- Criar usuário fayol
CREATE USER fayol WITH PASSWORD '2f3795e4198952e2ddf452c7';

-- Criar banco de dados
CREATE DATABASE fayol_db OWNER fayol ENCODING 'UTF8';

-- Mensagem de sucesso
\echo 'Usuario e banco criados com sucesso!'

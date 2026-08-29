#!/bin/bash
set -euo pipefail

# Banco de testes de integração — criado uma vez na inicialização do volume.
TEST_DB="${CISNE_TEST_DB:-cisne_local_test}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  SELECT format('CREATE DATABASE %I OWNER %I', '${TEST_DB}', '${POSTGRES_USER}')
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${TEST_DB}')\gexec
EOSQL

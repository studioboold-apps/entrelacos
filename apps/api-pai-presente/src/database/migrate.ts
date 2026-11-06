/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { migrate } from 'drizzle-orm/bun-sql/migrator';

import { readDatabaseEnvironment } from '../config/environment';
import { createDatabaseClient } from './client';
import { listSdkMigrations } from './sdk-migrations';

const database = createDatabaseClient(readDatabaseEnvironment().DATABASE_URL);

await migrate(database, { migrationsFolder: './drizzle' });

// Os modulos do SDK trazem schema e journal proprios (`user`, `customer`,
// `recommendation`): nenhuma tabela deles entra em `./drizzle`, e um upgrade
// de pacote nunca parece migration do produto.
for (const sdk of listSdkMigrations()) {
  await migrate(database, { migrationsFolder: sdk.folder, migrationsTable: sdk.table });
}

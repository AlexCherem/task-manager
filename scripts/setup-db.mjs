import { readdir, readFile } from 'node:fs/promises';

import { getDb } from '../src/server/db.ts';

try {
  const directory = new URL('../db/schema/', import.meta.url);
  const files = (await readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const statements = await Promise.all(
    files.map((name) => readFile(new URL(name, directory), 'utf8')),
  );
  const sql = getDb();
  await sql.transaction(
    statements.map((statement) => sql.query(statement)),
    { fetchOptions: { signal: AbortSignal.timeout(30_000) } },
  );
  console.log('Таблицы task_lists и tasks подготовлены.');
} catch {
  console.error(
    'Не удалось подготовить схему PostgreSQL. Проверьте подключение и SQL-файлы.',
  );
  process.exitCode = 1;
}
